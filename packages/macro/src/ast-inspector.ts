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

/** 一个可点击网格元素与其来源宏节点的关联；文本存在时可单独编辑。 */
export interface MacroElementAstReference {
  elementId: string
  node: MacroNode
  nodePath: MacroNodePath
  literalPath?: MacroNodePath
  text?: string
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
}

/** 为整棵 AST 建立对象身份到路径的索引，编译观察器可直接回查来源节点。 */
const indexNodePaths = (node: MacroNode, path: number[], paths: Map<MacroNode, MacroNodePath>): void => {
  paths.set(node, path)
  if (node.kind === 'call') node.arguments.forEach((child, index) => indexNodePaths(child, [...path, index], paths))
}

/** 从位置宏中找到第一段可编辑文字；LINE、BRACKET 等无文字图元会返回 undefined。 */
const findFirstLiteralPath = (node: MacroNode, path: MacroNodePath): MacroNodePath | undefined => {
  if (node.kind === 'literal') return path
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
      references[element.id] = {
        elementId: element.id,
        node,
        nodePath,
        ...(literalPath ? { literalPath } : {}),
        ...(literal?.kind === 'literal' ? { text: literal.value } : {}),
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
      return inspectMacroAst(replaceLiteralAtPath(ast, reference.literalPath, text), sourceStyle, sourceShape, options)
    },
  }
}

/** 从完整宏源码创建可点击的 AST 检查结果。 */
export const createMacroAstInspection = (source: string, options?: MacroCompileOptions): MacroAstInspection => {
  const sourceStyle: MacroSourceStyle = source.trim() === minifyMacro(source) ? 'minified' : 'formatted'
  return inspectMacroAst(parseMacro(source), sourceStyle, source, options)
}
