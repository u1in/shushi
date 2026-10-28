import { computeDivision } from './division'
import { renderDomDivision } from './dom-renderer'
import JSONFormatter from 'json-formatter-js'
import type { DigitRole, PlacedDigit, StraightLine, VerticalDivisionRenderModel } from './types'
import { createVerticalDivisionRenderModel } from './vertical-division-layout'

const requiredElement = <ElementType extends Element>(selector: string): ElementType => {
  const element = document.querySelector<ElementType>(selector)
  if (!element) throw new Error(`页面缺少必要元素：${selector}`)
  return element
}

const stage = requiredElement<HTMLElement>('#naming-map-stage')
const dom = requiredElement<HTMLElement>('#naming-map-dom')
const lineLayer = requiredElement<HTMLElement>('#naming-map-lines')
const digitLayer = requiredElement<HTMLElement>('#naming-map-digits')
const highlightLayer = requiredElement<HTMLElement>('#naming-map-highlights')
const jsonContainer = requiredElement<HTMLElement>('#division-json')
const visibilityControls = document.querySelectorAll<HTMLInputElement>('.naming-map-visibility')
const selectAllControl = requiredElement<HTMLInputElement>('#select-all-highlights')

const highlightNames: Record<string, string> = {
  '01': '商',
  '02': '小数点',
  '03': '除数',
  '04': '厂圆弧',
  '05': '厂横线',
  '06': '被除数',
  '07': '补零列',
  '08': '乘积',
  '09': '部分被除数',
  '10': '减法线',
  '11': '余数',
  '12': '辅助网格',
}

type Bounds = { left: number, top: number, width: number, height: number }

const expandBounds = (bounds: Bounds, padding = 5): Bounds => ({
  left: bounds.left - padding,
  top: bounds.top - padding,
  width: bounds.width + padding * 2,
  height: bounds.height + padding * 2,
})

const getDigitLeft = (digit: PlacedDigit, model: VerticalDivisionRenderModel): number => (
  (digit.role === 'divisor' ? model.divisorLeft : model.dividendLeft) + digit.column * model.cellWidth
)

const getDigitBounds = (model: VerticalDivisionRenderModel, roles: DigitRole[]): Bounds | null => {
  const digits = model.digits.filter((digit) => roles.includes(digit.role))
  if (digits.length === 0) return null

  const left = Math.min(...digits.map((digit) => getDigitLeft(digit, model)))
  const top = Math.min(...digits.map((digit) => digit.row * model.rowHeight))
  const right = Math.max(...digits.map((digit) => getDigitLeft(digit, model) + model.cellWidth))
  const bottom = Math.max(...digits.map((digit) => (digit.row + 1) * model.rowHeight))
  return { left, top, width: right - left, height: bottom - top }
}

const getLineBounds = (line: StraightLine): Bounds => ({
  left: Math.min(line.x1, line.x2),
  top: Math.min(line.y1, line.y2),
  width: Math.max(Math.abs(line.x2 - line.x1), 1),
  height: Math.max(Math.abs(line.y2 - line.y1), 3),
})

const addHighlight = (bounds: Bounds, tone: string, highlightKey: string, showBadge = true): void => {
  const highlight = document.createElement('span')
  highlight.className = `naming-map-highlight ${tone}${showBadge ? '' : ' naming-map-highlight--repeat'}`
  highlight.style.left = `${bounds.left}px`
  highlight.style.top = `${bounds.top}px`
  highlight.style.width = `${bounds.width}px`
  highlight.style.height = `${bounds.height}px`
  highlight.dataset.highlightKey = highlightKey
  if (showBadge) {
    highlight.dataset.name = highlightNames[highlightKey]
  }
  highlightLayer.appendChild(highlight)
}

const highlightDigits = (model: VerticalDivisionRenderModel, roles: DigitRole[], tone: string, index: string): void => {
  const bounds = getDigitBounds(model, roles)
  if (bounds) addHighlight(expandBounds(bounds), tone, index)
}

const highlightRoleRows = (model: VerticalDivisionRenderModel, role: DigitRole, tone: string, index: string): void => {
  const rows = [...new Set(model.digits.filter((digit) => digit.role === role).map(({ row }) => row))]

  rows.forEach((row, rowIndex) => {
    const rowDigits = model.digits.filter((digit) => digit.role === role && digit.row === row)
    const left = Math.min(...rowDigits.map((digit) => getDigitLeft(digit, model)))
    const right = Math.max(...rowDigits.map((digit) => getDigitLeft(digit, model) + model.cellWidth))
    addHighlight(
      expandBounds({ left, top: row * model.rowHeight, width: right - left, height: model.rowHeight }),
      tone,
      index,
      rowIndex === 0,
    )
  })
}

const renderHighlights = (model: VerticalDivisionRenderModel): void => {
  highlightLayer.replaceChildren()
  highlightDigits(model, ['quotient'], 'tone-blue', '01')

  if (model.decimalPoint) {
    addHighlight(expandBounds({
      left: model.decimalPoint.x - model.cellWidth / 6,
      top: model.decimalPoint.row * model.rowHeight + model.rowHeight * 0.12,
      width: model.cellWidth / 3,
      height: model.rowHeight,
    }, 3), 'tone-blue', '02')
  }

  highlightDigits(model, ['divisor'], 'tone-blue', '03')
  addHighlight(expandBounds({
    left: model.bracketArc.left,
    top: model.bracketArc.top,
    width: model.bracketArc.width,
    height: model.bracketArc.height,
  }, 5), 'tone-blue', '04')

  const bracketTopLine = model.lines.find(({ kind }) => kind === 'divisionBracketTopLine')
  if (bracketTopLine) addHighlight(expandBounds(getLineBounds(bracketTopLine), 5), 'tone-blue', '05')
  highlightDigits(model, ['dividend'], 'tone-ink', '06')
  highlightDigits(model, ['appendedZero'], 'tone-muted', '07')

  highlightRoleRows(model, 'product', 'tone-green', '08')
  highlightRoleRows(model, 'partialDividend', 'tone-partial', '09')
  const subtractionBars = model.lines.filter(({ kind }) => kind === 'subtractionBar')
  subtractionBars.forEach((line, index) => {
    addHighlight(expandBounds(getLineBounds(line), 5), 'tone-subtraction', '10', index === 0)
  })
  highlightDigits(model, ['remainder'], 'tone-partial', '11')
  addHighlight({ left: 0, top: 0, width: model.width, height: model.height }, 'tone-grid', '12')
}

const updateHighlightVisibility = (highlightKey: string, visible: boolean): void => {
  highlightLayer.querySelectorAll<HTMLElement>(`[data-highlight-key="${highlightKey}"]`).forEach((highlight) => {
    highlight.classList.toggle('naming-map-highlight--hidden', !visible)
  })
}

const syncSelectionControls = (): void => {
  const allSelected = [...visibilityControls].every((control) => control.checked)
  const noneSelected = [...visibilityControls].every((control) => !control.checked)
  selectAllControl.checked = allSelected
  selectAllControl.indeterminate = !allSelected && !noneSelected
}

const setAllHighlights = (visible: boolean): void => {
  visibilityControls.forEach((control) => {
    control.checked = visible
    const highlightKey = control.dataset.highlightKey
    if (highlightKey) updateHighlightVisibility(highlightKey, visible)
  })
  syncSelectionControls()
}

const computation = computeDivision('25', '10230', { resultMode: 'decimal' })
const model = createVerticalDivisionRenderModel(computation, {
  cellWidth: 46,
  rowHeight: 60,
  fontSizeRatio: 0.82,
  bracketBend: 1,
  showGuideGrid: true,
  uniformSubtractionBars: false,
})

stage.style.width = `${model.width}px`
stage.style.height = `${model.height}px`
dom.style.width = `${model.width}px`
dom.style.height = `${model.height}px`
renderDomDivision(lineLayer, digitLayer, model, 1)
renderHighlights(model)

const jsonFormatter = new JSONFormatter(computation, Infinity, {
  animateOpen: false,
  animateClose: false,
  hoverPreviewEnabled: true,
  maxArrayItems: 8,
})
jsonContainer.replaceChildren(jsonFormatter.render())

visibilityControls.forEach((control) => {
  control.addEventListener('change', () => {
    const highlightKey = control.dataset.highlightKey
    if (!highlightKey) return
    updateHighlightVisibility(highlightKey, control.checked)
    syncSelectionControls()
  })
})

selectAllControl.addEventListener('change', () => {
  setAllHighlights(selectAllControl.checked)
})

syncSelectionControls()
