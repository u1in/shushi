import { shushi } from '@u1in/shushi-core'
import { formatMacro, minifyMacroForCopy } from '@u1in/shushi-macro'

export interface MacroExample {
  label: string
  source: string
}

/** 宏试验区示例与首页计算器共用默认显示设置，避免维护第二份版式源码。 */
const DEFAULT_GRID_SETTINGS = {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
}

/** 示例均从“计算 → 布局 → 官方复制导出 API”生成，页面不保留人工拼接的宏字符串。 */
const toPlaygroundSource = (source: string): string => minifyMacroForCopy(source)

const createAdditionExample = (): MacroExample => {
  const result = shushi({
    operation: 'addition',
    values: ['356', '278'],
    settings: { ...DEFAULT_GRID_SETTINGS, showCarrySteps: true },
  })
  const computation = result.computation
  return {
    label: `356 + 278 = ${computation.sumDigits}`,
    source: toPlaygroundSource(result.source),
  }
}

const createSubtractionExample = (): MacroExample => {
  const result = shushi({
    operation: 'subtraction',
    operands: ['502', '137'],
    settings: { ...DEFAULT_GRID_SETTINGS, showBorrowSteps: true },
  })
  const computation = result.computation
  return {
    label: `502 − 137 = ${computation.differenceDigits}`,
    source: toPlaygroundSource(result.source),
  }
}

const createMultiplicationExample = (): MacroExample => {
  const result = shushi({
    operation: 'multiplication',
    operands: ['97', '89'],
    settings: {
      ...DEFAULT_GRID_SETTINGS,
      showCarrySteps: true,
      uniformMultiplicationBars: false,
    },
  })
  const computation = result.computation
  return {
    label: `97 × 89 = ${computation.productDigits}`,
    source: toPlaygroundSource(result.source),
  }
}

const createDivisionExample = (): MacroExample => {
  const result = shushi({
    operation: 'division',
    divisor: '25',
    dividend: '10230',
    calculation: { resultMode: 'decimal' },
    settings: {
      ...DEFAULT_GRID_SETTINGS,
      bracketBend: 1,
      uniformSubtractionBars: false,
      showZeroQuotientSteps: false,
    },
  })
  const computation = result.computation
  return {
    label: `10230 ÷ 25 = ${computation.quotientText}`,
    source: toPlaygroundSource(result.source),
  }
}

const createFactorizationExample = (): MacroExample => {
  const result = shushi({
    operation: 'shortDivision',
    mode: 'factorization',
    values: ['60'],
    settings: { ...DEFAULT_GRID_SETTINGS, showRemainders: false },
  })
  const computation = result.computation
  if (computation.mode !== 'factorization') throw new Error('短除法分解示例未返回质因数分解结果。')
  return {
    label: `短除法 · 60 = ${computation.factorizationText}`,
    source: toPlaygroundSource(result.source),
  }
}

const createCommonFactorExample = (): MacroExample => {
  const result = shushi({
    operation: 'shortDivision',
    mode: 'commonFactor',
    values: ['60', '84'],
    settings: { ...DEFAULT_GRID_SETTINGS, showRemainders: false },
  })
  const computation = result.computation
  return {
    label: `最大公约数 · ${computation.inputValues.join(' 与 ')}`,
    source: toPlaygroundSource(result.source),
  }
}

/** 每个示例题目都由对应计算器与布局器实时转换，保证复制链路和首页演示同源。 */
export const arithmeticExamples: MacroExample[] = [
  createAdditionExample(),
  createSubtractionExample(),
  createMultiplicationExample(),
  createDivisionExample(),
  createFactorizationExample(),
  createCommonFactorExample(),
]

/** 示例载入后统一格式化；格式化失败时退回原串，保证示例按钮始终可用。 */
export const formatExampleSource = (source: string): string => {
  try {
    return formatMacro(source)
  } catch {
    return source
  }
}
