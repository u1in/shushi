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
  node.className = `division-line division-line--${line.kind} ${isVertical ? 'division-line--vertical' : 'division-line--horizontal'}`
  node.style.left = `${Math.min(line.x1, line.x2)}px`
  node.style.top = `${Math.min(line.y1, line.y2)}px`
  node.style.width = `${Math.max(Math.abs(line.x2 - line.x1), 1)}px`
  node.style.height = `${Math.max(Math.abs(line.y2 - line.y1), 1)}px`
  parent.appendChild(node)
}

/** Renders the same model as the SVG renderer with absolutely positioned div + CSS. */
export const renderDomDivision = (
  lineLayer: HTMLElement,
  digitLayer: HTMLElement,
  model: VerticalDivisionRenderModel,
  bracketBend: number,
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
  arc.style.left = `${model.bracketArc.left}px`
  arc.style.top = `${model.bracketArc.top}px`
  arc.style.width = `${model.bracketArc.width}px`
  arc.style.height = `${model.bracketArc.height}px`
  arc.style.setProperty('--bracket-arc-radius', `${bracketBend * 100}%`)
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
