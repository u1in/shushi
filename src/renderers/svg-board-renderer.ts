/** SVG board renderer: draws the same BoardScene contract as the DOM renderer. */
import { getBoardCellRect, resolveBoardMetrics } from '../scene/geometry'
import type { BoardCell, BoardScene } from '../scene/types'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

const createSvgNode = (name: string, attributes: Record<string, string | number> = {}): SVGElement => {
  const node = document.createElementNS(SVG_NAMESPACE, name)
  Object.entries(attributes).forEach(([property, value]) => node.setAttribute(property, String(value)))
  return node
}

const applyStyleToken = (node: SVGElement, styleToken: string | undefined): void => {
  if (styleToken) node.setAttribute('data-style-token', styleToken)
}

const renderSvgCell = (lineLayer: SVGElement, contentLayer: SVGElement, cell: BoardCell, scene: BoardScene): void => {
  const rect = getBoardCellRect(cell, resolveBoardMetrics(scene))
  if (cell.edges) {
    ;(['top', 'right', 'bottom', 'left'] as const).forEach((edge) => {
      if (!cell.edges?.[edge]) return
      const node = createSvgNode('line', {
        class: `board-edge board-edge--${edge}`,
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
    const textAnchor = horizontalAlign === 'left'
      ? 'start'
      : horizontalAlign === 'right' ? 'end' : 'middle'
    const dominantBaseline = verticalAlign === 'top'
      ? 'hanging'
      : verticalAlign === 'bottom' ? 'text-after-edge' : 'middle'
    const node = createSvgNode('text', {
      class: 'board-text',
      x: horizontalAlign === 'left' ? rect.left : horizontalAlign === 'right' ? rect.left + rect.width : rect.left + rect.width / 2,
      y: verticalAlign === 'top' ? rect.top : verticalAlign === 'bottom' ? rect.top + rect.height : rect.top + rect.height / 2,
    })
    node.textContent = cell.content.text
    if (cell.content.fontSizeRatio !== undefined) {
      node.style.fontSize = `${scene.fontSize * cell.content.fontSizeRatio}px`
    }
    node.style.textAnchor = textAnchor
    node.style.dominantBaseline = dominantBaseline
    applyStyleToken(node, cell.content.styleToken ?? scene.defaultTextStyleToken)
    contentLayer.appendChild(node)
    return
  }

  const right = rect.left + rect.width
  const bottom = rect.top + rect.height
  const radius = Math.min(rect.width, rect.height) * cell.content.radiusRatio
  const node = createSvgNode('path', {
    class: `board-corner board-corner--${cell.content.corner}`,
    d: `M ${rect.left} ${bottom} H ${right - radius} Q ${right} ${bottom} ${right} ${bottom - radius} V ${rect.top}`,
  })
  applyStyleToken(node, cell.styleToken)
  lineLayer.appendChild(node)
}

const renderGuideGrid = (parent: SVGElement, scene: BoardScene): void => {
  if (!scene.showGuideGrid) return
  const metrics = resolveBoardMetrics(scene)
  const top = metrics.rowOffsets[0]
  const bottom = metrics.rowOffsets[metrics.rowOffsets.length - 1]
  const left = metrics.columnOffsets[0]
  const right = metrics.columnOffsets[metrics.columnOffsets.length - 1]
  metrics.columnOffsets.forEach((x) => parent.appendChild(createSvgNode('line', {
    class: 'board-guide-line board-guide-line--vertical', x1: x, y1: top, x2: x, y2: bottom,
  })))
  metrics.rowOffsets.forEach((y) => parent.appendChild(createSvgNode('line', {
    class: 'board-guide-line board-guide-line--horizontal', x1: left, y1: y, x2: right, y2: y,
  })))
}

/** Renders the same renderer-neutral board as the DOM renderer using SVG primitives. */
export const renderSvgBoard = (svg: SVGSVGElement, scene: BoardScene): void => {
  const metrics = resolveBoardMetrics(scene)
  svg.style.setProperty('--board-font-size', `${scene.fontSize}px`)
  svg.setAttribute('viewBox', `0 0 ${metrics.width} ${metrics.height}`)
  svg.setAttribute('width', String(metrics.width))
  svg.setAttribute('height', String(metrics.height))
  svg.setAttribute('aria-label', scene.ariaLabel)
  const lineLayer = createSvgNode('g', { class: 'board-line-layer', 'aria-hidden': 'true' })
  const contentLayer = createSvgNode('g', { class: 'board-content-layer' })
  renderGuideGrid(lineLayer, scene)
  scene.cells.forEach((cell) => renderSvgCell(lineLayer, contentLayer, cell, scene))
  svg.replaceChildren(lineLayer, contentLayer)
}
