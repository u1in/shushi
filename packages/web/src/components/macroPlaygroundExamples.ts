import {
  computeAddition,
  computeDivision,
  computeMultiplication,
  computeShortDivision,
  computeSubtraction,
} from '@u1in/shushi-calculators'
import {
  createAdditionMacroSource,
  createDivisionMacroSource,
  createMultiplicationMacroSource,
  createShortDivisionMacroSource,
  createSubtractionMacroSource,
} from '@u1in/shushi-layout'
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
  const computation = computeAddition('356', '278')
  return {
    label: `356 + 278 = ${computation.sumDigits}`,
    source: toPlaygroundSource(createAdditionMacroSource(computation, { ...DEFAULT_GRID_SETTINGS, showCarrySteps: true })),
  }
}

const createSubtractionExample = (): MacroExample => {
  const computation = computeSubtraction('502', '137')
  return {
    label: `502 − 137 = ${computation.differenceDigits}`,
    source: toPlaygroundSource(createSubtractionMacroSource(computation, { ...DEFAULT_GRID_SETTINGS, showBorrowSteps: true })),
  }
}

const createMultiplicationExample = (): MacroExample => {
  const computation = computeMultiplication('97', '89')
  return {
    label: `97 × 89 = ${computation.productDigits}`,
    source: toPlaygroundSource(createMultiplicationMacroSource(computation, {
      ...DEFAULT_GRID_SETTINGS,
      showCarrySteps: true,
      uniformMultiplicationBars: false,
    })),
  }
}

const createDivisionExample = (): MacroExample => {
  const computation = computeDivision('25', '10230', { resultMode: 'decimal' })
  return {
    label: `10230 ÷ 25 = ${computation.quotientText}`,
    source: toPlaygroundSource(createDivisionMacroSource(computation, {
      ...DEFAULT_GRID_SETTINGS,
      bracketBend: 1,
      uniformSubtractionBars: false,
      showZeroQuotientSteps: false,
    })),
  }
}

const createFactorizationExample = (): MacroExample => {
  const computation = computeShortDivision({ mode: 'factorization', values: ['60'] })
  if (computation.mode !== 'factorization') throw new Error('短除法分解示例未返回质因数分解结果。')
  return {
    label: `短除法 · 60 = ${computation.factorizationText}`,
    source: toPlaygroundSource(createShortDivisionMacroSource(computation, { ...DEFAULT_GRID_SETTINGS, showRemainders: false })),
  }
}

const createCommonFactorExample = (): MacroExample => {
  const computation = computeShortDivision({ mode: 'commonFactor', values: ['60', '84'] })
  return {
    label: `最大公约数 · ${computation.inputValues.join(' 与 ')}`,
    source: toPlaygroundSource(createShortDivisionMacroSource(computation, { ...DEFAULT_GRID_SETTINGS, showRemainders: false })),
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
