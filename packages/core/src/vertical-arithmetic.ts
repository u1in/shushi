/**
 * 面向应用调用方的竖式门户：固定串联“计算 → 可编辑宏 → GridScene”。
 * 各领域包仍独立维护规则；这里仅负责选择已有计算器、布局器和统一宏编译入口。
 */
import type {
  AdditionComputation,
  CompositeArithmeticComputation,
  DivisionComputation,
  DivisionOptions,
  MultiplicationComputation,
  MultiplicationOptions,
  ShortDivisionComputation,
  ShortDivisionMode,
  SubtractionComputation,
} from '@u1in/shushi-calculators'
import {
  computeAddition,
  computeCompositeArithmetic,
  computeDivision,
  computeMultiplication,
  computeShortDivision,
  computeSubtraction,
} from '@u1in/shushi-calculators'
import type { GridScene } from '@u1in/shushi-grid'
import type {
  AdditionRenderSettings,
  CompositeArithmeticRenderSettings,
  MultiplicationRenderSettings,
  RenderSettings,
  ShortDivisionRenderSettings,
  SubtractionRenderSettings,
} from '@u1in/shushi-layout'
import {
  compileCalculatorMacro,
  createAdditionMacroSource,
  createCompositeArithmeticMacroSource,
  createDivisionMacroSource,
  createMultiplicationMacroSource,
  createShortDivisionMacroSource,
  createSubtractionMacroSource,
} from '@u1in/shushi-layout'

/** 所有门户调用共享的视觉尺寸；专项开关由各运算的默认设置补齐。 */
const DEFAULT_GRID_SETTINGS = {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
}

const DEFAULT_SUBTRACTION_SETTINGS: SubtractionRenderSettings = {
  ...DEFAULT_GRID_SETTINGS,
  showBorrowSteps: true,
}

const DEFAULT_MULTIPLICATION_SETTINGS: MultiplicationRenderSettings = {
  ...DEFAULT_GRID_SETTINGS,
  uniformMultiplicationBars: false,
  showCarrySteps: true,
}

const DEFAULT_DIVISION_SETTINGS: RenderSettings = {
  ...DEFAULT_GRID_SETTINGS,
  bracketBend: 1,
  uniformSubtractionBars: false,
  showZeroQuotientSteps: false,
}

const DEFAULT_SHORT_DIVISION_SETTINGS: ShortDivisionRenderSettings = {
  ...DEFAULT_GRID_SETTINGS,
  showRemainders: true,
}

/** 组合竖式继续遵循其独立默认值：借位提示需显式开启。 */
const DEFAULT_COMPOSITE_SETTINGS: CompositeArithmeticRenderSettings = {
  ...DEFAULT_GRID_SETTINGS,
  showCarrySteps: true,
  showBorrowSteps: false,
  uniformMultiplicationBars: false,
}

/** 忽略显式 undefined，避免可选 settings 意外覆盖门户的教学默认值。 */
const mergeSettings = <T extends object>(defaults: T, settings: Partial<T> | undefined): T => ({
  ...defaults,
  ...Object.fromEntries(Object.entries(settings ?? {}).filter(([, value]) => value !== undefined)),
}) as T

export interface AdditionVerticalArithmeticRequest {
  operation: 'addition'
  /** 至少传入两个加数；具体输入校验由加法计算器执行。 */
  values: readonly unknown[]
  settings?: Partial<AdditionRenderSettings>
}

export interface SubtractionVerticalArithmeticRequest {
  operation: 'subtraction'
  operands: readonly [unknown, unknown]
  settings?: Partial<SubtractionRenderSettings>
}

export interface MultiplicationVerticalArithmeticRequest {
  operation: 'multiplication'
  operands: readonly [unknown, unknown]
  calculation?: MultiplicationOptions
  settings?: Partial<MultiplicationRenderSettings>
}

export interface DivisionVerticalArithmeticRequest {
  operation: 'division'
  /** 除数在前，避免把长除法原有参数顺序误解为“被除数在前”。 */
  divisor: unknown
  dividend: unknown
  calculation?: DivisionOptions
  settings?: Partial<RenderSettings>
}

export interface ShortDivisionVerticalArithmeticRequest {
  operation: 'shortDivision'
  mode: ShortDivisionMode
  values: unknown[]
  targetBase?: unknown
  settings?: Partial<ShortDivisionRenderSettings>
}

export interface CompositeVerticalArithmeticRequest {
  operation: 'composite'
  expression: unknown
  settings?: Partial<CompositeArithmeticRenderSettings>
}

/** 所有受支持运算的判别联合；`operation` 决定必填输入与可用设置。 */
export type VerticalArithmeticRequest =
  | AdditionVerticalArithmeticRequest
  | SubtractionVerticalArithmeticRequest
  | MultiplicationVerticalArithmeticRequest
  | DivisionVerticalArithmeticRequest
  | ShortDivisionVerticalArithmeticRequest
  | CompositeVerticalArithmeticRequest

/** 门户始终保留三层产物，方便调用方按需要读取过程、保存宏或直接渲染场景。 */
export interface VerticalArithmeticResult<TComputation> {
  computation: TComputation
  source: string
  scene: GridScene
}

export type AdditionVerticalArithmeticResult = VerticalArithmeticResult<AdditionComputation>
export type SubtractionVerticalArithmeticResult = VerticalArithmeticResult<SubtractionComputation>
export type MultiplicationVerticalArithmeticResult = VerticalArithmeticResult<MultiplicationComputation>
export type DivisionVerticalArithmeticResult = VerticalArithmeticResult<DivisionComputation>
export type ShortDivisionVerticalArithmeticResult = VerticalArithmeticResult<ShortDivisionComputation>
export type CompositeVerticalArithmeticResult = VerticalArithmeticResult<CompositeArithmeticComputation>

export type AnyVerticalArithmeticResult =
  | AdditionVerticalArithmeticResult
  | SubtractionVerticalArithmeticResult
  | MultiplicationVerticalArithmeticResult
  | DivisionVerticalArithmeticResult
  | ShortDivisionVerticalArithmeticResult
  | CompositeVerticalArithmeticResult

/** 用调用签名保留 operation 与 computation 类型之间的窄化关系。 */
export interface CreateVerticalArithmetic {
  (request: AdditionVerticalArithmeticRequest): AdditionVerticalArithmeticResult
  (request: SubtractionVerticalArithmeticRequest): SubtractionVerticalArithmeticResult
  (request: MultiplicationVerticalArithmeticRequest): MultiplicationVerticalArithmeticResult
  (request: DivisionVerticalArithmeticRequest): DivisionVerticalArithmeticResult
  (request: ShortDivisionVerticalArithmeticRequest): ShortDivisionVerticalArithmeticResult
  (request: CompositeVerticalArithmeticRequest): CompositeVerticalArithmeticResult
  (request: VerticalArithmeticRequest): AnyVerticalArithmeticResult
}

const createResult = <TComputation>(computation: TComputation, source: string): VerticalArithmeticResult<TComputation> => ({
  computation,
  source,
  // 自动生成和人工录入都使用相同的宏编译器，不能由门户直接拼装 GridScene。
  scene: compileCalculatorMacro(source),
})

/**
 * 用一个入口创建加、减、乘、长除、短除或组合竖式。
 * 返回值完整保留中间过程和源码，既适合直接交给渲染器，也可继续编辑 `source`。
 */
export const createVerticalArithmetic = ((
  request: VerticalArithmeticRequest,
): AnyVerticalArithmeticResult => {
  switch (request.operation) {
    case 'addition': {
      const computation = computeAddition(...request.values)
      return createResult(computation, createAdditionMacroSource(computation, request.settings))
    }
    case 'subtraction': {
      const computation = computeSubtraction(...request.operands)
      const settings = mergeSettings(DEFAULT_SUBTRACTION_SETTINGS, request.settings)
      return createResult(computation, createSubtractionMacroSource(computation, settings))
    }
    case 'multiplication': {
      const computation = computeMultiplication(...request.operands, request.calculation)
      const settings = mergeSettings(DEFAULT_MULTIPLICATION_SETTINGS, request.settings)
      return createResult(computation, createMultiplicationMacroSource(computation, settings))
    }
    case 'division': {
      const computation = computeDivision(request.divisor, request.dividend, request.calculation)
      const settings = mergeSettings(DEFAULT_DIVISION_SETTINGS, request.settings)
      return createResult(computation, createDivisionMacroSource(computation, settings))
    }
    case 'shortDivision': {
      const computation = computeShortDivision({
        mode: request.mode,
        values: request.values,
        targetBase: request.targetBase,
      })
      const settings = mergeSettings(DEFAULT_SHORT_DIVISION_SETTINGS, request.settings)
      return createResult(computation, createShortDivisionMacroSource(computation, settings))
    }
    case 'composite': {
      const computation = computeCompositeArithmetic(request.expression)
      const settings = mergeSettings(DEFAULT_COMPOSITE_SETTINGS, request.settings)
      return createResult(computation, createCompositeArithmeticMacroSource(computation, settings))
    }
  }
}) as CreateVerticalArithmetic
