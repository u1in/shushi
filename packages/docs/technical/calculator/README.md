# 计算规则

本目录集中维护所有运算器的计算规则。算法实现位于 `packages/calculators/src`，规则文档和测试必须同步更新。

- [加法计算规则](./加法计算规则.md)
- [减法计算规则](./减法计算规则.md)
- [乘法计算规则](./乘法计算规则.md)
- [除法计算规则](./除法计算规则.md)
- [短除法计算规则](./短除法计算规则.md)
- [组合运算计算规则](./组合运算计算规则.md)

## 计算步骤统一契约

`calculationSteps` 是计算、播放布局和检查弹窗共同使用的唯一过程 JSON。数组下标就是步骤序号；布局只能读取 `visibleStepCount` 截取到的前缀，不能从 `steps`、最终结果或其他未来字段补造事件。每项是扁平对象，不使用 `index`、`kind`、`snapshot` 或嵌套的原始步骤对象。

| 字段                                                       | 含义                                                                                                                          |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `action`                                                   | 本步已经执行的动作，例如 `pad-decimal`、`add-column`、`subtract-column`、`multiply-digit`、`divide-column`、`place-decimal`。 |
| `operands`                                                 | 此步可见的操作数文本；补零和等值移动后会反映当前文本。                                                                        |
| `result`                                                   | 截至此步已经写出的结果、部分积或商；不包含后续数字。                                                                          |
| `column`                                                   | 当前从右向左计算的列号，个位为 `0`；除法时为被除数的逻辑列号。                                                                |
| `inputs`                                                   | 本步直接参与运算的值：加法/部分积求和可有多个；减、乘、除通常为两个。                                                         |
| `carryIn` / `carryOut`                                     | 本列接收/写出的进位。                                                                                                         |
| `borrowIn` / `borrowOut`                                   | 本列接收/写出的借位。                                                                                                         |
| `partialProductIndex` / `multiplicandDigitIndex` / `shift` | 乘法部分积归属、当前被乘数位的位置与左移位数；当前相乘两位在 `inputs`。                                                       |
| `product` / `remainder`                                    | 长除法当前试商的除积和余数；部分被除数、除数与当前商位可分别从 `inputs` 和 `result` 读取。                                    |
| `operandIndex`                                             | `pad-decimal` 中刚补零的操作数下标。                                                                                          |
| `zeroCount`                                                | `restore-trailing-zeros` 中恢复到最终积的零位数。                                                                             |
| `operationIndex` / `operator`                              | 组合计算中的子运算序号与运算符；`start-operation` 只引入下一项操作数。                                                        |
| `divisor` / `quotients` / `remainders`                     | 短除法当前行的除数、商和余数；被除数由 `inputs` 提供。                                                                        |

每种 `action` 只输出本步需要的字段；未列出的字段不出现。这既避免重复嵌套，又确保任一前缀都能独立验证已经发生的计算。
