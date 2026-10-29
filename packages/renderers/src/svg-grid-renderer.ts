/** SVG grid renderer: draws the same GridScene contract as the DOM renderer. */
import {
  getGridElementRect,
  getGridTextAnchor,
  resolveGridMetrics,
} from '@vertical-arithmetic/grid'
import type { GridElement, GridMetrics, GridScene } from '@vertical-arithmetic/grid'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

const createSvgNode = (name: string, attributes: Record<string, string | number> = {}): SVGElement => {
  const node = document.createElementNS(SVG_NAMESPACE, name)
  Object.entries(attributes).forEach(([property, value]) => node.setAttribute(property, String(value)))
  return node
}

const applyStyleToken = (node: SVGElement, styleToken: string | undefined): void => {
  if (styleToken) node.setAttribute('data-style-token', styleToken)
}

const renderSvgElement = (
  lineLayer: SVGElement,
  contentLayer: SVGElement,
  element: GridElement,
  scene: GridScene,
  metrics: GridMetrics,
): void => {
  const rect = getGridElementRect(element, metrics)
  if (element.content.kind === 'line') {
    if (element.position.kind !== 'edge') {
      throw new Error(`线元素 ${element.id} 必须定位在单元格边上。`)
    }
    const node = createSvgNode('line', {
      class: `grid-edge grid-edge--${element.position.edge}`,
      x1: rect.left,
      y1: rect.top,
      x2: rect.left + rect.width,
      y2: rect.top + rect.height,
    })
    if (element.content.color) node.style.stroke = element.content.color
    if (element.content.thickness !== undefined) node.style.strokeWidth = `${element.content.thickness}px`
    applyStyleToken(node, element.styleToken)
    lineLayer.appendChild(node)
    return
  }
  if (element.content.kind === 'text') {
    const horizontalAlign = element.content.horizontalAlign ?? scene.textHorizontalAlign
    const verticalAlign = element.content.verticalAlign ?? scene.textVerticalAlign
    const anchor = getGridTextAnchor(rect, horizontalAlign, verticalAlign)
    const node = createSvgNode('text', {
      class: 'grid-text',
      x: anchor.x,
      y: anchor.y,
    })
    node.textContent = element.content.text
    if (element.content.color) node.style.fill = element.content.color
    if (element.content.fontSizeRatio !== undefined) {
      node.style.fontSize = `${scene.fontSize * element.content.fontSizeRatio}px`
    }
    node.style.textAnchor = horizontalAlign === 'left'
      ? 'start'
      : horizontalAlign === 'right' ? 'end' : 'middle'
    node.style.dominantBaseline = verticalAlign === 'top'
      ? 'hanging'
      : verticalAlign === 'bottom' ? 'text-after-edge' : 'middle'
    applyStyleToken(node, element.content.styleToken ?? scene.defaultTextStyleToken)
    contentLayer.appendChild(node)
    return
  }

  if (element.position.kind !== 'cell') {
    throw new Error(`圆角元素 ${element.id} 必须定位在单元格区域。`)
  }
  const right = rect.left + rect.width
  const bottom = rect.top + rect.height
  const radius = Math.min(rect.width, rect.height) * element.content.radiusRatio
  const node = createSvgNode('path', {
    class: `grid-corner grid-corner--${element.content.corner}`,
    d: `M ${rect.left} ${bottom} H ${right - radius} Q ${right} ${bottom} ${right} ${bottom - radius} V ${rect.top}`,
  })
  if (element.content.color) node.style.stroke = element.content.color
  if (element.content.thickness !== undefined) node.style.strokeWidth = `${element.content.thickness}px`
  applyStyleToken(node, element.styleToken)
  lineLayer.appendChild(node)
}

const renderGuideGrid = (parent: SVGElement, scene: GridScene, metrics: GridMetrics): void => {
  if (!scene.showGuideGrid) return
  const columnOffsets = metrics.columnOffsets
  const rowOffsets = metrics.rowOffsets
  const top = rowOffsets[0]
  const bottom = rowOffsets[rowOffsets.length - 1]
  const left = columnOffsets[0]
  const right = columnOffsets[columnOffsets.length - 1]
  columnOffsets.forEach((x) => parent.appendChild(createSvgNode('line', {
    class: 'grid-guide-line grid-guide-line--vertical', x1: x, y1: top, x2: x, y2: bottom,
  })))
  rowOffsets.forEach((y) => parent.appendChild(createSvgNode('line', {
    class: 'grid-guide-line grid-guide-line--horizontal', x1: left, y1: y, x2: right, y2: y,
  })))
}

/** Renders the same renderer-neutral grid as the DOM renderer using SVG primitives. */
export const renderSvgGrid = (svg: SVGSVGElement, scene: GridScene): void => {
  const metrics = resolveGridMetrics(scene)
  svg.style.setProperty('--grid-font-size', `${scene.fontSize}px`)
  svg.setAttribute('viewBox', `0 0 ${metrics.width} ${metrics.height}`)
  svg.setAttribute('width', String(metrics.width))
  svg.setAttribute('height', String(metrics.height))
  svg.setAttribute('aria-label', scene.ariaLabel)
  const lineLayer = createSvgNode('g', { class: 'grid-line-layer', 'aria-hidden': 'true' })
  const contentLayer = createSvgNode('g', { class: 'grid-content-layer' })
  renderGuideGrid(lineLayer, scene, metrics)
  scene.elements.forEach((element) => renderSvgElement(lineLayer, contentLayer, element, scene, metrics))
  svg.replaceChildren(lineLayer, contentLayer)
}
