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
  GridRenderSettings,
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
import type { AutoColorTheme, MacroAstInspection } from '@u1in/shushi-macro'
import { createMacroAstInspection } from '@u1in/shushi-macro'
import { renderDomGrid, renderSvgGrid, renderSvgString } from '@u1in/shushi-renderers'

export type ShushiRenderMode = 'div' | 'svg' | 'svg-string'

/** 按渲染模式收窄门户返回的 rendered 字段，默认模式为 SSR 安全的 svg-string。 */
export type ShushiRendered<TMode extends ShushiRenderMode> = TMode extends 'div'
  ? HTMLElement
  : TMode extends 'svg'
    ? SVGSVGElement
    : string

/** 客户端挂载点只对 DOM 渲染有效；svg-string 不能直接挂载到元素。 */
/** 在编译阶段写入 GridScene 的通用外观配置。 */
export type ShushiAppearanceOptions = {
  /** autoColor 使用的颜色配置；未传入时使用内置 JavaScript 主题。 */
  colorTheme?: AutoColorTheme
  /** 场景默认字体；字体文件仍需由宿主按需导入。 */
  fontFamily?: string
}

export type ShushiRenderOptions<TMode extends ShushiRenderMode = 'svg-string'> = ShushiAppearanceOptions & {
  renderMode?: TMode
  el?: TMode extends 'svg-string' ? never : Element
}

export type ShushiRequest<TRequest, TMode extends ShushiRenderMode = 'svg-string'> = (
  TRequest & ShushiRenderOptions<TMode>
)

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
  /** `division` 模式的左侧除数；其他短除法模式不需要提供。 */
  divisor?: unknown
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
export interface VerticalArithmeticResult<TComputation, TRendered = ShushiRendered<ShushiRenderMode>> {
  computation: TComputation
  source: string
  scene: GridScene
  rendered: TRendered
  inspection: MacroAstInspection
}

export type AdditionVerticalArithmeticResult<TMode extends ShushiRenderMode = ShushiRenderMode> = VerticalArithmeticResult<AdditionComputation, ShushiRendered<TMode>>
export type SubtractionVerticalArithmeticResult<TMode extends ShushiRenderMode = ShushiRenderMode> = VerticalArithmeticResult<SubtractionComputation, ShushiRendered<TMode>>
export type MultiplicationVerticalArithmeticResult<TMode extends ShushiRenderMode = ShushiRenderMode> = VerticalArithmeticResult<MultiplicationComputation, ShushiRendered<TMode>>
export type DivisionVerticalArithmeticResult<TMode extends ShushiRenderMode = ShushiRenderMode> = VerticalArithmeticResult<DivisionComputation, ShushiRendered<TMode>>
export type ShortDivisionVerticalArithmeticResult<TMode extends ShushiRenderMode = ShushiRenderMode> = VerticalArithmeticResult<ShortDivisionComputation, ShushiRendered<TMode>>
export type CompositeVerticalArithmeticResult<TMode extends ShushiRenderMode = ShushiRenderMode> = VerticalArithmeticResult<CompositeArithmeticComputation, ShushiRendered<TMode>>

export type AnyVerticalArithmeticResult<TMode extends ShushiRenderMode = ShushiRenderMode> =
  | AdditionVerticalArithmeticResult<TMode>
  | SubtractionVerticalArithmeticResult<TMode>
  | MultiplicationVerticalArithmeticResult<TMode>
  | DivisionVerticalArithmeticResult<TMode>
  | ShortDivisionVerticalArithmeticResult<TMode>
  | CompositeVerticalArithmeticResult<TMode>

/** 用调用签名保留 operation 与 computation 类型之间的窄化关系。 */
/** `shushiCore` 的结构化请求签名；供需要精确指定运算类型的高级调用方使用。 */
export interface ShushiCore {
  <TMode extends ShushiRenderMode = 'svg-string'>(request: ShushiRequest<AdditionVerticalArithmeticRequest, TMode>): AdditionVerticalArithmeticResult<TMode>
  <TMode extends ShushiRenderMode = 'svg-string'>(request: ShushiRequest<SubtractionVerticalArithmeticRequest, TMode>): SubtractionVerticalArithmeticResult<TMode>
  <TMode extends ShushiRenderMode = 'svg-string'>(request: ShushiRequest<MultiplicationVerticalArithmeticRequest, TMode>): MultiplicationVerticalArithmeticResult<TMode>
  <TMode extends ShushiRenderMode = 'svg-string'>(request: ShushiRequest<DivisionVerticalArithmeticRequest, TMode>): DivisionVerticalArithmeticResult<TMode>
  <TMode extends ShushiRenderMode = 'svg-string'>(request: ShushiRequest<ShortDivisionVerticalArithmeticRequest, TMode>): ShortDivisionVerticalArithmeticResult<TMode>
  <TMode extends ShushiRenderMode = 'svg-string'>(request: ShushiRequest<CompositeVerticalArithmeticRequest, TMode>): CompositeVerticalArithmeticResult<TMode>
  <TMode extends ShushiRenderMode = 'svg-string'>(request: ShushiRequest<VerticalArithmeticRequest, TMode>): AnyVerticalArithmeticResult<TMode>
}

/** 执行客户端挂载或 SSR 字符串渲染，并保持三种渲染器共用同一 GridScene。 */
const renderPortalResult = (scene: GridScene, renderMode: ShushiRenderMode, el: Element | undefined): ShushiRendered<ShushiRenderMode> => {
  if (renderMode === 'svg-string') {
    if (el) throw new Error('renderMode 为 svg-string 时不能传入 el；请使用 div 或 svg 客户端渲染模式。')
    return renderSvgString(scene)
  }

  if (typeof document === 'undefined') {
    throw new Error(`renderMode 为 ${renderMode} 时需要客户端 DOM 环境；服务端请使用 svg-string。`)
  }

  const rendered = renderMode === 'div' ? renderDomGrid(scene) : renderSvgGrid(scene)
  el?.append(rendered)
  return rendered
}

const createResult = <TComputation>(
  computation: TComputation,
  source: string,
  options: ShushiRenderOptions<ShushiRenderMode>,
): VerticalArithmeticResult<TComputation> => {
  // 自动生成和人工录入都使用相同的宏编译器，不能由门户直接拼装 GridScene。
  const compileOptions = options.colorTheme || options.fontFamily
    ? { colorTheme: options.colorTheme, fontFamily: options.fontFamily }
    : undefined
  const scene = compileCalculatorMacro(source, compileOptions)
  const inspection = createMacroAstInspection(source, compileOptions)
  return {
    computation,
    source,
    scene,
    rendered: renderPortalResult(scene, options.renderMode ?? 'svg-string', options.el),
    inspection,
  }
}

/**
 * 用一个入口创建加、减、乘、长除、短除或组合竖式。
 * 返回值完整保留中间过程和源码，既适合直接交给渲染器，也可继续编辑 `source`。
 */
export const shushiCore = ((
  request: ShushiRequest<VerticalArithmeticRequest, ShushiRenderMode>,
): AnyVerticalArithmeticResult => {
  switch (request.operation) {
    case 'addition': {
      const computation = computeAddition(...request.values)
      return createResult(computation, createAdditionMacroSource(computation, request.settings), request)
    }
    case 'subtraction': {
      const computation = computeSubtraction(...request.operands)
      const settings = mergeSettings(DEFAULT_SUBTRACTION_SETTINGS, request.settings)
      return createResult(computation, createSubtractionMacroSource(computation, settings), request)
    }
    case 'multiplication': {
      const computation = computeMultiplication(...request.operands, request.calculation)
      const settings = mergeSettings(DEFAULT_MULTIPLICATION_SETTINGS, request.settings)
      return createResult(computation, createMultiplicationMacroSource(computation, settings), request)
    }
    case 'division': {
      const computation = computeDivision(request.divisor, request.dividend, request.calculation)
      const settings = mergeSettings(DEFAULT_DIVISION_SETTINGS, request.settings)
      return createResult(computation, createDivisionMacroSource(computation, settings), request)
    }
    case 'shortDivision': {
      const computation = computeShortDivision({
        mode: request.mode,
        values: request.values,
        divisor: request.divisor,
        targetBase: request.targetBase,
      })
      const settings = mergeSettings(DEFAULT_SHORT_DIVISION_SETTINGS, request.settings)
      return createResult(computation, createShortDivisionMacroSource(computation, settings), request)
    }
    case 'composite': {
      const computation = computeCompositeArithmetic(request.expression)
      const settings = mergeSettings(DEFAULT_COMPOSITE_SETTINGS, request.settings)
      return createResult(computation, createCompositeArithmeticMacroSource(computation, settings), request)
    }
  }
}) as ShushiCore

/** 表达式入口可覆盖所有运算共有的渲染选项与各专项教学开关。 */
export type ShushiExpressionSettings = Partial<
  GridRenderSettings
  & Pick<RenderSettings, 'bracketBend' | 'uniformSubtractionBars' | 'showZeroQuotientSteps'>
  & Pick<MultiplicationRenderSettings, 'uniformMultiplicationBars' | 'showCarrySteps'>
  & Pick<SubtractionRenderSettings, 'showBorrowSteps'>
  & Pick<ShortDivisionRenderSettings, 'showRemainders'>
>

/** `shushi` 将字符串表达式转换为 `shushiCore` 请求；计算和渲染选项仍然可按需传入。 */
export type ShushiExpressionOptions<TMode extends ShushiRenderMode = 'svg-string'> = ShushiRenderOptions<TMode> & {
  calculation?: DivisionOptions & MultiplicationOptions
  settings?: ShushiExpressionSettings
}

/** 字符串表达式入口的返回值会随运算符而变化，使用 computation 的判别字段读取专项结果。 */
export interface Shushi {
  <TMode extends ShushiRenderMode = 'svg-string'>(
    expression: string,
    options?: ShushiExpressionOptions<TMode>,
  ): AnyVerticalArithmeticResult<TMode>
}

const createExpressionOptions = <TMode extends ShushiRenderMode>(
  options: ShushiExpressionOptions<TMode> | undefined,
): ShushiRenderOptions<TMode> => ({
  renderMode: options?.renderMode,
  el: options?.el,
  colorTheme: options?.colorTheme,
  fontFamily: options?.fontFamily,
})

/**
 * 将用户友好的算式语法转为结构化 `shushiCore` 请求。
 * 除法不与加减乘混排，避免一条表达式混用两种教学排版规则。
 */
export const shushi = ((
  expression: string,
  options: ShushiExpressionOptions<ShushiRenderMode> = {},
): AnyVerticalArithmeticResult => {
  if (typeof expression !== 'string') throw new Error('shushi 的第一个参数必须是算式字符串。')
  const source = expression.trim()
  const renderOptions = createExpressionOptions(options)

  // 无左侧除数的短除写法表示继续试除，保留首页的质因数分解教学模式。
  const factorization = /^\|\s*(\d+)$/.exec(source)
  if (factorization) {
    return shushiCore({
      operation: 'shortDivision',
      mode: 'factorization',
      values: [factorization[1]],
      settings: options.settings,
      ...renderOptions,
    })
  }

  // 多个右值表示公因数短除法；算法从最小质数开始自动试除。
  const commonFactor = /^\|\s*(\d+(?:\s+\d+)+)$/.exec(source)
  if (commonFactor) {
    return shushiCore({
      operation: 'shortDivision',
      mode: 'commonFactor',
      values: commonFactor[1].trim().split(/\s+/),
      settings: options.settings,
      ...renderOptions,
    })
  }

  const baseConversion = /^\((\d+)\)\s*(\d+)$/.exec(source)
  if (baseConversion) {
    return shushiCore({
      operation: 'shortDivision',
      mode: 'baseConversion',
      values: [baseConversion[1]],
      targetBase: baseConversion[2],
      settings: options.settings,
      ...renderOptions,
    })
  }

  const division = /^(\d+)\s*[÷/]\s*(\d+)$/.exec(source)
  if (division) {
    return shushiCore({
      operation: 'division',
      // 表达式按照通常阅读方向书写，而底层计算器保持“除数在前”的稳定契约。
      dividend: division[1],
      divisor: division[2],
      calculation: options.calculation,
      settings: options.settings,
      ...renderOptions,
    })
  }

  if (/[÷/|]/.test(source)) {
    throw new Error('长除法必须单独书写为“被除数 ÷ 除数”；短除法请使用“|待分解数”或“|数1 数2”。')
  }

  const arithmetic = source.replace(/\s+/g, '').replace(/[xX*]/g, '×')
  if (!/^\d+(?:[+\-×]\d+)+$/.test(arithmetic)) {
    throw new Error('请使用由非负整数与 +、-、×（也可输入 *）组成的算式。')
  }
  const operators = arithmetic.match(/[+\-×]/g) ?? []
  if (operators.length > 1) {
    return shushiCore({ operation: 'composite', expression: arithmetic, settings: options.settings, ...renderOptions })
  }

  const [left, operator, right] = arithmetic.split(/([+\-×])/) as [string, '+' | '-' | '×', string]
  if (operator === '+') return shushiCore({ operation: 'addition', values: [left, right], settings: options.settings, ...renderOptions })
  if (operator === '-') return shushiCore({ operation: 'subtraction', operands: [left, right], settings: options.settings, ...renderOptions })
  return shushiCore({ operation: 'multiplication', operands: [left, right], calculation: options.calculation, settings: options.settings, ...renderOptions })
}) as Shushi
