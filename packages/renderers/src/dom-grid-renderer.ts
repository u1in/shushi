/** DOM + CSS grid renderer: draws a GridScene without knowing any operation rules. */
import {
  getGridElementRect,
  getGridTextAnchor,
  resolveGridMetrics,
} from '@u1in/shushi-grid'
import type { GridElement, GridMetrics, GridScene } from '@u1in/shushi-grid'

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
    // 线条的直观样式由 GridScene 声明，两个渲染器使用同一组受限属性。
    if (element.content.color) node.style.backgroundColor = element.content.color
    if (element.content.thickness !== undefined) {
      node.style.setProperty('--grid-line-thickness', `${element.content.thickness}px`)
    }
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
    if (element.content.color) node.style.color = element.content.color
    if (element.content.fontSizeRatio !== undefined) {
      node.style.fontSize = `${scene.fontSize * element.content.fontSizeRatio}px`
    }
    parent.appendChild(node)
    return
  }

  const strokeWidth = element.content.thickness ?? 3
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
  if (element.content.color) {
    node.style.borderRightColor = element.content.color
    node.style.borderBottomColor = element.content.color
  }
  if (element.content.thickness !== undefined) {
    node.style.borderRightWidth = `${element.content.thickness}px`
    node.style.borderBottomWidth = `${element.content.thickness}px`
  }
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

/** 在已有图层中绘制；清空旧图元，避免复用容器时残留上一次结果。 */
const renderDomLayers = (
  lineLayer: HTMLElement,
  contentLayer: HTMLElement,
  scene: GridScene,
): void => {
  const metrics = resolveGridMetrics(scene)
  const grid = lineLayer.parentElement
  grid?.style.setProperty('--grid-font-size', `${scene.fontSize}px`)
  grid?.style.setProperty('width', `${metrics.width}px`)
  grid?.style.setProperty('height', `${metrics.height}px`)
  lineLayer.replaceChildren()
  contentLayer.replaceChildren()
  renderGuideGrid(lineLayer, scene, metrics)
  scene.elements.forEach((element) => {
    const layer = element.content.kind === 'line' || element.content.kind === 'corner' ? lineLayer : contentLayer
    renderDomElement(layer, element, scene, metrics)
  })
}

/**
 * 创建舞台、线条层和内容层，绘制 GridScene 并返回舞台元素。
 * 舞台与图层的基础定位、宽高和字号变量由渲染器内联设置。
 */
export const renderDomGrid = (scene: GridScene): HTMLElement => {
  const metrics = resolveGridMetrics(scene)
  const stage = document.createElement('div')
  stage.className = 'grid-dom-stage'
  stage.setAttribute('role', 'img')
  stage.setAttribute('aria-label', scene.ariaLabel)
  stage.style.position = 'relative'
  stage.style.width = `${metrics.width}px`
  stage.style.height = `${metrics.height}px`
  stage.style.setProperty('--grid-font-size', `${scene.fontSize}px`)

  const lineLayer = document.createElement('div')
  lineLayer.className = 'grid-line-layer'
  lineLayer.setAttribute('aria-hidden', 'true')
  lineLayer.style.position = 'absolute'
  lineLayer.style.top = '0'
  lineLayer.style.right = '0'
  lineLayer.style.bottom = '0'
  lineLayer.style.left = '0'
  lineLayer.style.pointerEvents = 'none'
  lineLayer.style.zIndex = '1'

  const contentLayer = document.createElement('div')
  contentLayer.className = 'grid-content-layer'
  contentLayer.style.position = 'absolute'
  contentLayer.style.top = '0'
  contentLayer.style.right = '0'
  contentLayer.style.bottom = '0'
  contentLayer.style.left = '0'
  contentLayer.style.zIndex = '2'

  stage.append(lineLayer, contentLayer)
  renderDomLayers(lineLayer, contentLayer, scene)
  return stage
}
