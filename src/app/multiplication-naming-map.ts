/** Standalone entry for the multiplication naming map and its element highlight overlays. */
import { getBoardCellRect, resolveBoardMetrics } from '../scene/geometry'
import { computeMultiplication } from '../calculators/multiplication'
import { renderDomBoard } from '../renderers/dom-board-renderer'
import JSONFormatter from 'json-formatter-js'
import type { BoardCell, BoardScene } from '../scene/types'
import { createMultiplicationBoardScene } from '../layouts/multiplication-layout'

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
const jsonContainer = requiredElement<HTMLElement>('#multiplication-json')
const visibilityControls = document.querySelectorAll<HTMLInputElement>('.naming-map-visibility')
const selectAllControl = requiredElement<HTMLInputElement>('#select-all-highlights')

const highlightNames: Record<string, string> = {
  '01': '被乘数', '02': '乘数', '03': '乘号', '04': '乘法横线', '05': '部分积',
  '06': '本位进位', '07': '加法进位', '08': '求和横线', '09': '最终积', '10': '辅助网格',
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

const addHighlight = (
  bounds: Bounds,
  tone: string,
  highlightKey: string,
  showBadge = true,
  badgeClass = '',
): void => {
  const highlight = document.createElement('span')
  highlight.className = `naming-map-highlight ${tone}${showBadge ? '' : ' naming-map-highlight--repeat'}${badgeClass ? ` ${badgeClass}` : ''}`
  highlight.style.left = `${bounds.left}px`
  highlight.style.top = `${bounds.top}px`
  highlight.style.width = `${bounds.width}px`
  highlight.style.height = `${bounds.height}px`
  highlight.dataset.highlightKey = highlightKey
  if (showBadge) highlight.dataset.name = highlightNames[highlightKey]
  highlightLayer.appendChild(highlight)
}

const highlightCells = (
  scene: BoardScene,
  cells: BoardCell[],
  tone: string,
  index: string,
  badgeClass = '',
): void => {
  const bounds = getCellBounds(scene, cells)
  if (bounds) addHighlight(expandBounds(bounds), tone, index, true, badgeClass)
}

const highlightRows = (
  scene: BoardScene,
  cells: BoardCell[],
  tone: string,
  index: string,
  badgeClass = '',
): void => {
  const rows = [...new Set(cells.map(({ position }) => position.row))]
  rows.forEach((row, indexInRows) => {
    const bounds = getCellBounds(scene, cells.filter((cell) => cell.position.row === row))
    if (bounds) addHighlight(expandBounds(bounds), tone, index, indexInRows === 0, badgeClass)
  })
}

/** Measures the real rendered glyph boxes so carries on 0-size tracks get a usable frame. */
const getRenderedTextBounds = (token: string): Bounds[] => {
  const boardRect = dom.getBoundingClientRect()
  return [...contentLayer.querySelectorAll<HTMLElement>(`.board-text[data-style-token="${token}"]`)].map((node) => {
    const rect = node.getBoundingClientRect()
    return {
      left: rect.left - boardRect.left,
      top: rect.top - boardRect.top,
      width: rect.width,
      height: rect.height,
    }
  })
}

const renderHighlights = (scene: BoardScene): void => {
  highlightLayer.replaceChildren()
  const byTextToken = (token: string): BoardCell[] => scene.cells.filter((cell) => isTextToken(cell, token))
  const byCellToken = (token: string): BoardCell[] => scene.cells.filter((cell) => cell.styleToken === token)
  const metrics = resolveBoardMetrics(scene)

  addHighlight(
    { left: 0, top: 0, width: metrics.width, height: metrics.height },
    'tone-grid',
    '10',
    true,
    'naming-map-highlight--badge-bottom-left',
  )

  byCellToken('multiplication.input-bar').forEach((cell) => {
    addHighlight(expandBounds(getBottomEdgeBounds(scene, cell), 5), 'tone-blue', '04', true, 'naming-map-highlight--badge-right')
  })
  byCellToken('multiplication.sum-bar').forEach((cell) => {
    addHighlight(expandBounds(getBottomEdgeBounds(scene, cell), 5), 'tone-sum', '08', true, 'naming-map-highlight--badge-right')
  })

  highlightCells(scene, byTextToken('multiplication.multiplicand'), 'tone-ink', '01')
  highlightCells(scene, byTextToken('multiplication.multiplier'), 'tone-blue', '02', 'naming-map-highlight--badge-right')
  highlightCells(scene, byTextToken('multiplication.operator'), 'tone-blue', '03', 'naming-map-highlight--badge-left')
  highlightRows(scene, byTextToken('multiplication.partial-product'), 'tone-green', '05', 'naming-map-highlight--badge-right')
  getRenderedTextBounds('multiplication.carry').forEach((bounds, index) => {
    addHighlight(expandBounds(bounds, 4), 'tone-carry', '06', index === 0, 'naming-map-highlight--badge-left')
  })
  getRenderedTextBounds('multiplication.addition-carry').forEach((bounds, index) => {
    addHighlight(expandBounds(bounds, 4), 'tone-addcarry', '07', index === 0, 'naming-map-highlight--badge-left')
  })
  highlightCells(scene, byTextToken('multiplication.product'), 'tone-product', '09', 'naming-map-highlight--badge-right')
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

const computation = computeMultiplication('97', '89')
const scene = createMultiplicationBoardScene(computation, {
  cellWidth: 64,
  rowHeight: 72,
  fontSizeRatio: 0.8,
  showGuideGrid: true,
  uniformMultiplicationBars: false,
  showCarrySteps: true,
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
