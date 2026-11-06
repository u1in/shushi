/** Semantic process contracts emitted by operation calculators. */
export type QuotientToken =
  { kind: 'digit'; digit: string; column: number } | { kind: 'decimalSeparator'; digit: '.'; column: number }

export interface LongDivisionStep {
  dividendColumn: number
  divisor: string
  quotientDigit: string
  partialDividend: string
  product: string
  remainder: string
}

export interface DivisionComputation {
  /** 规范化前的除数文本；布局用它保留并标记被右移的小数位。 */
  sourceDivisorText: string
  /** 规范化前的被除数文本；布局用它保留并标记被右移的小数位。 */
  sourceDividendText: string
  /** 为把除数化为整数而同步右移的小数位数。 */
  normalizationShift: number
  /** 完成“除数小数点右移”后的整数除数过程数字。 */
  divisorDigits: string
  /** 与整数除数等值的过程文本；原输入显示使用 sourceDivisorText。 */
  divisorText: string
  /** 完成同倍率右移后、仍可能带小数点的过程文本；原输入显示使用 sourceDividendText。 */
  dividendText: string
  dividendDigits: string
  /** 原始被除数在等值变换后的整数位数，也是商小数点出现前的输入位数。 */
  integerDividendDigitCount: number
  quotientText: string
  quotientTokens: QuotientToken[]
  steps: LongDivisionStep[]
  remainder: string
  hasFraction: boolean
  fractionalDigitCount: number
  /** 配置小数位上限后仍有余数，表示商已在该位截断。 */
  decimalTruncated: boolean
  integerStartColumn: number
  digitColumnCount: number
}

export interface DivisionOptions {
  /**
   * 最多继续计算的小数位数。省略时默认计算十位；
   * 指定后即使余数未归零也保留已经计算出的各位小数。
   */
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
  /** 去掉小数点后的计算数字；整数输入时等于对应文本。 */
  multiplicandDigits: string
  multiplierDigits: string
  /** 规范化后的原始输入文本，供布局恢复小数点。 */
  multiplicandText: string
  multiplierText: string
  multiplicandDecimalPlaces: number
  multiplierDecimalPlaces: number
  /** 最终积应从右侧计入的小数位数。 */
  decimalPlaces: number
  /** 为兼容已有调用方保留；乘法器不再交换输入，因此始终为 false。 */
  operandsSwapped: boolean
  productDigits: string
  productText: string
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

/** 不含任何布局坐标的非负十进制加法过程。 */
export interface AdditionComputation {
  /** 去掉小数点后的计算数字；整数输入时等于对应文本。 */
  addendDigits: string[]
  addendTexts: string[]
  addendDecimalPlaces: number[]
  /** 所有加数右补零后采用的公共小数位数。 */
  decimalPlaces: number
  sumDigits: string
  sumText: string
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
  | (CompositeArithmeticStepBase & { operator: '+'; computation: AdditionComputation })
  | (CompositeArithmeticStepBase & { operator: '-'; computation: SubtractionComputation })
  | (CompositeArithmeticStepBase & { operator: '×'; computation: MultiplicationComputation })

export interface CompositeArithmeticComputation {
  expression: string
  initialValueDigits: string
  steps: CompositeArithmeticStep[]
  resultDigits: string
}
