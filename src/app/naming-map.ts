/** Standalone entry for the division naming map and its element highlight overlays. */
import { getBoardCellRect, resolveBoardMetrics } from '../scene/geometry'
import { computeDivision } from '../calculators/division'
import { renderDomBoard } from '../renderers/dom-board-renderer'
import JSONFormatter from 'json-formatter-js'
import type { BoardCell, BoardScene } from '../scene/types'
import { createDivisionBoardScene } from '../layouts/division-layout'

const requiredElement = <ElementType extends Element>(selector: string): ElementType => {
  const element = document.querySelector<ElementType>(selector)
  if (!element) throw new Error(`页面缺少必要元素：${selector}`)
  return element
}

const stage = requiredElement<HTMLElement>('#naming-map-stage')
const dom = requiredElement<HTMLElement>('#naming-map-dom')
const lineLayer = requiredElement<HTMLElement>('#naming-map-lines')
const contentLayer = requiredElement<HTMLElement>('#naming-map-digits')
const highlightLayer = requiredElement<HTMLElement>('#naming-map-highlights')
const jsonContainer = requiredElement<HTMLElement>('#division-json')
const visibilityControls = document.querySelectorAll<HTMLInputElement>('.naming-map-visibility')
const selectAllControl = requiredElement<HTMLInputElement>('#select-all-highlights')

const highlightNames: Record<string, string> = {
  '01': '商', '02': '小数点', '03': '除数', '04': '厂字弯', '05': '厂字横', '06': '被除数',
  '07': '补零列', '08': '部分减数', '09': '部分被减数', '10': '减法线', '11': '余数', '12': '辅助网格',
}

type Bounds = { left: number, top: number, width: number, height: number }

const expandBounds = (bounds: Bounds, padding = 5): Bounds => ({
  left: bounds.left - padding, top: bounds.top - padding, width: bounds.width + padding * 2, height: bounds.height + padding * 2,
})

const isTextToken = (cell: BoardCell, token: string): boolean => (
  cell.content?.kind === 'text' && cell.content.styleToken === token
)

const getCellBounds = (scene: BoardScene, cells: BoardCell[]): Bounds | null => {
  if (cells.length === 0) return null
  const metrics = resolveBoardMetrics(scene)
  const rects = cells.map((cell) => getBoardCellRect(cell, metrics))
  const left = Math.min(...rects.map(({ left: value }) => value))
  const top = Math.min(...rects.map(({ top: value }) => value))
  const right = Math.max(...rects.map(({ left, width }) => left + width))
  const bottom = Math.max(...rects.map(({ top, height }) => top + height))
  return { left, top, width: right - left, height: bottom - top }
}

const getBottomEdgeBounds = (scene: BoardScene, cell: BoardCell): Bounds => {
  const rect = getBoardCellRect(cell, resolveBoardMetrics(scene))
  return { left: rect.left, top: rect.top + rect.height - 1.5, width: rect.width, height: 3 }
}

const addHighlight = (bounds: Bounds, tone: string, highlightKey: string, showBadge = true): void => {
  const highlight = document.createElement('span')
  highlight.className = `naming-map-highlight ${tone}${showBadge ? '' : ' naming-map-highlight--repeat'}`
  highlight.style.left = `${bounds.left}px`
  highlight.style.top = `${bounds.top}px`
  highlight.style.width = `${bounds.width}px`
  highlight.style.height = `${bounds.height}px`
  highlight.dataset.highlightKey = highlightKey
  if (showBadge) highlight.dataset.name = highlightNames[highlightKey]
  highlightLayer.appendChild(highlight)
}

const highlightCells = (scene: BoardScene, cells: BoardCell[], tone: string, index: string): void => {
  const bounds = getCellBounds(scene, cells)
  if (bounds) addHighlight(expandBounds(bounds), tone, index)
}

const highlightRows = (scene: BoardScene, cells: BoardCell[], tone: string, index: string): void => {
  const rows = [...new Set(cells.map(({ position }) => position.row))]
  rows.forEach((row, indexInRows) => {
    const bounds = getCellBounds(scene, cells.filter((cell) => cell.position.row === row))
    if (bounds) addHighlight(expandBounds(bounds), tone, index, indexInRows === 0)
  })
}

const renderHighlights = (scene: BoardScene): void => {
  highlightLayer.replaceChildren()
  const byTextToken = (token: string): BoardCell[] => scene.cells.filter((cell) => isTextToken(cell, token))
  const byCellToken = (token: string): BoardCell[] => scene.cells.filter((cell) => cell.styleToken === token)
  highlightCells(scene, byTextToken('division.quotient'), 'tone-blue', '01')
  highlightCells(scene, byTextToken('division.decimal-separator'), 'tone-blue', '02')
  highlightCells(scene, byTextToken('division.divisor'), 'tone-blue', '03')
  highlightCells(scene, byCellToken('division.bracket'), 'tone-blue', '04')
  highlightCells(scene, byCellToken('division.bracket-top-line'), 'tone-blue', '05')
  highlightCells(scene, byTextToken('division.dividend'), 'tone-ink', '06')
  highlightCells(scene, byTextToken('division.appended-zero'), 'tone-muted', '07')
  highlightRows(scene, byTextToken('division.partial-subtrahend'), 'tone-green', '08')
  highlightRows(scene, byTextToken('division.partial-minuend'), 'tone-partial', '09')
  byCellToken('division.subtraction-bar').forEach((cell, index) => {
    addHighlight(expandBounds(getBottomEdgeBounds(scene, cell), 5), 'tone-subtraction', '10', index === 0)
  })
  highlightCells(scene, byTextToken('division.remainder'), 'tone-partial', '11')
  const metrics = resolveBoardMetrics(scene)
  addHighlight({ left: 0, top: 0, width: metrics.width, height: metrics.height }, 'tone-grid', '12')
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
const scene = createDivisionBoardScene(computation, {
  cellWidth: 46, rowHeight: 60, fontSizeRatio: 0.82, bracketBend: 1,
  showGuideGrid: true, uniformSubtractionBars: false, showZeroQuotientSteps: false,
})
const metrics = resolveBoardMetrics(scene)
stage.style.width = `${metrics.width}px`
stage.style.height = `${metrics.height}px`
dom.style.width = `${metrics.width}px`
dom.style.height = `${metrics.height}px`
renderDomBoard(lineLayer, contentLayer, scene)
renderHighlights(scene)

const jsonFormatter = new JSONFormatter(computation, Infinity, {
  animateOpen: false, animateClose: false, hoverPreviewEnabled: true, maxArrayItems: 8,
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
selectAllControl.addEventListener('change', () => setAllHighlights(selectAllControl.checked))
syncSelectionControls()
