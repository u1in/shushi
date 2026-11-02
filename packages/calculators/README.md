# `@u1in/shushi-calculators`

@u1in/shushi 的计算层。它校验非负整数输入，执行各类运算，并输出与渲染器无关的过程数据，供 `@u1in/shushi-layout` 编排为网格场景。

## 导出内容

- `computeAddition(...addends)`：计算两个或多个加数的逐列加法过程。
- `computeSubtraction(minuend, subtrahend)`：计算含连续借位和负结果标记的减法过程。
- `computeDivision(divisor, dividend, options?)`：计算长除法过程。
- `computeMultiplication(multiplicand, multiplier)`：计算长乘法过程。
- `computeShortDivision({ mode, values, targetBase? })`：计算质因数分解、公因数或进制转换短除法过程。
- `AdditionComputation`、`SubtractionComputation`、`DivisionComputation`、`MultiplicationComputation` 及各步骤类型。
- `DivisionOptions`：支持 `remainder` 和 `decimal` 两种结果模式，并可限制小数位数。

输入会被规范化为非负十进制整数字符串，非法输入和除数为零会抛出中文错误。计算层只输出语义过程，不输出 DOM、CSS、行列坐标或像素信息。

## 规则文档

- [加法计算规则](../docs/technical/calculator/加法计算规则.md)
- [减法计算规则](../docs/technical/calculator/减法计算规则.md)
- [除法计算规则](../docs/technical/calculator/除法计算规则.md)
- [乘法计算规则](../docs/technical/calculator/乘法计算规则.md)
- [短除法计算规则](../docs/technical/calculator/短除法计算规则.md)

## Bug 反馈与作者

请在 [GitHub Issues](https://github.com/u1in/shushi/issues) 提供输入、结果和预期过程，尤其是涉及补零、余数或进位的案例。

作者：u1in <u1in@qq.com>
