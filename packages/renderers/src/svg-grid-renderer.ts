/** SVG grid renderer: draws the same GridScene contract as the DOM renderer. */
import {
  getGridCellRect,
  getGridTextAnchor,
  getDistinctOffsets,
  resolveGridMetrics,
} from '@vertical-arithmetic/grid'
import type { GridMetrics, GridCell, GridScene } from '@vertical-arithmetic/grid'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

const createSvgNode = (name: string, attributes: Record<string, string | number> = {}): SVGElement => {
  const node = document.createElementNS(SVG_NAMESPACE, name)
  Object.entries(attributes).forEach(([property, value]) => node.setAttribute(property, String(value)))
  return node
}

const applyStyleToken = (node: SVGElement, styleToken: string | undefined): void => {
  if (styleToken) node.setAttribute('data-style-token', styleToken)
}

const renderSvgCell = (
  lineLayer: SVGElement,
  contentLayer: SVGElement,
  cell: GridCell,
  scene: GridScene,
  metrics: GridMetrics,
): void => {
  const rect = getGridCellRect(cell, metrics)
  if (cell.edges) {
    ;(['top', 'right', 'bottom', 'left'] as const).forEach((edge) => {
      if (!cell.edges?.[edge]) return
      const node = createSvgNode('line', {
        class: `grid-edge grid-edge--${edge}`,
        x1: edge === 'right' ? rect.left + rect.width : rect.left,
        y1: edge === 'bottom' ? rect.top + rect.height : rect.top,
        x2: edge === 'left' ? rect.left : rect.left + rect.width,
        y2: edge === 'top' ? rect.top : rect.top + rect.height,
      })
      applyStyleToken(node, cell.styleToken)
      lineLayer.appendChild(node)
    })
  }
  if (!cell.content) return
  if (cell.content.kind === 'text') {
    const horizontalAlign = cell.content.horizontalAlign ?? scene.textHorizontalAlign
    const verticalAlign = cell.content.verticalAlign ?? scene.textVerticalAlign
    const anchor = getGridTextAnchor(rect, horizontalAlign, verticalAlign)
    const node = createSvgNode('text', {
      class: 'grid-text',
      x: anchor.x,
      y: anchor.y,
    })
    node.textContent = cell.content.text
    if (cell.content.fontSizeRatio !== undefined) {
      node.style.fontSize = `${scene.fontSize * cell.content.fontSizeRatio}px`
    }
    node.style.textAnchor = horizontalAlign === 'left'
      ? 'start'
      : horizontalAlign === 'right' ? 'end' : 'middle'
    node.style.dominantBaseline = verticalAlign === 'top'
      ? 'hanging'
      : verticalAlign === 'bottom' ? 'text-after-edge' : 'middle'
    applyStyleToken(node, cell.content.styleToken ?? scene.defaultTextStyleToken)
    contentLayer.appendChild(node)
    return
  }

  const right = rect.left + rect.width
  const bottom = rect.top + rect.height
  const radius = Math.min(rect.width, rect.height) * cell.content.radiusRatio
  const node = createSvgNode('path', {
    class: `grid-corner grid-corner--${cell.content.corner}`,
    d: `M ${rect.left} ${bottom} H ${right - radius} Q ${right} ${bottom} ${right} ${bottom - radius} V ${rect.top}`,
  })
  applyStyleToken(node, cell.styleToken)
  lineLayer.appendChild(node)
}

const renderGuideGrid = (parent: SVGElement, scene: GridScene, metrics: GridMetrics): void => {
  if (!scene.showGuideGrid) return
  const columnOffsets = getDistinctOffsets(metrics.columnOffsets)
  const rowOffsets = getDistinctOffsets(metrics.rowOffsets)
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
  scene.cells.forEach((cell) => renderSvgCell(lineLayer, contentLayer, cell, scene, metrics))
  svg.replaceChildren(lineLayer, contentLayer)
}
