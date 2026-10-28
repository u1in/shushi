import type { PlacedDigit, StraightLine, VerticalDivisionRenderModel } from './types'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

const createSvgNode = (name: string, attributes: Record<string, string | number> = {}): SVGElement => {
  const node = document.createElementNS(SVG_NAMESPACE, name)

  Object.entries(attributes).forEach(([property, value]) => {
    node.setAttribute(property, String(value))
  })

  return node
}

const renderSvgDigit = (parent: SVGElement, digit: PlacedDigit, model: VerticalDivisionRenderModel): void => {
  const areaLeft = digit.role === 'divisor' ? model.divisorLeft : model.dividendLeft
  const node = createSvgNode('text', {
    class: `division-digit division-digit--${digit.role}`,
    x: areaLeft + (digit.column + 0.5) * model.cellWidth,
    y: digit.row * model.rowHeight + model.rowHeight / 2,
  })
  node.textContent = digit.digit
  parent.appendChild(node)
}

const renderSvgLine = (parent: SVGElement, line: StraightLine): void => {
  parent.appendChild(createSvgNode('line', {
    class: `division-line division-line--${line.kind}`,
    x1: line.x1,
    y1: line.y1,
    x2: line.x2,
    y2: line.y2,
  }))
}

/** Renders a renderer-neutral vertical-division model using SVG primitives. */
export const renderSvgDivision = (svg: SVGSVGElement, model: VerticalDivisionRenderModel): void => {
  svg.style.setProperty('--digit-size', `${model.digitSize}px`)
  svg.setAttribute('viewBox', `0 0 ${model.width} ${model.height}`)
  svg.setAttribute('width', String(model.width))
  svg.setAttribute('height', String(model.height))
  svg.setAttribute('aria-label', model.ariaLabel)

  const lineLayer = createSvgNode('g', { class: 'svg-line-layer', 'aria-hidden': 'true' })
  const digitLayer = createSvgNode('g', { class: 'svg-digit-layer' })
  const arc = model.bracketArc
  const arcStartX = arc.left
  const arcEndX = arc.left + arc.width
  const arcStartY = arc.top + arc.height

  const guideGridLines = model.lines.filter(({ kind }) => (
    kind === 'guideGridHorizontal' || kind === 'guideGridVertical'
  ))
  const structuralLines = model.lines.filter(({ kind }) => (
    kind !== 'guideGridHorizontal' && kind !== 'guideGridVertical'
  ))

  guideGridLines.forEach((line) => renderSvgLine(lineLayer, line))
  lineLayer.appendChild(createSvgNode('path', {
    class: 'division-bracket-arc',
    d: `M ${arcStartX} ${arcStartY} H ${arcEndX - arc.cornerRadius} Q ${arcEndX} ${arcStartY} ${arcEndX} ${arcStartY - arc.cornerRadius} V ${arc.top}`,
  }))
  structuralLines.forEach((line) => renderSvgLine(lineLayer, line))
  model.digits.forEach((digit) => renderSvgDigit(digitLayer, digit, model))

  if (model.decimalPoint) {
    const point = model.decimalPoint
    const node = createSvgNode('text', {
      class: 'division-decimal-point',
      x: point.x,
      y: point.row * model.rowHeight + model.rowHeight * 0.68,
    })
    node.textContent = '.'
    digitLayer.appendChild(node)
  }

  svg.replaceChildren(lineLayer, digitLayer)
}
