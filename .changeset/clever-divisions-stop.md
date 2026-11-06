---
'@u1in/shushi-core': major
---

重构长除法小数终止选项：移除 `resultMode`，改为只使用可选的 `maxDecimalDigits`。未配置时返回整数商和余数；配置后保留到目标位的小数过程及剩余余数，并通过 `decimalTruncated` 标记未除尽的截断结果。
