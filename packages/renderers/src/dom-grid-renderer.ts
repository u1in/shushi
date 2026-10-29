/** DOM + CSS grid renderer: draws a GridScene without knowing any operation rules. */
import {
  getGridCellRect,
  getGridTextAnchor,
  getDistinctOffsets,
  resolveGridMetrics,
} from '@vertical-arithmetic/grid'
import type { GridMetrics, GridCell, GridScene } from '@vertical-arithmetic/grid'

const setStyleToken = (node: HTMLElement, styleToken: string | undefined): void => {
  if (styleToken) node.dataset.styleToken = styleToken
}

const renderDomEdge = (parent: HTMLElement, cell: GridCell, metrics: GridMetrics): void => {
  if (!cell.edges) return
  const rect = getGridCellRect(cell, metrics)
  ;(['top', 'right', 'bottom', 'left'] as const).forEach((edge) => {
    if (!cell.edges?.[edge]) return
    const node = document.createElement('div')
    node.className = `grid-edge grid-edge--${edge}`
    setStyleToken(node, cell.styleToken)
    node.style.left = `${edge === 'right' ? rect.left + rect.width : rect.left}px`
    node.style.top = `${edge === 'bottom' ? rect.top + rect.height : rect.top}px`
    node.style.width = `${edge === 'top' || edge === 'bottom' ? rect.width : 3}px`
    node.style.height = `${edge === 'left' || edge === 'right' ? rect.height : 3}px`
    parent.appendChild(node)
  })
}

const renderDomContent = (
  parent: HTMLElement,
  cell: GridCell,
  scene: GridScene,
  metrics: GridMetrics,
): void => {
  if (!cell.content) return
  const rect = getGridCellRect(cell, metrics)
  if (cell.content.kind === 'text') {
    const horizontalAlign = cell.content.horizontalAlign ?? scene.textHorizontalAlign
    const verticalAlign = cell.content.verticalAlign ?? scene.textVerticalAlign
    const anchor = getGridTextAnchor(rect, horizontalAlign, verticalAlign)
    const node = document.createElement('span')
    node.className = 'grid-text'
    node.textContent = cell.content.text
    setStyleToken(node, cell.content.styleToken ?? scene.defaultTextStyleToken)
    node.style.left = `${anchor.x}px`
    node.style.top = `${anchor.y}px`
    const translateX = horizontalAlign === 'center' ? '-50%' : horizontalAlign === 'right' ? '-100%' : '0'
    const translateY = verticalAlign === 'center' ? '-50%' : verticalAlign === 'bottom' ? '-100%' : '0'
    node.style.transform = `translate(${translateX}, ${translateY})`
    if (cell.content.fontSizeRatio !== undefined) {
      node.style.fontSize = `${scene.fontSize * cell.content.fontSizeRatio}px`
    }
    parent.appendChild(node)
    return
  }

  const strokeWidth = 3
  const halfStroke = strokeWidth / 2
  const node = document.createElement('div')
  node.className = `grid-corner grid-corner--${cell.content.corner}`
  setStyleToken(node, cell.styleToken)
  node.style.left = `${rect.left - halfStroke}px`
  node.style.top = `${rect.top - halfStroke}px`
  node.style.width = `${rect.width + strokeWidth}px`
  node.style.height = `${rect.height + strokeWidth}px`
  node.style.setProperty('--grid-corner-radius', `${Math.min(rect.width, rect.height) * cell.content.radiusRatio + halfStroke}px`)
  parent.appendChild(node)
}

const renderGuideGrid = (parent: HTMLElement, scene: GridScene, metrics: GridMetrics): void => {
  if (!scene.showGuideGrid) return
  const columnOffsets = getDistinctOffsets(metrics.columnOffsets)
  const rowOffsets = getDistinctOffsets(metrics.rowOffsets)
  columnOffsets.forEach((left) => {
    const node = document.createElement('div')
    node.className = 'grid-guide-line grid-guide-line--vertical'
    node.style.left = `${left}px`
    node.style.top = `${rowOffsets[0]}px`
    node.style.width = '1px'
    node.style.height = `${rowOffsets[rowOffsets.length - 1] - rowOffsets[0]}px`
    parent.appendChild(node)
  })
  rowOffsets.forEach((top) => {
    const node = document.createElement('div')
    node.className = 'grid-guide-line grid-guide-line--horizontal'
    node.style.left = `${columnOffsets[0]}px`
    node.style.top = `${top}px`
    node.style.width = `${columnOffsets[columnOffsets.length - 1] - columnOffsets[0]}px`
    node.style.height = '1px'
    parent.appendChild(node)
  })
}

/** Renders any GridScene using absolutely positioned div + CSS layers. */
export const renderDomGrid = (
  lineLayer: HTMLElement,
  contentLayer: HTMLElement,
  scene: GridScene,
): void => {
  const metrics = resolveGridMetrics(scene)
  const grid = lineLayer.parentElement
  grid?.style.setProperty('--grid-font-size', `${scene.fontSize}px`)
  grid?.style.setProperty('width', `${metrics.width}px`)
  grid?.style.setProperty('height', `${metrics.height}px`)
  renderGuideGrid(lineLayer, scene, metrics)
  scene.cells.forEach((cell) => renderDomEdge(lineLayer, cell, metrics))
  scene.cells.forEach((cell) => renderDomContent(contentLayer, cell, scene, metrics))
}
