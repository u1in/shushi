/** DOM + CSS board renderer: draws a BoardScene without knowing any operation rules. */
import { getBoardCellRect, resolveBoardMetrics } from '../scene/geometry'
import type { BoardCell, BoardScene } from '../scene/types'

const setStyleToken = (node: HTMLElement, styleToken: string | undefined): void => {
  if (styleToken) node.dataset.styleToken = styleToken
}

const renderDomEdge = (parent: HTMLElement, cell: BoardCell, scene: BoardScene): void => {
  if (!cell.edges) return
  const rect = getBoardCellRect(cell, resolveBoardMetrics(scene))
  ;(['top', 'right', 'bottom', 'left'] as const).forEach((edge) => {
    if (!cell.edges?.[edge]) return
    const node = document.createElement('div')
    node.className = `board-edge board-edge--${edge}`
    setStyleToken(node, cell.styleToken)
    node.style.left = `${edge === 'right' ? rect.left + rect.width : rect.left}px`
    node.style.top = `${edge === 'bottom' ? rect.top + rect.height : rect.top}px`
    node.style.width = `${edge === 'top' || edge === 'bottom' ? rect.width : 3}px`
    node.style.height = `${edge === 'left' || edge === 'right' ? rect.height : 3}px`
    parent.appendChild(node)
  })
}

const renderDomContent = (parent: HTMLElement, cell: BoardCell, scene: BoardScene): void => {
  if (!cell.content) return
  const rect = getBoardCellRect(cell, resolveBoardMetrics(scene))
  if (cell.content.kind === 'text') {
    const node = document.createElement('span')
    node.className = 'board-text'
    node.textContent = cell.content.text
    setStyleToken(node, cell.content.styleToken ?? scene.defaultTextStyleToken)
    node.style.left = `${rect.left}px`
    node.style.top = `${rect.top}px`
    node.style.width = `${rect.width}px`
    node.style.height = `${rect.height}px`
    if (cell.content.fontSizeRatio !== undefined) {
      node.style.fontSize = `${scene.fontSize * cell.content.fontSizeRatio}px`
    }
    const horizontalAlign = cell.content.horizontalAlign ?? scene.textHorizontalAlign
    const verticalAlign = cell.content.verticalAlign ?? scene.textVerticalAlign
    node.style.justifyItems = horizontalAlign
    node.style.alignItems = verticalAlign === 'top'
      ? 'start'
      : verticalAlign === 'bottom' ? 'end' : 'center'
    parent.appendChild(node)
    return
  }

  const strokeWidth = 3
  const halfStroke = strokeWidth / 2
  const node = document.createElement('div')
  node.className = `board-corner board-corner--${cell.content.corner}`
  setStyleToken(node, cell.styleToken)
  node.style.left = `${rect.left - halfStroke}px`
  node.style.top = `${rect.top - halfStroke}px`
  node.style.width = `${rect.width + strokeWidth}px`
  node.style.height = `${rect.height + strokeWidth}px`
  node.style.setProperty('--board-corner-radius', `${Math.min(rect.width, rect.height) * cell.content.radiusRatio + halfStroke}px`)
  parent.appendChild(node)
}

const renderGuideGrid = (parent: HTMLElement, scene: BoardScene): void => {
  if (!scene.showGuideGrid) return
  const metrics = resolveBoardMetrics(scene)
  metrics.columnOffsets.forEach((left) => {
    const node = document.createElement('div')
    node.className = 'board-guide-line board-guide-line--vertical'
    node.style.left = `${left}px`
    node.style.top = `${metrics.rowOffsets[0]}px`
    node.style.width = '1px'
    node.style.height = `${metrics.rowOffsets[metrics.rowOffsets.length - 1] - metrics.rowOffsets[0]}px`
    parent.appendChild(node)
  })
  metrics.rowOffsets.forEach((top) => {
    const node = document.createElement('div')
    node.className = 'board-guide-line board-guide-line--horizontal'
    node.style.left = `${metrics.columnOffsets[0]}px`
    node.style.top = `${top}px`
    node.style.width = `${metrics.columnOffsets[metrics.columnOffsets.length - 1] - metrics.columnOffsets[0]}px`
    node.style.height = '1px'
    parent.appendChild(node)
  })
}

/** Renders any BoardScene using absolutely positioned div + CSS layers. */
export const renderDomBoard = (
  lineLayer: HTMLElement,
  contentLayer: HTMLElement,
  scene: BoardScene,
): void => {
  const metrics = resolveBoardMetrics(scene)
  const board = lineLayer.parentElement
  board?.style.setProperty('--board-font-size', `${scene.fontSize}px`)
  board?.style.setProperty('width', `${metrics.width}px`)
  board?.style.setProperty('height', `${metrics.height}px`)
  renderGuideGrid(lineLayer, scene)
  scene.cells.forEach((cell) => renderDomEdge(lineLayer, cell, scene))
  scene.cells.forEach((cell) => renderDomContent(contentLayer, cell, scene))
}
