import type { GridTextHorizontalAlign, GridTextVerticalAlign } from '@vertical-arithmetic/grid'

/** Grid configuration shared by every operation-specific layout engine. */
export interface GridRenderSettings {
  cellWidth: number
  rowHeight: number
  fontSizeRatio: number
  showGuideGrid: boolean
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
