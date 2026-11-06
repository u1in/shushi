/** Semantic process contracts emitted by operation calculators. */
export type DivisionResultMode = 'decimal' | 'remainder'

export type QuotientToken =
  | { kind: 'digit', digit: string, column: number }
  | { kind: 'decimalSeparator', digit: '.', column: number }

export interface LongDivisionStep {
  dividendColumn: number
  divisor: string
  quotientDigit: string
  partialDividend: string
  product: string
  remainder: string
}

export interface DivisionComputation {
  divisorDigits: string
  dividendDigits: string
  quotientText: string
  quotientTokens: QuotientToken[]
  steps: LongDivisionStep[]
  remainder: string
  hasFraction: boolean
  fractionalDigitCount: number
  decimalFallback: boolean
  integerStartColumn: number
  digitColumnCount: number
}

export interface DivisionOptions {
  resultMode?: DivisionResultMode
  maxDecimalDigits?: number
}

/** 短除法的教学用途；每种用途的终止条件不同。 */
export type ShortDivisionMode = 'division' | 'factorization' | 'commonFactor' | 'baseConversion'

/** 一次短除法行：右侧的原数被左侧除数除后，商写到下一行。 */
export interface ShortDivisionStep {
  divisor: string
  dividends: string[]
  quotients: string[]
  /** 进制转换才记录余数；质因数与公因数短除法均为 0。 */
  remainders: string[]
}

interface ShortDivisionBaseComputation {
  mode: ShortDivisionMode
  inputValues: string[]
  steps: ShortDivisionStep[]
  finalValues: string[]
}

/** 指定左侧除数的一次短除法；通过结构化 `division` mode 调用。 */
export interface DivisionShortDivisionComputation extends ShortDivisionBaseComputation {
  mode: 'division'
  divisor: string
  quotient: string
  remainder: string
}

/** 分解质因数：终止的 1 或质数保留在底行。 */
export interface FactorizationShortDivisionComputation extends ShortDivisionBaseComputation {
  mode: 'factorization'
  divisors: string[]
  primeFactors: string[]
  factorizationText: string
  divisorCount: number
  divisorSum: string
}

/** 公共质因数短除法：左侧乘积为 GCD，左侧与底行共同乘积为 LCM。 */
export interface CommonFactorShortDivisionComputation extends ShortDivisionBaseComputation {
  mode: 'commonFactor'
  divisors: string[]
  gcd: string
  lcm: string
}

/** 十进制转目标进制：最终结果按余数自下而上读取。 */
export interface BaseConversionShortDivisionComputation extends ShortDivisionBaseComputation {
  mode: 'baseConversion'
  targetBase: number
  remaindersBottomUp: string[]
  convertedText: string
}

export type ShortDivisionComputation =
  | DivisionShortDivisionComputation
  | FactorizationShortDivisionComputation
  | CommonFactorShortDivisionComputation
  | BaseConversionShortDivisionComputation

/** 短除法入口；`division` 指定 divisor，分解/进制转换只取一个值，公因数至少需要两个值。 */
export interface ShortDivisionInput {
  mode: ShortDivisionMode
  values: unknown[]
  divisor?: unknown
  targetBase?: unknown
}

export interface MultiplicationDigitStep {
  multiplicandDigitIndex: number
  multiplicandDigit: string
  multiplierDigit: string
  carryIn: number
  total: number
  resultDigit: string
  carryOut: number
}

export interface MultiplicationPartialProduct {
  multiplierDigitIndex: number
  multiplierDigit: string
  shift: number
  value: string
  digitSteps: MultiplicationDigitStep[]
}

export interface MultiplicationAdditionStep {
  columnFromRight: number
  addendDigits: string[]
  carryIn: number
  total: number
  resultDigit: string
  carryOut: number
}

/** 两个乘数末尾零的快捷计算信息；为空时使用完整逐位乘法。 */
export interface MultiplicationTrailingZeroShortcut {
  /** 第一行乘数去掉末尾零后实际参与逐位计算的数字。 */
  significantMultiplicandDigits: string
  /** 第一行乘数暂时移出的末尾零位数。 */
  multiplicandTrailingZeroCount: number
  /** 第二行乘数去掉末尾零后实际参与逐位计算的数字。 */
  significantMultiplierDigits: string
  /** 第二行乘数暂时移出的末尾零位数。 */
  multiplierTrailingZeroCount: number
  /** 两个乘数移出零位数的总和，最终积在基础积后补回这些零。 */
  trailingZeroCount: number
}

/** 乘法器可选行为；未指定时保持教学页面的默认快捷计算。 */
export interface MultiplicationOptions {
  useTrailingZeroShortcut?: boolean
  /** 为兼容已有调用方保留；乘法器现在始终按输入顺序排版。 */
  preserveOperandOrder?: boolean
}

export interface MultiplicationComputation {
  multiplicandDigits: string
  multiplierDigits: string
  /** 为兼容已有调用方保留；乘法器不再交换输入，因此始终为 false。 */
  operandsSwapped: boolean
  productDigits: string
  /** 非空时表示最终积由基础积补零得到。 */
  trailingZeroShortcut: MultiplicationTrailingZeroShortcut | null
  partialProducts: MultiplicationPartialProduct[]
  additionSteps: MultiplicationAdditionStep[]
}

/** 一列加法的输入、进位和输出；列号从个位（0）向左计数。 */
export interface AdditionColumnStep {
  columnFromRight: number
  addendDigits: string[]
  carryIn: number
  total: number
  resultDigit: string
  carryOut: number
}

/** 不含任何布局坐标的非负整数加法过程。 */
export interface AdditionComputation {
  addendDigits: string[]
  sumDigits: string
  steps: AdditionColumnStep[]
}

/** 一列减法的借位过程；`minuendDisplay` 是中间计算时实际参与相减的数。 */
export interface SubtractionColumnStep {
  columnFromRight: number
  minuendDigit: string
  subtrahendDigit: string
  borrowIn: number
  minuendDisplay: string
  resultDigit: string
  borrowOut: number
}

/**
 * 非负整数减法过程。负数结果时，`working*` 是用于求绝对值的“大数减小数”过程，
 * 原始输入仍保留在 `minuendDigits` 与 `subtrahendDigits` 中。
 */
export interface SubtractionComputation {
  minuendDigits: string
  subtrahendDigits: string
  workingMinuendDigits: string
  workingSubtrahendDigits: string
  differenceDigits: string
  resultText: string
  isNegative: boolean
  steps: SubtractionColumnStep[]
}

/** 组合竖式目前由加、减、乘三种已有的单项规则按从左到右串联。 */
export type CompositeArithmeticOperator = '+' | '-' | '×'

/** 每一步都保留其原始单项计算过程，布局层无需重新解释算法。 */
interface CompositeArithmeticStepBase {
  index: number
  leftOperandDigits: string
  rightOperandDigits: string
  resultDigits: string
}

export type CompositeArithmeticStep =
  | (CompositeArithmeticStepBase & { operator: '+', computation: AdditionComputation })
  | (CompositeArithmeticStepBase & { operator: '-', computation: SubtractionComputation })
  | (CompositeArithmeticStepBase & { operator: '×', computation: MultiplicationComputation })

export interface CompositeArithmeticComputation {
  expression: string
  initialValueDigits: string
  steps: CompositeArithmeticStep[]
  resultDigits: string
}
