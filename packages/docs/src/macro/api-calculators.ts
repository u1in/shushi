import type { MacroDocPage } from './types'

interface CalculatorApiSpec {
  slug: string
  summary: string
  example: string
  purpose: string
  signature: string
  parameters: string[][]
  caution: string
}

/** 计算 API 页面说明“输入 → 运算过程 → 结果契约”，不把布局和渲染职责混入计算层。 */
const createCalculatorApiPage = ({ slug, summary, example, purpose, signature, parameters, caution }: CalculatorApiSpec): MacroDocPage => ({
  slug,
  title: slug,
  navLabel: slug,
  kicker: 'API · CALCULATORS',
  group: 'api',
  apiTier: 'advanced',
  summary,
  sections: [
    { id: 'name', title: '名称', blocks: [{ type: 'paragraph', text: `\`${slug}\`：${summary}` }] },
    { id: 'example', title: '例子', blocks: [{ type: 'code', title: 'TypeScript 示例', language: 'typescript', code: example }] },
    { id: 'purpose', title: '作用', blocks: [{ type: 'paragraph', text: purpose }] },
    {
      id: 'signature', title: '函数签名和属性说明', blocks: [
        { type: 'code', title: '函数签名', language: 'typescript', code: signature },
        { type: 'table', columns: ['参数 / 返回值', '类型', '说明'], rows: parameters },
      ],
    },
    { id: 'cautions', title: '注意事项', blocks: [{ type: 'callout', tone: 'warn', title: '计算层边界', text: caution }] },
  ],
})

export const computeAdditionPage = createCalculatorApiPage({
  slug: 'computeAddition',
  summary: '计算两个或多个非负整数字符串的逐列加法过程。',
  example: `import { computeAddition } from '@u1in/shushi-core'

// 结果保留字符串，适合处理超出 JavaScript 安全整数范围的输入。
const computation = computeAddition('356', '278')

console.log(computation.sumDigits) // '634'
console.log(computation.steps)`,
  purpose: '它校验加数并输出每列的输入数字、进位、总和、结果位和最终和。布局层只消费这个过程，不重新执行加法。',
  signature: `type ComputeAddition = (...values: unknown[]) => AdditionComputation`,
  parameters: [
    ['`values`', '`unknown[]`', '至少两个非负整数字符串；也可传入一个数组表达连加。'],
    ['返回值', '`AdditionComputation`', '包含 `addendDigits`、`sumDigits` 和逐列 `steps`。'],
  ],
  caution: '输入必须是十进制非负整数；函数不生成宏源码、GridScene 或 DOM。',
})

export const computeSubtractionPage = createCalculatorApiPage({
  slug: 'computeSubtraction',
  summary: '计算两个非负整数的逐列减法和借位过程。',
  example: `import { computeSubtraction } from '@u1in/shushi-core'

// 计算层保留借位后的工作数字，供布局层显示教学标记。
const computation = computeSubtraction('356', '278')

console.log(computation.differenceDigits) // '78'
console.log(computation.steps)`,
  purpose: '它校验被减数和减数，记录每列的借位输入、工作被减数、结果位和借位输出，并返回最终差。',
  signature: `type ComputeSubtraction = (
  minuendValue: unknown,
  subtrahendValue: unknown,
) => SubtractionComputation`,
  parameters: [
    ['`minuendValue`', '`unknown`', '被减数，要求为非负十进制整数。'],
    ['`subtrahendValue`', '`unknown`', '减数，要求为非负十进制整数。'],
    ['返回值', '`SubtractionComputation`', '包含工作被减数、借位步骤和最终差。'],
  ],
  caution: '布局层不能自行判断借位；需要显示借位点时必须使用返回的 `steps`。',
})

export const computeDivisionPage = createCalculatorApiPage({
  slug: 'computeDivision',
  summary: '计算十进制长除法的商、余数和逐轮试商过程。',
  example: `import { computeDivision } from '@u1in/shushi-core'

// 参数顺序是除数在前、被除数在后。
const computation = computeDivision('25', '10230', {
  maxDecimalDigits: 4,
})

console.log(computation.quotientText) // '409.2'
console.log(computation.steps)`,
  purpose: '它以十进制字符串计算长除法，输出商 token、每轮部分被除数、乘积、余数和按需展开的小数过程。',
  signature: `type ComputeDivision = (
  divisorValue: unknown,
  dividendValue: unknown,
  options?: DivisionOptions,
) => DivisionComputation`,
  parameters: [
    ['`divisorValue`', '`unknown`', '除数，不能为 0。'],
    ['`dividendValue`', '`unknown`', '被除数，要求为非负十进制整数。'],
    ['`options.maxDecimalDigits`', '`number`', '可选的正整数。省略时返回整数商和余数；配置后最多展开该位数，未除尽时保留截断小数与当前余数。'],
    ['返回值', '`DivisionComputation`', '包含 `quotientText`、`quotientTokens`、`steps` 和 `remainder`。'],
  ],
  caution: '除数为 0、非正整数的小数位上限都会抛错；函数只返回计算过程，不负责厂字弯、商位和横线的布局。',
})

export const computeMultiplicationPage = createCalculatorApiPage({
  slug: 'computeMultiplication',
  summary: '计算十进制逐位乘法、部分积和最终积。',
  example: `import { computeMultiplication } from '@u1in/shushi-core'

const computation = computeMultiplication('97', '89', {
  // 关闭后始终保留完整的逐位乘法过程。
  useTrailingZeroShortcut: false,
})

console.log(computation.productDigits) // '8633'
console.log(computation.partialProducts)`,
  purpose: '它记录乘数每一位产生的部分积、十进制位移、逐位进位和最终列加法步骤，供乘法布局器生成教学竖式。',
  signature: `type ComputeMultiplication = (
  multiplicandValue: unknown,
  multiplierValue: unknown,
  options?: MultiplicationOptions,
) => MultiplicationComputation`,
  parameters: [
    ['`multiplicandValue`', '`unknown`', '被乘数，要求为非负十进制整数。'],
    ['`multiplierValue`', '`unknown`', '乘数，要求为非负十进制整数。'],
    ['`options.useTrailingZeroShortcut`', '`boolean`', '是否启用乘数末尾零的教学快捷计算，默认开启。'],
    ['`options.preserveOperandOrder`', '`boolean`', '为 `true` 时不为排版交换两个操作数；组合运算乘法固定使用该选项。'],
    ['返回值', '`MultiplicationComputation`', '包含部分积、列加法步骤、最终积和快捷计算信息。'],
  ],
  caution: '输入不会转换为 JavaScript number；不要把 `productDigits` 之外的过程字段当作布局坐标。',
})

export const computeCompositeArithmeticPage = createCalculatorApiPage({
  slug: 'computeCompositeArithmetic',
  summary: '按书写顺序把加、减、乘单项竖式串联为可播放的组合计算过程。',
  example: `import { computeCompositeArithmetic } from '@u1in/shushi-core'

// 组合表达式从左到右执行，不使用通常的乘法优先级。
const computation = computeCompositeArithmetic('125 + 75 - 20 × 3')

console.log(computation.resultDigits) // '540'
console.log(computation.steps)`,
  purpose: '它为每个运算符委托现有加法、减法或乘法计算器，返回带 `operator` 判别字段的单项过程。组合乘法固定关闭十倍数快捷计算并保留输入顺序。',
  signature: `type ComputeCompositeArithmetic = (
  expression: unknown,
) => CompositeArithmeticComputation`,
  parameters: [
    ['`expression`', '`unknown`', '由非负整数和 `+`、`-`、`×` 连接的表达式；也接受 `*` 与 `x`。'],
    ['返回值', '`CompositeArithmeticComputation`', '包含原表达式、每一步的判别联合过程和最终结果。'],
  ],
  caution: '表达式至少包含一个运算符且按左到右执行；中间负数不能继续接下一步，避免违背现有非负整数单项竖式规则。',
})

export const computeShortDivisionPage = createCalculatorApiPage({
  slug: 'computeShortDivision',
  summary: '计算指定除数、质因数分解、公因数或进制转换短除法过程。',
  example: `import { computeShortDivision } from '@u1in/shushi-core'

const computation = computeShortDivision({
  mode: 'baseConversion',
  values: ['255'],
  targetBase: 16,
})

console.log(computation.convertedText) // 'FF'
console.log(computation.steps)`,
  purpose: '它根据 `mode` 选择短除法终止条件，输出每行除数、被除数组、商、余数和最终结果。',
  signature: `type ComputeShortDivision = (input: ShortDivisionInput) => ShortDivisionComputation`,
  parameters: [
    ['`input.mode`', '`ShortDivisionMode`', '取 `division`、`factorization`、`commonFactor` 或 `baseConversion`。'],
    ['`input.values`', '`unknown[]`', '分解和进制转换使用一个值；公因数模式至少需要两个值。'],
    ['`input.divisor`', '`unknown`', '`division` 模式的左侧正整数除数。'],
    ['`input.targetBase`', '`unknown`', '进制转换目标进制，范围由计算规则约束。'],
    ['返回值', '`ShortDivisionComputation`', '按模式返回对应的分解、公因数或进制转换契约。'],
  ],
  caution: '不同 `mode` 返回的联合类型字段不同；读取模式专属字段前应先判断 `computation.mode`。',
})

export const calculatorApiPages = [
  computeAdditionPage,
  computeSubtractionPage,
  computeDivisionPage,
  computeMultiplicationPage,
  computeCompositeArithmeticPage,
  computeShortDivisionPage,
]
