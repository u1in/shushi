/** Left-to-right composition of the existing addition, subtraction and multiplication calculators. */
import { computeAddition } from './addition'
import { computeMultiplication } from './multiplication'
import { computeSubtraction } from './subtraction'
import type { CompositeArithmeticComputation, CompositeArithmeticOperator, CompositeArithmeticStep } from './types'

/** 组合表达式有意不采用通常的乘法优先级；文本顺序就是教学步骤顺序。 */
const parseExpression = (
  expression: unknown,
): { initialValueDigits: string; operations: { operator: CompositeArithmeticOperator; operandDigits: string }[] } => {
  const source = String(expression ?? '')
    .replace(/\s+/g, '')
    .replace(/[xX*]/g, '×')
  if (!/^\d+(?:\.\d+)?(?:[+\-×]\d+(?:\.\d+)?)+$/.test(source)) {
    throw new Error('组合表达式请使用至少两个非负十进制数，并以 +、- 或 × 连接，例如 12.5 + 7.5 × 3。')
  }

  const tokens = source.split(/([+\-×])/)
  const initialValueDigits = tokens[0]
  const operations = [] as { operator: CompositeArithmeticOperator; operandDigits: string }[]
  for (let index = 1; index < tokens.length; index += 2) {
    operations.push({
      operator: tokens[index] as CompositeArithmeticOperator,
      operandDigits: tokens[index + 1],
    })
  }
  return { initialValueDigits, operations }
}

/**
 * 按书写顺序计算组合竖式。每个步骤直接委托给现有单项计算器；
 * 这使进位、借位、部分积等规则仍只有一份实现。
 */
export const computeCompositeArithmetic = (expression: unknown): CompositeArithmeticComputation => {
  const { initialValueDigits, operations } = parseExpression(expression)
  let accumulator = initialValueDigits
  const steps: CompositeArithmeticStep[] = []

  operations.forEach(({ operator, operandDigits }, index) => {
    if (accumulator.startsWith('-')) {
      throw new Error('中间结果为负数后不能继续组合；请调整表达式，使每个中间结果保持非负数。')
    }
    const base = { index, leftOperandDigits: accumulator, rightOperandDigits: operandDigits }
    if (operator === '+') {
      const computation = computeAddition(accumulator, operandDigits)
      steps.push({ ...base, operator, resultDigits: computation.sumText, computation })
      accumulator = computation.sumText
      return
    }
    if (operator === '-') {
      const computation = computeSubtraction(accumulator, operandDigits)
      steps.push({ ...base, operator, resultDigits: computation.resultText, computation })
      accumulator = computation.resultText
      return
    }
    const computation = computeMultiplication(accumulator, operandDigits, {
      // 组合乘法始终展示完整过程，并严格保留表达式中的左、右操作数顺序。
      useTrailingZeroShortcut: false,
      preserveOperandOrder: true,
    })
    steps.push({ ...base, operator, resultDigits: computation.productText, computation })
    accumulator = computation.productText
  })

  return { expression: String(expression), initialValueDigits, steps, resultDigits: accumulator }
}
