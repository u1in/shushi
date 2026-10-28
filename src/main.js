import './style.css'
import { computeDivision } from './division.js'

const svgNamespace = 'http://www.w3.org/2000/svg'

const state = {
  cw: 32,
  rh: 46,
  fsRatio: 0.82,
  bend: 1,
  showGrid: false,
  uniformSubtractionLines: false,
  resultMode: 'decimal',
  maxDecimalDigits: 24,
  divisor: '25',
  dividend: '10230',
}

const elements = {
  form: document.querySelector('#division-form'),
  divisorInput: document.querySelector('#divisor-input'),
  dividendInput: document.querySelector('#dividend-input'),
  sampleButton: document.querySelector('#sample-button'),
  error: document.querySelector('#error-message'),
  cwInput: document.querySelector('#cw-input'),
  rhInput: document.querySelector('#rh-input'),
  fsInput: document.querySelector('#fs-input'),
  bendInput: document.querySelector('#bend-input'),
  gridInput: document.querySelector('#grid-input'),
  uniformSubtractionInput: document.querySelector('#uniform-subtraction-input'),
  resultModeInputs: document.querySelectorAll('input[name="result-mode"]'),
  cwOutput: document.querySelector('#cw-output'),
  rhOutput: document.querySelector('#rh-output'),
  fsOutput: document.querySelector('#fs-output'),
  bendOutput: document.querySelector('#bend-output'),
  resultTitle: document.querySelector('#result-title'),
  answer: document.querySelector('#answer-output'),
  normalization: document.querySelector('#normalization-output'),
  svgStage: document.querySelector('#svg-stage'),
  domStage: document.querySelector('#dom-stage'),
  svg: document.querySelector('#division-svg'),
  dom: document.querySelector('#division-dom'),
  lineLayer: document.querySelector('#math-lines'),
  mathLayer: document.querySelector('#math-layer'),
}

const createSvgNode = (name, attributes = {}) => {
  const node = document.createElementNS(svgNamespace, name)

  Object.entries(attributes).forEach(([property, value]) => {
    node.setAttribute(property, String(value))
  })

  return node
}

const createText = (text, className, left, row, size, extra = {}) => {
  const node = createSvgNode('text', {
    class: `math-text ${className}`,
    x: left + size / 2,
    y: row * state.rh + state.rh / 2,
  })
  node.textContent = text
  Object.entries(extra).forEach(([property, value]) => {
    node.setAttribute(property, value)
  })
  return node
}

const addNumber = (parent, text, position, row, className, baseX, width, extra = {}) => {
  const start = position - text.length + 1

  ;[...text].forEach((digit, index) => {
    parent.appendChild(createText(
      digit,
      `math-digit ${className}`,
      baseX + (start + index) * width,
      row,
      width,
      extra,
    ))
  })
}

const addDigitAt = (parent, digit, position, row, className, baseX, width, extra = {}) => {
  parent.appendChild(createText(
    digit,
    `math-digit ${className}`,
    baseX + position * width,
    row,
    width,
    extra,
  ))
}

const addDecimalPoint = (parent, position, row, baseX, width) => {
  const dotWidth = width / 3
  const dot = createText('.', 'math-dot', baseX + position * width - dotWidth / 2, row, dotWidth)
  dot.setAttribute('y', String(row * state.rh + state.rh * 0.68))
  parent.appendChild(dot)
}

const drawLine = (layer, x1, y1, x2, y2, className) => {
  layer.appendChild(createSvgNode('line', {
    class: className,
    x1,
    y1,
    x2,
    y2,
  }))
}

const drawGrid = (layer, columnBoundaries, rowCount) => {
  if (!state.showGrid) return

  const gridLeft = columnBoundaries[0]
  const gridRight = columnBoundaries[columnBoundaries.length - 1]

  for (let row = 0; row <= rowCount; row += 1) {
    drawLine(layer, gridLeft, row * state.rh, gridRight, row * state.rh, 'grid-line')
  }

  columnBoundaries.forEach((column) => {
    drawLine(layer, column, 0, column, rowCount * state.rh, 'grid-line')
  })
}

const createDomText = (text, className, left, top, size, extra = {}) => {
  const node = document.createElement('span')
  node.className = className
  node.textContent = text
  node.style.left = `${left}px`
  node.style.top = `${top}px`
  node.style.width = `${size}px`
  node.style.height = `${state.rh}px`
  Object.entries(extra).forEach(([property, value]) => {
    node.style.setProperty(property, value)
  })
  return node
}

const addDomNumber = (parent, text, position, row, className, baseX, width, extra = {}) => {
  const start = position - text.length + 1

  ;[...text].forEach((digit, index) => {
    parent.appendChild(createDomText(
      digit,
      `math-digit ${className}`,
      baseX + (start + index) * width,
      row * state.rh,
      width,
      extra,
    ))
  })
}

const addDomDigitAt = (parent, digit, position, row, className, baseX, width, extra = {}) => {
  parent.appendChild(createDomText(
    digit,
    `math-digit ${className}`,
    baseX + position * width,
    row * state.rh,
    width,
    extra,
  ))
}

const addDomDecimalPoint = (parent, position, row, baseX, width) => {
  const dotWidth = width / 3
  parent.appendChild(createDomText(
    '.',
    'math-dot',
    baseX + position * width - dotWidth / 2,
    row * state.rh + state.rh * 0.12,
    dotWidth,
  ))
}

const drawDomLine = (layer, x1, y1, x2, y2, className) => {
  const line = document.createElement('div')
  const isVertical = x1 === x2
  line.className = `${className} ${isVertical ? 'line-vertical' : 'line-horizontal'}`
  line.style.left = `${Math.min(x1, x2)}px`
  line.style.top = `${Math.min(y1, y2)}px`
  line.style.width = `${Math.max(Math.abs(x2 - x1), 1)}px`
  line.style.height = `${Math.max(Math.abs(y2 - y1), 1)}px`
  layer.appendChild(line)
}

const drawDomGrid = (layer, columnBoundaries, rowCount) => {
  if (!state.showGrid) return

  const gridLeft = columnBoundaries[0]
  const gridRight = columnBoundaries[columnBoundaries.length - 1]

  for (let row = 0; row <= rowCount; row += 1) {
    drawDomLine(layer, gridLeft, row * state.rh, gridRight, row * state.rh, 'grid-line')
  }

  columnBoundaries.forEach((column) => {
    drawDomLine(layer, column, 0, column, rowCount * state.rh, 'grid-line')
  })
}

const createLayout = (division) => {
  const divisorWidth = division.divisorDigits.length * state.cw
  const arcWidth = state.cw / 2
  const divisorLeft = 20
  const divisorRight = divisorLeft + divisorWidth
  const arcLeft = divisorRight
  const baseX = arcLeft + arcWidth
  const digitCount = Math.max(division.digitCount, division.dividendDigits.length)
  const rightBoundary = baseX + digitCount * state.cw
  const visibleSteps = division.steps.filter((step) => step.showSubtract)
  const longestSubtractionLeft = visibleSteps.length > 0
    ? Math.min(...visibleSteps.map((step) => step.currentLeft))
    : 0
  const operationRowCount = Math.max(
    visibleSteps.length === 0 ? 3 : visibleSteps.length * 2 + 2,
    4,
  )

  const gridColumns = []

  for (let index = 0; index <= division.divisorDigits.length; index += 1) {
    gridColumns.push(divisorLeft + index * state.cw)
  }

  gridColumns.push(baseX)

  for (let index = 1; index <= digitCount; index += 1) {
    gridColumns.push(baseX + index * state.cw)
  }

  return {
    arcLeft,
    arcWidth,
    baseX,
    digitCount,
    divisorLeft,
    operationRowCount,
    rightBoundary,
    visibleSteps,
    longestSubtractionLeft,
    gridColumns,
    stageHeight: operationRowCount * state.rh + 12,
  }
}

const renderDivision = (division) => {
  const layout = createLayout(division)
  const {
    arcLeft,
    arcWidth,
    baseX,
    divisorLeft,
    operationRowCount,
    rightBoundary,
    visibleSteps,
    longestSubtractionLeft,
    gridColumns,
    stageHeight,
  } = layout

  ;[elements.svgStage, elements.domStage].forEach((stage) => {
    stage.style.setProperty('--digit-size', `${state.cw * state.fsRatio}px`)
    stage.style.width = `${rightBoundary + 26}px`
    stage.style.height = `${stageHeight}px`
  })
  elements.dom.style.width = `${rightBoundary + 26}px`
  elements.dom.style.height = `${stageHeight}px`
  elements.svg.setAttribute('viewBox', `0 0 ${rightBoundary + 26} ${stageHeight}`)
  elements.svg.setAttribute('width', String(rightBoundary + 26))
  elements.svg.setAttribute('height', String(stageHeight))
  elements.svg.setAttribute('aria-label', `${division.dividendDigits} 除以 ${division.divisorDigits} 的竖式`)
  elements.svg.replaceChildren()
  elements.lineLayer.replaceChildren()
  elements.mathLayer.replaceChildren()

  const dividendRow = 1
  const quotientRow = 0
  const mathLayer = createSvgNode('g', { class: 'svg-text-layer' })
  const lineLayer = createSvgNode('g', { class: 'svg-line-layer', 'aria-hidden': 'true' })

  drawGrid(lineLayer, gridColumns, operationRowCount)

  const arcStartX = arcLeft
  const arcEndX = arcLeft + arcWidth
  const arcStartY = dividendRow * state.rh + state.rh
  const arcEndY = dividendRow * state.rh
  const curveRadius = Math.min(arcWidth, state.rh) * Math.min(Math.max(state.bend, 0.35), 1)
  lineLayer.appendChild(createSvgNode('path', {
    class: 'division-arc',
    d: `M ${arcStartX} ${arcStartY} H ${arcEndX - curveRadius} Q ${arcEndX} ${arcStartY} ${arcEndX} ${arcStartY - curveRadius} V ${arcEndY}`,
  }))
  drawLine(lineLayer, arcEndX, arcEndY, rightBoundary, arcEndY, 'division-top-line')

  addNumber(
    mathLayer,
    division.divisorDigits,
    division.divisorDigits.length - 1,
    dividendRow,
    'divisor-digit',
    divisorLeft,
    state.cw,
  )

  ;[...division.dividendDigits].forEach((digit, index) => {
    addDigitAt(mathLayer, digit, index, dividendRow, 'dividend-digit', baseX, state.cw)
  })

  for (let index = 0; index < division.fractionalDigitCount; index += 1) {
    addDigitAt(
      mathLayer,
      '0',
      division.dividendDigits.length + index,
      dividendRow,
      'appended-zero',
      baseX,
      state.cw,
    )
  }

  division.quotientByPosition.forEach((digit, position) => {
    addDigitAt(mathLayer, digit, position, quotientRow, 'quotient-digit', baseX, state.cw)
  })

  if (division.hasFraction) {
    addDecimalPoint(mathLayer, division.dividendDigits.length, quotientRow, baseX, state.cw)
  }

  visibleSteps.forEach((operation, index) => {
    const isFirstStep = index === 0
    const row = isFirstStep ? 2 : 1 + index * 2

    if (!isFirstStep) {
      addNumber(mathLayer, operation.currentText, operation.position, row, 'minuend-digit', baseX, state.cw)
    }

    const productRow = isFirstStep ? row : row + 1
    addNumber(mathLayer, operation.productText, operation.position, productRow, 'product-digit', baseX, state.cw)
    const lineY = (productRow + 1) * state.rh
    const lineStart = baseX + (state.uniformSubtractionLines
      ? longestSubtractionLeft
      : operation.currentLeft) * state.cw
    drawLine(lineLayer, lineStart, lineY, rightBoundary, lineY, 'subtraction-line')
  })

  addNumber(
    mathLayer,
    division.remainder,
    division.digitCount - 1,
    visibleSteps.length === 0 ? 2 : 1 + visibleSteps.length * 2,
    'minuend-digit',
    baseX,
    state.cw,
  )

  elements.svg.append(lineLayer, mathLayer)
  renderDomDivision(division, layout)
}

const renderDomDivision = (division, layout) => {
  const {
    arcLeft,
    arcWidth,
    baseX,
    divisorLeft,
    operationRowCount,
    rightBoundary,
    visibleSteps,
    longestSubtractionLeft,
    gridColumns,
  } = layout
  const dividendRow = 1
  const quotientRow = 0

  drawDomGrid(elements.lineLayer, gridColumns, operationRowCount)

  const curve = document.createElement('div')
  curve.className = 'division-arc'
  curve.style.left = `${arcLeft}px`
  curve.style.top = `${dividendRow * state.rh}px`
  curve.style.width = `${arcWidth}px`
  curve.style.height = `${state.rh}px`
  curve.style.setProperty('--arc-radius', `${state.bend * 100}%`)
  elements.lineLayer.appendChild(curve)
  drawDomLine(elements.lineLayer, arcLeft + arcWidth, dividendRow * state.rh, rightBoundary, dividendRow * state.rh, 'division-top-line')

  addDomNumber(elements.mathLayer, division.divisorDigits, division.divisorDigits.length - 1, dividendRow, 'divisor-digit', divisorLeft, state.cw)

  ;[...division.dividendDigits].forEach((digit, index) => {
    addDomDigitAt(elements.mathLayer, digit, index, dividendRow, 'dividend-digit', baseX, state.cw)
  })

  for (let index = 0; index < division.fractionalDigitCount; index += 1) {
    addDomDigitAt(elements.mathLayer, '0', division.dividendDigits.length + index, dividendRow, 'appended-zero', baseX, state.cw)
  }

  division.quotientByPosition.forEach((digit, position) => {
    addDomDigitAt(elements.mathLayer, digit, position, quotientRow, 'quotient-digit', baseX, state.cw)
  })

  if (division.hasFraction) {
    addDomDecimalPoint(elements.mathLayer, division.dividendDigits.length, quotientRow, baseX, state.cw)
  }

  visibleSteps.forEach((operation, index) => {
    const isFirstStep = index === 0
    const row = isFirstStep ? 2 : 1 + index * 2

    if (!isFirstStep) {
      addDomNumber(elements.mathLayer, operation.currentText, operation.position, row, 'minuend-digit', baseX, state.cw)
    }

    const productRow = isFirstStep ? row : row + 1
    addDomNumber(elements.mathLayer, operation.productText, operation.position, productRow, 'product-digit', baseX, state.cw)
    const lineY = (productRow + 1) * state.rh
    const lineStart = baseX + (state.uniformSubtractionLines
      ? longestSubtractionLeft
      : operation.currentLeft) * state.cw
    drawDomLine(elements.lineLayer, lineStart, lineY, rightBoundary, lineY, 'subtraction-line')
  })

  addDomNumber(
    elements.mathLayer,
    division.remainder,
    division.digitCount - 1,
    visibleSteps.length === 0 ? 2 : 1 + visibleSteps.length * 2,
    'minuend-digit',
    baseX,
    state.cw,
  )
}

const updateRangeOutputs = () => {
  elements.cwOutput.textContent = `${state.cw}px`
  elements.rhOutput.textContent = `${state.rh}px`
  elements.fsOutput.textContent = state.fsRatio.toFixed(2)
  elements.bendOutput.textContent = state.bend.toFixed(2)
}

const render = () => {
  try {
    const division = computeDivision(state.divisor, state.dividend, {
      resultMode: state.resultMode,
      maxDecimalDigits: state.maxDecimalDigits,
    })
    elements.error.textContent = ''
    elements.resultTitle.textContent = `${state.dividend} ÷ ${state.divisor}`
    elements.answer.textContent = division.remainder === '0'
      ? division.quotientText
      : `${division.quotientText} …… ${division.remainder}`
    elements.normalization.textContent = division.decimalFallback
      ? `小数模式未能在 ${state.maxDecimalDigits} 位内算尽，已切换为余数：${division.remainder}`
      : division.hasFraction
        ? `小数模式：${division.dividendDigits} ÷ ${division.divisorDigits} = ${division.quotientText}`
        : `整数逐位长除法：${division.dividendDigits} ÷ ${division.divisorDigits} · 余数 ${division.remainder}`
    renderDivision(division)
  } catch (error) {
    elements.error.textContent = error instanceof Error ? error.message : '输入无法计算，请检查格式。'
    elements.answer.textContent = '—'
    elements.svg.replaceChildren()
    elements.lineLayer.replaceChildren()
    elements.mathLayer.replaceChildren()
  }
}

const bindControls = () => {
  elements.form.addEventListener('submit', (event) => {
    event.preventDefault()
    state.divisor = elements.divisorInput.value
    state.dividend = elements.dividendInput.value
    render()
  })

  elements.sampleButton.addEventListener('click', () => {
    elements.divisorInput.value = '25'
    elements.dividendInput.value = '10230'
    state.divisor = '25'
    state.dividend = '10230'
    render()
  })

  elements.divisorInput.addEventListener('input', () => {
    state.divisor = elements.divisorInput.value
    render()
  })

  elements.dividendInput.addEventListener('input', () => {
    state.dividend = elements.dividendInput.value
    render()
  })

  elements.cwInput.addEventListener('input', (event) => {
    state.cw = Number(event.target.value)
    updateRangeOutputs()
    render()
  })

  elements.rhInput.addEventListener('input', (event) => {
    state.rh = Number(event.target.value)
    updateRangeOutputs()
    render()
  })

  elements.fsInput.addEventListener('input', (event) => {
    state.fsRatio = Number(event.target.value)
    updateRangeOutputs()
    render()
  })

  elements.bendInput.addEventListener('input', (event) => {
    state.bend = Number(event.target.value)
    updateRangeOutputs()
    render()
  })

  elements.gridInput.addEventListener('change', (event) => {
    state.showGrid = event.target.checked
    render()
  })

  elements.uniformSubtractionInput.addEventListener('change', (event) => {
    state.uniformSubtractionLines = event.target.checked
    render()
  })

  elements.resultModeInputs.forEach((input) => {
    input.addEventListener('change', (event) => {
      state.resultMode = event.target.value
      render()
    })
  })

}

updateRangeOutputs()
bindControls()
render()
