/** DOM + CSS grid renderer: draws a GridScene without knowing any operation rules. */
import { getGridElementRect, getGridTextAnchor, resolveGridMetrics } from '@u1in/shushi-grid'
import type { GridElement, GridMetrics, GridScene } from '@u1in/shushi-grid'
import { SVG_DEFAULT_FONT_FAMILY, getLineStyle, getTextStyle } from './svg-renderer-core'

const setStyleToken = (node: HTMLElement, styleToken: string | undefined): void => {
  if (styleToken) node.dataset.styleToken = styleToken
}

/** 元素 ID 供外层交互组件回查 GridScene 元素；渲染器不解释任何宏语义。 */
const setElementId = (node: HTMLElement, element: GridElement): void => {
  node.dataset.gridElementId = element.id
}

const setAbsolutePosition = (node: HTMLElement): void => {
  node.style.position = 'absolute'
}

const renderDomElement = (parent: HTMLElement, element: GridElement, scene: GridScene, metrics: GridMetrics): void => {
  const rect = getGridElementRect(element, metrics)
  if (element.content.kind === 'line') {
    if (element.position.kind !== 'edge') {
      throw new Error(`线元素 ${element.id} 必须定位在单元格边上。`)
    }
    const node = document.createElement('div')
    node.className = `grid-edge grid-edge--${element.position.edge}`
    setStyleToken(node, element.styleToken)
    setAbsolutePosition(node)
    node.style.left = `${rect.left}px`
    node.style.top = `${rect.top}px`
    const tokenStyle = getLineStyle(element)
    const isHorizontalEdge = element.position.edge === 'top' || element.position.edge === 'bottom'
    const strokeWidth = element.content.thickness ?? tokenStyle.strokeWidth ?? 3
    node.style.width = `${isHorizontalEdge ? rect.width || 3 : strokeWidth}px`
    node.style.height = `${isHorizontalEdge ? 2 : rect.height || 3}px`
    node.style.setProperty('--grid-line-thickness', `${strokeWidth}px`)
    node.style.backgroundColor = element.content.color ?? tokenStyle.color
    node.style.borderRadius = '0'
    node.style.transform = isHorizontalEdge ? 'translateY(-1px)' : `translateX(${strokeWidth / -2}px)`
    setElementId(node, element)
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
    const textStyleToken = element.content.styleToken ?? scene.defaultTextStyleToken
    const textStyle = getTextStyle(element, scene)
    const fontSize = scene.fontSize * (element.content.fontSizeRatio ?? 1)
    setStyleToken(node, textStyleToken)
    setAbsolutePosition(node)
    node.style.display = 'block'
    node.style.width = 'max-content'
    node.style.whiteSpace = 'nowrap'
    node.style.left = `${anchor.x}px`
    node.style.top = `${anchor.y}px`
    const translateX = anchor.horizontalAlign === 'center' ? '-50%' : anchor.horizontalAlign === 'right' ? '-100%' : '0'
    const translateY = anchor.verticalAlign === 'center' ? '-50%' : anchor.verticalAlign === 'bottom' ? '-100%' : '0'
    node.style.transform = `translate(${translateX}, ${translateY})`
    node.style.color = element.content.color ?? textStyle.color
    node.style.fontSize = `${fontSize}px`
    node.style.fontVariantNumeric = 'tabular-nums'
    node.style.fontWeight = String(textStyle.fontWeight)
    node.style.lineHeight = '1'
    // 文本可覆盖场景字体；把场景默认值也写到文字节点，避免宿主 CSS 覆盖继承变量后字体选择失效。
    node.style.fontFamily = element.content.fontFamily ?? scene.fontFamily ?? SVG_DEFAULT_FONT_FAMILY
    setElementId(node, element)
    parent.appendChild(node)
    return
  }

  if (element.content.kind === 'strike') {
    if (element.position.kind !== 'cell') {
      throw new Error(`删除线元素 ${element.id} 必须定位在单元格区域。`)
    }
    const startX = rect.left + rect.width * element.content.x1Ratio
    const startY = rect.top + rect.height * element.content.y1Ratio
    const endX = rect.left + rect.width * element.content.x2Ratio
    const endY = rect.top + rect.height * element.content.y2Ratio
    const thickness = element.content.thickness ?? 2
    const node = document.createElement('div')
    node.className = 'grid-strike'
    setStyleToken(node, element.styleToken)
    setAbsolutePosition(node)
    node.style.left = `${startX}px`
    node.style.top = `${startY - thickness / 2}px`
    node.style.width = `${Math.hypot(endX - startX, endY - startY)}px`
    node.style.height = `${thickness}px`
    node.style.transform = `rotate(${Math.atan2(endY - startY, endX - startX)}rad)`
    node.style.transformOrigin = 'left center'
    node.style.backgroundColor = element.content.color ?? '#4a5f78'
    setElementId(node, element)
    parent.appendChild(node)
    return
  }

  const tokenStyle = getLineStyle(element)
  const strokeWidth = element.content.thickness ?? tokenStyle.strokeWidth ?? 3
  const halfStroke = strokeWidth / 2
  const node = document.createElement('div')
  if (element.position.kind !== 'cell') {
    throw new Error(`圆角元素 ${element.id} 必须定位在单元格区域。`)
  }
  node.className = `grid-corner grid-corner--${element.content.corner}`
  setStyleToken(node, element.styleToken)
  setAbsolutePosition(node)
  node.style.left = `${rect.left - halfStroke}px`
  node.style.top = `${rect.top - halfStroke}px`
  node.style.width = `${rect.width + strokeWidth}px`
  node.style.height = `${rect.height + strokeWidth}px`
  node.style.setProperty(
    '--grid-corner-radius',
    `${Math.min(rect.width, rect.height) * element.content.radiusRatio + halfStroke}px`,
  )
  node.style.borderRightStyle = 'solid'
  node.style.borderBottomStyle = 'solid'
  node.style.borderRightColor = element.content.color ?? tokenStyle.color
  node.style.borderBottomColor = element.content.color ?? tokenStyle.color
  node.style.borderRightWidth = `${strokeWidth}px`
  node.style.borderBottomWidth = `${strokeWidth}px`
  node.style.borderBottomRightRadius = `${Math.min(rect.width, rect.height) * element.content.radiusRatio + halfStroke}px`
  setElementId(node, element)
  parent.appendChild(node)
}

const renderGuideGrid = (parent: HTMLElement, scene: GridScene, metrics: GridMetrics): void => {
  if (!scene.showGuideGrid) return
  const columnOffsets = metrics.columnOffsets
  const rowOffsets = metrics.rowOffsets
  columnOffsets.forEach((left) => {
    const node = document.createElement('div')
    node.className = 'grid-guide-line grid-guide-line--vertical'
    setAbsolutePosition(node)
    node.style.left = `${left}px`
    node.style.top = `${rowOffsets[0]}px`
    node.style.width = '1px'
    node.style.height = `${rowOffsets[rowOffsets.length - 1] - rowOffsets[0]}px`
    node.style.opacity = '0.68'
    node.style.backgroundImage = 'repeating-linear-gradient(0deg, #a7bbdd 0 2px, transparent 2px 7px)'
    parent.appendChild(node)
  })
  rowOffsets.forEach((top) => {
    const node = document.createElement('div')
    node.className = 'grid-guide-line grid-guide-line--horizontal'
    setAbsolutePosition(node)
    node.style.left = `${columnOffsets[0]}px`
    node.style.top = `${top}px`
    node.style.width = `${columnOffsets[columnOffsets.length - 1] - columnOffsets[0]}px`
    node.style.height = '1px'
    node.style.opacity = '0.68'
    node.style.backgroundImage = 'repeating-linear-gradient(90deg, #a7bbdd 0 2px, transparent 2px 7px)'
    parent.appendChild(node)
  })
}

/** 在已有图层中绘制；清空旧图元，避免复用容器时残留上一次结果。 */
const renderDomLayers = (lineLayer: HTMLElement, contentLayer: HTMLElement, scene: GridScene): void => {
  const metrics = resolveGridMetrics(scene)
  const grid = lineLayer.parentElement
  grid?.style.setProperty('--grid-font-size', `${scene.fontSize}px`)
  grid?.style.setProperty('width', `${metrics.width}px`)
  grid?.style.setProperty('height', `${metrics.height}px`)
  lineLayer.replaceChildren()
  contentLayer.replaceChildren()
  renderGuideGrid(lineLayer, scene, metrics)
  scene.elements.forEach((element) => {
    const layer =
      element.content.kind === 'line' || element.content.kind === 'corner' || element.content.kind === 'strike'
        ? lineLayer
        : contentLayer
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
  stage.style.fontSynthesis = 'none'
  stage.style.setProperty('--grid-font-size', `${scene.fontSize}px`)
  if (scene.fontFamily) stage.style.setProperty('--grid-font-family', scene.fontFamily)

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
