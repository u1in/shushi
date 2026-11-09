import type { GridTextHorizontalAlign, GridTextVerticalAlign } from '@u1in/shushi-grid'

/** Grid configuration shared by every operation-specific layout engine. */
export interface GridRenderSettings {
  cellWidth: number
  rowHeight: number
  fontSizeRatio: number
  showGuideGrid: boolean
  /** 小数结果末位为 0 时，是否用删除线标记这个可省略的 0；默认关闭。 */
  useMinimalDecimalResult?: boolean
  /** 播放教学过程时显示的已完成步骤数；未设置时显示完整结果。 */
  visibleStepCount?: number
  textHorizontalAlign?: GridTextHorizontalAlign
  textVerticalAlign?: GridTextVerticalAlign
}

/** Division-only layout configuration. */
export interface RenderSettings extends GridRenderSettings {
  bracketBend: number
  uniformSubtractionBars: boolean
  showZeroQuotientSteps: boolean
}

/** Multiplication-only layout configuration. */
export interface MultiplicationRenderSettings extends GridRenderSettings {
  uniformMultiplicationBars: boolean
  showCarrySteps: boolean
}

/** Addition-only layout configuration. */
export interface AdditionRenderSettings extends GridRenderSettings {
  showCarrySteps: boolean
}

/** Subtraction-only layout configuration. */
export interface SubtractionRenderSettings extends GridRenderSettings {
  showBorrowSteps: boolean
}

/** 短除法专项配置；竖线和横线均由布局层转为通用边框单元格。 */
export interface ShortDivisionRenderSettings extends GridRenderSettings {
  showRemainders: boolean
}

/** 组合运算的所有步骤共用一套网格尺寸，但保留各单项运算自己的教学开关。 */
export interface CompositeArithmeticRenderSettings extends GridRenderSettings {
  showCarrySteps: boolean
  showBorrowSteps: boolean
  uniformMultiplicationBars: boolean
}
