/** DOM + CSS grid renderer: draws a GridScene without knowing any operation rules. */
import {
  getGridElementRect,
  getGridTextAnchor,
  resolveGridMetrics,
} from '@vertical-arithmetic/grid'
import type { GridElement, GridMetrics, GridScene } from '@vertical-arithmetic/grid'

const setStyleToken = (node: HTMLElement, styleToken: string | undefined): void => {
  if (styleToken) node.dataset.styleToken = styleToken
}

const renderDomElement = (
  parent: HTMLElement,
  element: GridElement,
  scene: GridScene,
  metrics: GridMetrics,
): void => {
  const rect = getGridElementRect(element, metrics)
  if (element.content.kind === 'line') {
    if (element.position.kind !== 'edge') {
      throw new Error(`线元素 ${element.id} 必须定位在单元格边上。`)
    }
    const node = document.createElement('div')
    node.className = `grid-edge grid-edge--${element.position.edge}`
    setStyleToken(node, element.styleToken)
    node.style.left = `${rect.left}px`
    node.style.top = `${rect.top}px`
    node.style.width = `${rect.width || 3}px`
    node.style.height = `${rect.height || 3}px`
    parent.appendChild(node)
    return
  }
  if (element.content.kind === 'text') {
    const horizontalAlign = element.content.horizontalAlign ?? scene.textHorizontalAlign
    const verticalAlign = element.content.verticalAlign ?? scene.textVerticalAlign
    const anchor = getGridTextAnchor(rect, horizontalAlign, verticalAlign)
    const node = document.createElement('span')
    node.className = 'grid-text'
    node.textContent = element.content.text
    setStyleToken(node, element.content.styleToken ?? scene.defaultTextStyleToken)
    node.style.left = `${anchor.x}px`
    node.style.top = `${anchor.y}px`
    const translateX = horizontalAlign === 'center' ? '-50%' : horizontalAlign === 'right' ? '-100%' : '0'
    const translateY = verticalAlign === 'center' ? '-50%' : verticalAlign === 'bottom' ? '-100%' : '0'
    node.style.transform = `translate(${translateX}, ${translateY})`
    if (element.content.fontSizeRatio !== undefined) {
      node.style.fontSize = `${scene.fontSize * element.content.fontSizeRatio}px`
    }
    parent.appendChild(node)
    return
  }

  const strokeWidth = 3
  const halfStroke = strokeWidth / 2
  const node = document.createElement('div')
  if (element.position.kind !== 'cell') {
    throw new Error(`圆角元素 ${element.id} 必须定位在单元格区域。`)
  }
  node.className = `grid-corner grid-corner--${element.content.corner}`
  setStyleToken(node, element.styleToken)
  node.style.left = `${rect.left - halfStroke}px`
  node.style.top = `${rect.top - halfStroke}px`
  node.style.width = `${rect.width + strokeWidth}px`
  node.style.height = `${rect.height + strokeWidth}px`
  node.style.setProperty('--grid-corner-radius', `${Math.min(rect.width, rect.height) * element.content.radiusRatio + halfStroke}px`)
  parent.appendChild(node)
}

const renderGuideGrid = (parent: HTMLElement, scene: GridScene, metrics: GridMetrics): void => {
  if (!scene.showGuideGrid) return
  const columnOffsets = metrics.columnOffsets
  const rowOffsets = metrics.rowOffsets
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
  scene.elements.forEach((element) => {
    const layer = element.content.kind === 'line' || element.content.kind === 'corner' ? lineLayer : contentLayer
    renderDomElement(layer, element, scene, metrics)
  })
}
