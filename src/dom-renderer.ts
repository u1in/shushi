import type { PlacedDigit, StraightLine, VerticalDivisionRenderModel } from './types'

const renderDomDigit = (parent: HTMLElement, digit: PlacedDigit, model: VerticalDivisionRenderModel): void => {
  const areaLeft = digit.role === 'divisor' ? model.divisorLeft : model.dividendLeft
  const node = document.createElement('span')
  node.className = `division-digit division-digit--${digit.role}`
  node.textContent = digit.digit
  node.style.left = `${areaLeft + digit.column * model.cellWidth}px`
  node.style.top = `${digit.row * model.rowHeight}px`
  node.style.width = `${model.cellWidth}px`
  node.style.height = `${model.rowHeight}px`
  parent.appendChild(node)
}

const renderDomLine = (parent: HTMLElement, line: StraightLine): void => {
  const node = document.createElement('div')
  const isVertical = line.x1 === line.x2
  const isStructuralLine = line.kind === 'divisionBracketTopLine' || line.kind === 'subtractionBar'
  const strokeWidth = isStructuralLine ? 3 : 1
  const lineLength = isVertical ? Math.abs(line.y2 - line.y1) : Math.abs(line.x2 - line.x1)
  node.className = `division-line division-line--${line.kind} ${isVertical ? 'division-line--vertical' : 'division-line--horizontal'}`
  node.style.left = `${isVertical ? line.x1 - strokeWidth / 2 : Math.min(line.x1, line.x2)}px`
  node.style.top = `${isVertical ? Math.min(line.y1, line.y2) : line.y1 - strokeWidth / 2}px`
  node.style.width = `${isVertical ? strokeWidth : Math.max(lineLength, 1)}px`
  node.style.height = `${isVertical ? Math.max(lineLength, 1) : strokeWidth}px`
  parent.appendChild(node)
}

/** Renders the same model as the SVG renderer with absolutely positioned div + CSS. */
export const renderDomDivision = (
  lineLayer: HTMLElement,
  digitLayer: HTMLElement,
  model: VerticalDivisionRenderModel,
): void => {
  lineLayer.parentElement?.style.setProperty('--digit-size', `${model.digitSize}px`)
  lineLayer.parentElement?.style.setProperty('width', `${model.width}px`)
  lineLayer.parentElement?.style.setProperty('height', `${model.height}px`)

  const guideGridLines = model.lines.filter(({ kind }) => (
    kind === 'guideGridHorizontal' || kind === 'guideGridVertical'
  ))
  const structuralLines = model.lines.filter(({ kind }) => (
    kind !== 'guideGridHorizontal' && kind !== 'guideGridVertical'
  ))
  guideGridLines.forEach((line) => renderDomLine(lineLayer, line))

  const arc = document.createElement('div')
  arc.className = 'division-bracket-arc'
  const strokeWidth = 3
  const halfStroke = strokeWidth / 2
  arc.style.left = `${model.bracketArc.left - halfStroke}px`
  arc.style.top = `${model.bracketArc.top - halfStroke}px`
  arc.style.width = `${model.bracketArc.width + strokeWidth}px`
  arc.style.height = `${model.bracketArc.height + strokeWidth}px`
  arc.style.setProperty('--bracket-arc-radius', `${model.bracketArc.cornerRadius + halfStroke}px`)
  lineLayer.appendChild(arc)
  structuralLines.forEach((line) => renderDomLine(lineLayer, line))
  model.digits.forEach((digit) => renderDomDigit(digitLayer, digit, model))

  if (model.decimalPoint) {
    const point = model.decimalPoint
    const node = document.createElement('span')
    node.className = 'division-decimal-point'
    node.textContent = '.'
    node.style.left = `${point.x - model.cellWidth / 6}px`
    node.style.top = `${point.row * model.rowHeight + model.rowHeight * 0.12}px`
    node.style.width = `${model.cellWidth / 3}px`
    node.style.height = `${model.rowHeight}px`
    digitLayer.appendChild(node)
  }
}
