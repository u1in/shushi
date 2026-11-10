---
'@u1in/shushi-core': minor
---

计算器结果新增 `calculationSteps`：补零、小数点、等值变换、逐列运算和组合子运算均由计算器按顺序返回为不含未来结果的自洽快照。布局与 `visibleStepCount` 改为消费这些计算器步骤前缀，组合表达式同时提供展平后的完整检查序列。
