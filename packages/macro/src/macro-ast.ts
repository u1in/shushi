import type { MacroCall, MacroNode } from './types'

/**
 * 宏 AST 的通用读取工具。
 * 基础宏与语法糖宏都通过这里读取调用和 KV，避免两套规则各自解释同一份源码。
 */
export const getMacroCall = (
  node: MacroNode,
  name?: string,
  zeroArgumentMacros: ReadonlySet<string> = new Set(),
): MacroCall | undefined => {
  if (node.kind === 'call') return name === undefined || node.name === name ? node : undefined
  if (node.kind === 'symbol' && zeroArgumentMacros.has(node.name) && (name === undefined || node.name === name)) {
    return { kind: 'call', name: node.name, arguments: [] }
  }
  return undefined
}

export const getMacroValue = (node: MacroNode, context: string): string => {
  if (node.kind === 'literal') return node.value
  if (node.kind === 'symbol') return node.name
  throw new Error(`${context} 只能使用文本、数字或保留常量。`)
}

export const getMacroKv = (
  node: MacroNode,
  zeroArgumentMacros: ReadonlySet<string>,
): { key: string; value: string } | undefined => {
  const call = getMacroCall(node, 'KV', zeroArgumentMacros)
  if (!call) return undefined
  if (call.arguments.length !== 2) throw new Error('KV 必须包含键和值两个参数，例如 KV(span, previous)。')
  return {
    key: getMacroValue(call.arguments[0], 'KV 的键'),
    value: getMacroValue(call.arguments[1], 'KV 的值'),
  }
}

/** 将子节点拆为图元和 KV 配置，供所有宏共享同一套重复配置检查。 */
export const splitMacroOptions = (
  nodes: MacroNode[],
  zeroArgumentMacros: ReadonlySet<string>,
): { content: MacroNode[]; options: Map<string, string> } => {
  const content: MacroNode[] = []
  const options = new Map<string, string>()
  nodes.forEach((node) => {
    const option = getMacroKv(node, zeroArgumentMacros)
    if (!option) {
      content.push(node)
      return
    }
    if (options.has(option.key)) throw new Error(`配置 ${option.key} 被重复设置。`)
    options.set(option.key, option.value)
  })
  return { content, options }
}

export const getPositiveNumber = (value: string | undefined, label: string, fallback: number): number => {
  if (value === undefined) return fallback
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue) || numericValue <= 0) throw new Error(`${label} 必须是正数。`)
  return numericValue
}

export const getPositiveInteger = (value: string | undefined, label: string, fallback: number): number => {
  const numericValue = getPositiveNumber(value, label, fallback)
  if (!Number.isInteger(numericValue)) throw new Error(`${label} 必须是正整数。`)
  return numericValue
}

export const getBoolean = (value: string | undefined, label: string, fallback: boolean): boolean => {
  if (value === undefined) return fallback
  if (value === 'true') return true
  if (value === 'false') return false
  throw new Error(`${label} 只能是 true 或 false。`)
}
