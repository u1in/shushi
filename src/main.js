import './style.css'
import { computeDivision } from './division.js'

const state = {
  cw: 44,
  rh: 46,
  fsRatio: 0.62,
  bend: 1,
  showGrid: false,
  resultMode: 'decimal',
  maxDecimalDigits: 24,
  divisor: '25',
  dividend: '12345',
}

const elements = {
  form: document.querySelector('#division-form'),
  settingsPanel: document.querySelector('.settings-panel'),
  settingsToggle: document.querySelector('.settings-toggle'),
  divisorInput: document.querySelector('#divisor-input'),
  dividendInput: document.querySelector('#dividend-input'),
  sampleButton: document.querySelector('#sample-button'),
  error: document.querySelector('#error-message'),
  cwInput: document.querySelector('#cw-input'),
  rhInput: document.querySelector('#rh-input'),
  fsInput: document.querySelector('#fs-input'),
  bendInput: document.querySelector('#bend-input'),
  gridInput: document.querySelector('#grid-input'),
  resultModeInput: document.querySelector('#result-mode-input'),
  cwOutput: document.querySelector('#cw-output'),
  rhOutput: document.querySelector('#rh-output'),
  fsOutput: document.querySelector('#fs-output'),
  bendOutput: document.querySelector('#bend-output'),
  resultTitle: document.querySelector('#result-title'),
  answer: document.querySelector('#answer-output'),
  normalization: document.querySelector('#normalization-output'),
  stage: document.querySelector('#division-stage'),
  lineLayer: document.querySelector('#math-lines'),
  mathLayer: document.querySelector('#math-layer'),
}

const createText = (text, className, left, top, size, extra = {}) => {
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

const addNumber = (parent, text, position, row, className, baseX, width, extra = {}) => {
  const start = position - text.length + 1

  ;[...text].forEach((digit, index) => {
    parent.appendChild(createText(
      digit,
      `math-digit ${className}`,
      baseX + (start + index) * width,
      row * state.rh,
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
    row * state.rh,
    width,
    extra,
  ))
}

const addDecimalPoint = (parent, position, row, baseX, width) => {
  const dotWidth = width / 3
  parent.appendChild(createText(
    '.',
    'math-dot',
    baseX + position * width - dotWidth / 2,
    row * state.rh + state.rh * 0.12,
    dotWidth,
  ))
}

const drawLine = (layer, x1, y1, x2, y2, className) => {
  const line = document.createElement('div')
  const isVertical = x1 === x2
  line.className = `${className} ${isVertical ? 'line-vertical' : 'line-horizontal'}`
  line.style.left = `${Math.min(x1, x2)}px`
  line.style.top = `${Math.min(y1, y2)}px`
  line.style.width = `${Math.max(Math.abs(x2 - x1), 1)}px`
  line.style.height = `${Math.max(Math.abs(y2 - y1), 1)}px`
  layer.appendChild(line)
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

const renderDivision = (division) => {
  const divisorWidth = division.divisorDigits.length * state.cw
  const arcWidth = state.cw / 2
  const divisorLeft = 20
  const divisorRight = divisorLeft + divisorWidth
  const arcLeft = divisorRight
  const baseX = arcLeft + arcWidth
  const digitCount = Math.max(division.digitCount, division.dividendDigits.length)
  const rightBoundary = baseX + digitCount * state.cw
  const visibleSteps = division.steps.filter((step) => step.showSubtract)
  const operationRowCount = Math.max(
    visibleSteps.length === 0 ? 3 : visibleSteps.length * 2 + 2,
    4,
  )
  const stageHeight = operationRowCount * state.rh + 12

  elements.stage.style.setProperty('--digit-size', `${state.cw * state.fsRatio}px`)
  elements.stage.style.width = `${rightBoundary + 26}px`
  elements.stage.style.height = `${stageHeight}px`
  elements.lineLayer.style.width = `${rightBoundary + 26}px`
  elements.lineLayer.style.height = `${stageHeight}px`
  elements.lineLayer.replaceChildren()
  elements.mathLayer.replaceChildren()

  const dividendRow = 1
  const quotientRow = 0
  const mathLayer = elements.mathLayer
  const gridColumns = []

  for (let index = 0; index <= division.divisorDigits.length; index += 1) {
    gridColumns.push(divisorLeft + index * state.cw)
  }

  gridColumns.push(baseX)

  for (let index = 1; index <= digitCount; index += 1) {
    gridColumns.push(baseX + index * state.cw)
  }

  drawGrid(elements.lineLayer, gridColumns, operationRowCount)

  const arcStartX = arcLeft
  const arcEndX = arcLeft + arcWidth
  const arcStartY = dividendRow * state.rh + state.rh
  const arcEndY = dividendRow * state.rh
  const curve = document.createElement('div')
  curve.className = 'division-arc'
  curve.style.left = `${arcStartX}px`
  curve.style.top = `${arcEndY}px`
  curve.style.width = `${arcWidth}px`
  curve.style.height = `${state.rh}px`
  curve.style.setProperty('--arc-radius', `${state.bend * 100}%`)
  elements.lineLayer.appendChild(curve)
  drawLine(elements.lineLayer, arcEndX, arcEndY, rightBoundary, arcEndY, 'division-top-line')

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
    const lineStart = baseX + operation.currentLeft * state.cw
    drawLine(elements.lineLayer, lineStart, lineY, rightBoundary, lineY, 'subtraction-line')
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
    elements.mathLayer.replaceChildren()
    elements.lineLayer.replaceChildren()
  }
}

const bindControls = () => {
  elements.settingsToggle.addEventListener('click', () => {
    const isExpanded = elements.settingsToggle.getAttribute('aria-expanded') === 'true'
    elements.settingsToggle.setAttribute('aria-expanded', String(!isExpanded))
    elements.settingsPanel.classList.toggle('is-expanded', !isExpanded)
  })

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault()
    state.divisor = elements.divisorInput.value
    state.dividend = elements.dividendInput.value
    render()
  })

  elements.sampleButton.addEventListener('click', () => {
    elements.divisorInput.value = '25'
    elements.dividendInput.value = '12345'
    state.divisor = '25'
    state.dividend = '12345'
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

  elements.resultModeInput.addEventListener('change', (event) => {
    state.resultMode = event.target.value
    render()
  })
}

updateRangeOutputs()
bindControls()
render()
