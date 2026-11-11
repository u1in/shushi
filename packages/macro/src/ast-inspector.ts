import type { GridScene } from '@u1in/shushi-grid'
import { compileMacroAstForInspection } from './compiler'
import type { MacroCompileOptions } from './compiler'
import { formatMacroAst, minifyMacro, minifyMacroAst } from './formatter'
import { parseMacro } from './parser'
import type { MacroCall, MacroLiteral, MacroNode } from './types'

/** AST 路径从根节点开始，数组每一项表示进入当前调用的第几个参数。 */
export type MacroNodePath = readonly number[]

/** AST 检查器回写源码时支持的两种输入框风格。 */
export type MacroSourceStyle = 'formatted' | 'minified'

/** 同一 CELL 中可被点击图元继承的删除线类型。 */
export type MacroStrikeKind = 'STRIKE' | 'STRIKEDOT'

/** 一个可点击网格元素与其来源宏节点的关联；文字和固定符号都可以单独编辑。 */
export interface MacroElementAstReference {
  elementId: string
  node: MacroNode
  nodePath: MacroNodePath
  literalPath?: MacroNodePath
  text?: string
  /** 当前图元所在 CELL 的删除线路径；数字图元被删除线覆盖时也可操作它。 */
  strikePath?: MacroNodePath
  strikeKind?: MacroStrikeKind
}

/**
 * 宏检查结果把通用场景和 AST 引用并列返回，避免让 GridScene 依赖宏语言。
 * updateElementText 返回新检查结果，使调用方可以保留撤销记录而不原地污染旧 AST。
 */
export interface MacroAstInspection {
  ast: MacroCall
  scene: GridScene
  sourceStyle: MacroSourceStyle
  source: string
  minifiedSource: string
  references: Readonly<Record<string, MacroElementAstReference>>
  updateElementText: (elementId: string, text: string) => MacroAstInspection
  removeElementStrike: (elementId: string) => MacroAstInspection
}

/** 为整棵 AST 建立对象身份到路径的索引，编译观察器可直接回查来源节点。 */
const indexNodePaths = (node: MacroNode, path: number[], paths: Map<MacroNode, MacroNodePath>): void => {
  paths.set(node, path)
  if (node.kind === 'call') node.arguments.forEach((child, index) => indexNodePaths(child, [...path, index], paths))
}

const EDITABLE_FIXED_SYMBOL_NAMES = new Set(['SQUARE', 'TRIANGLE', 'ROUND'])

const isEditableFixedSymbol = (node: MacroNode): boolean =>
  node.kind === 'symbol' && EDITABLE_FIXED_SYMBOL_NAMES.has(node.name)

/** 从位置宏中找到第一段可编辑文字；固定符号使用自身节点作为可编辑路径。 */
const findFirstLiteralPath = (node: MacroNode, path: MacroNodePath): MacroNodePath | undefined => {
  if (node.kind === 'literal') return path
  if (isEditableFixedSymbol(node)) return path
  if (node.kind !== 'call') return undefined
  for (const [index, child] of node.arguments.entries()) {
    const literalPath = findFirstLiteralPath(child, [...path, index])
    if (literalPath) return literalPath
  }
  return undefined
}

/** 按路径读取 AST 节点；内部使用路径而不是元素数组下标，避免渲染顺序变化误改数据。 */
const getNodeAtPath = (root: MacroCall, path: MacroNodePath): MacroNode | undefined => {
  let node: MacroNode = root
  for (const index of path) {
    if (node.kind !== 'call') return undefined
    node = node.arguments[index]
    if (!node) return undefined
  }
  return node
}

const getStrikeKind = (node: MacroNode | undefined): MacroStrikeKind | undefined => {
  if (node?.kind === 'call' && node.name === 'STRIKE') return 'STRIKE'
  if (node?.kind === 'symbol' && (node.name === 'STRIKE' || node.name === 'STRIKEDOT')) return node.name
  return undefined
}

/** 查找当前图元自身或同一 CELL 中的删除线，让点击数字时也能显示删除操作。 */
const findStrikeReference = (
  root: MacroCall,
  nodePath: MacroNodePath,
): { path: MacroNodePath; kind: MacroStrikeKind } | undefined => {
  const directNode = getNodeAtPath(root, nodePath)
  const directKind = getStrikeKind(directNode)
  if (directKind) return { path: nodePath, kind: directKind }

  for (let depth = nodePath.length - 1; depth >= 0; depth -= 1) {
    const parentPath = nodePath.slice(0, depth)
    const parent = getNodeAtPath(root, parentPath)
    if (parent?.kind !== 'call' || parent.name !== 'CELL') continue
    const strikeIndex = parent.arguments.findIndex((child) => getStrikeKind(child) !== undefined)
    if (strikeIndex < 0) continue
    const strikePath = [...parentPath, strikeIndex]
    const strikeKind = getStrikeKind(parent.arguments[strikeIndex])
    if (strikeKind) return { path: strikePath, kind: strikeKind }
  }
  return undefined
}

/** 不可变地替换一个文字节点，确保一次点击只修改被选元素对应的数据。 */
const replaceLiteralAtPath = (root: MacroCall, path: MacroNodePath, text: string): MacroCall => {
  const replace = (node: MacroNode, depth: number): MacroNode => {
    if (depth === path.length) {
      if (node.kind !== 'literal') throw new Error('选中的宏元素不包含可编辑文字。')
      const literal: MacroLiteral = { kind: 'literal', value: text }
      return literal
    }
    if (node.kind !== 'call') throw new Error('选中的 AST 路径无效。')
    const childIndex = path[depth]
    const child = node.arguments[childIndex]
    if (!child) throw new Error('选中的 AST 路径无效。')
    const argumentsList = [...node.arguments]
    argumentsList[childIndex] = replace(child, depth + 1)
    return { ...node, arguments: argumentsList }
  }
  return replace(root, 0) as MacroCall
}

/** 只有在当前语法位置允许裸文字时，固定符号才直接替换为文字字面量。 */
const canUseLiteralAtPath = (root: MacroCall, path: MacroNodePath): boolean => {
  if (path.length === 0) return false
  const parent = getNodeAtPath(root, path.slice(0, -1))
  if (parent?.kind !== 'call') return false
  if (parent.name === 'ROW') return true
  // 方括号 CELL 的后续项仍不能省略 MM；首项可以直接写成裸文字。
  return parent.name === 'CELL' && path[path.length - 1] === 0
}

/** 固定符号优先直接写成文字；方括号 CELL 的后续项保留 MM 以维持简写语法合法。 */
const replaceEditableTextAtPath = (root: MacroCall, path: MacroNodePath, text: string): MacroCall => {
  const node = getNodeAtPath(root, path)
  if (node && isEditableFixedSymbol(node)) {
    return replaceNodeAtPath(
      root,
      path,
      canUseLiteralAtPath(root, path)
        ? { kind: 'literal', value: text }
        : { kind: 'call', name: 'MM', arguments: [{ kind: 'literal', value: text }] },
    )
  }
  return replaceLiteralAtPath(root, path, text)
}

/** 不可变地替换 AST 节点；删除线回退为 DOT 时仍沿用同一条回写链路。 */
const replaceNodeAtPath = (root: MacroCall, path: MacroNodePath, replacement: MacroNode): MacroCall => {
  const replace = (node: MacroNode, depth: number): MacroNode => {
    if (depth === path.length) return replacement
    if (node.kind !== 'call') throw new Error('选中的 AST 路径无效。')
    const childIndex = path[depth]
    const child = node.arguments[childIndex]
    if (!child) throw new Error('选中的 AST 路径无效。')
    const argumentsList = [...node.arguments]
    argumentsList[childIndex] = replace(child, depth + 1)
    return { ...node, arguments: argumentsList }
  }
  return replace(root, 0) as MacroCall
}

/** 从父调用中不可变地移除一个 AST 节点，例如 CELL(MM(5), STRIKE) 中的 STRIKE。 */
const removeNodeAtPath = (root: MacroCall, path: MacroNodePath): MacroCall => {
  if (path.length === 0) throw new Error('不能删除宏根节点。')
  const parentPath = path.slice(0, -1)
  const childIndex = path[path.length - 1]
  const parent = getNodeAtPath(root, parentPath)
  if (parent?.kind !== 'call' || !parent.arguments[childIndex]) throw new Error('选中的 AST 路径无效。')
  return replaceNodeAtPath(root, parentPath, {
    ...parent,
    arguments: parent.arguments.filter((_, index) => index !== childIndex),
  })
}

/** 将 STRIKEDOT 转回 DOT，或直接移除 STRIKE；两种操作都返回新的检查结果。 */
const removeStrikeAtPath = (root: MacroCall, path: MacroNodePath): MacroCall => {
  const node = getNodeAtPath(root, path)
  if (node?.kind === 'symbol' && node.name === 'STRIKEDOT') {
    return replaceNodeAtPath(root, path, { kind: 'symbol', name: 'DOT' })
  }
  if ((node?.kind === 'call' && node.name === 'STRIKE') || (node?.kind === 'symbol' && node.name === 'STRIKE')) {
    return removeNodeAtPath(root, path)
  }
  throw new Error('选中的宏元素不是可删除的删除线。')
}

/** 将 AST 编译为场景，同时记录每一个渲染元素回溯到的宏节点。 */
const inspectMacroAst = (
  ast: MacroCall,
  sourceStyle: MacroSourceStyle,
  sourceShape: string,
  options?: MacroCompileOptions,
): MacroAstInspection => {
  const nodePaths = new Map<MacroNode, MacroNodePath>()
  indexNodePaths(ast, [], nodePaths)
  const references: Record<string, MacroElementAstReference> = {}
  const scene = compileMacroAstForInspection(
    ast,
    (element, node) => {
      const nodePath = nodePaths.get(node)
      if (!nodePath) return
      const literalPath = findFirstLiteralPath(node, nodePath)
      const literal = literalPath ? getNodeAtPath(ast, literalPath) : undefined
      const strikeReference = findStrikeReference(ast, nodePath)
      references[element.id] = {
        elementId: element.id,
        node,
        nodePath,
        ...(literalPath ? { literalPath } : {}),
        ...(literal?.kind === 'literal'
          ? { text: literal.value }
          : element.content.kind === 'text' && isEditableFixedSymbol(node)
            ? { text: element.content.text }
            : {}),
        ...(strikeReference ? { strikePath: strikeReference.path, strikeKind: strikeReference.kind } : {}),
      }
    },
    options,
  )
  return {
    ast,
    scene,
    sourceStyle,
    source: formatMacroAst(ast, sourceStyle, sourceShape),
    minifiedSource: minifyMacroAst(ast),
    references,
    updateElementText: (elementId, text) => {
      const reference = references[elementId]
      if (!reference?.literalPath) throw new Error('选中的宏元素不包含可编辑文字。')
      return inspectMacroAst(
        replaceEditableTextAtPath(ast, reference.literalPath, text),
        sourceStyle,
        sourceShape,
        options,
      )
    },
    removeElementStrike: (elementId) => {
      const reference = references[elementId]
      if (!reference) throw new Error('选中的宏元素不存在。')
      return inspectMacroAst(
        removeStrikeAtPath(ast, reference.strikePath ?? reference.nodePath),
        sourceStyle,
        sourceShape,
        options,
      )
    },
  }
}

/** 从完整宏源码创建可点击的 AST 检查结果。 */
export const createMacroAstInspection = (source: string, options?: MacroCompileOptions): MacroAstInspection => {
  const sourceStyle: MacroSourceStyle = source.trim() === minifyMacro(source) ? 'minified' : 'formatted'
  return inspectMacroAst(parseMacro(source), sourceStyle, source, options)
}
