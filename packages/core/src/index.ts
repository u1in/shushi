/**
 * 面向 npm 使用者的统一入口。
 * 领域包仍保持独立边界，这里只汇总稳定的公共 API，避免调用方了解工作区内部拆包方式。
 */
export * from '@vertical-arithmetic/calculators'
export * from '@vertical-arithmetic/grid'
export * from '@vertical-arithmetic/layout'
export * from '@vertical-arithmetic/macro'
export * from '@vertical-arithmetic/renderers'
