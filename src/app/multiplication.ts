/** Multiplication page entry: wires the multiplication calculator through the shared board renderers. */
import '../styles/main.css'
import JSONFormatter from 'json-formatter-js'
import { computeMultiplication } from '../calculators/multiplication'
import { createMultiplicationBoardScene } from '../layouts/multiplication-layout'
import { renderDomBoard } from '../renderers/dom-board-renderer'
import { renderSvgBoard } from '../renderers/svg-board-renderer'
import { resolveBoardMetrics } from '../scene/geometry'
import type { BoardTextHorizontalAlign, BoardTextVerticalAlign } from '../scene/types'

type RendererMode = 'svg' | 'dom'

const state = {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
  textHorizontalAlign: 'center' as BoardTextHorizontalAlign,
  textVerticalAlign: 'center' as BoardTextVerticalAlign,
  uniformMultiplicationBars: false,
  showCarrySteps: true,
  rendererMode: 'svg' as RendererMode,
  multiplicand: '145',
  multiplier: '12',
}

const requiredElement = <ElementType extends Element>(selector: string): ElementType => {
  const element = document.querySelector<ElementType>(selector)
  if (!element) throw new Error(`页面缺少必要元素：${selector}`)
  return element
}

const elements = {
  form: requiredElement<HTMLFormElement>('#multiplication-form'),
  multiplicandInput: requiredElement<HTMLInputElement>('#multiplicand-input'),
  multiplierInput: requiredElement<HTMLInputElement>('#multiplier-input'),
  sampleButton: requiredElement<HTMLButtonElement>('#multiplication-sample-button'),
  error: requiredElement<HTMLElement>('#multiplication-error-message'),
  cellWidthInput: requiredElement<HTMLInputElement>('#multiplication-cw-input'),
  rowHeightInput: requiredElement<HTMLInputElement>('#multiplication-rh-input'),
  fontSizeInput: requiredElement<HTMLInputElement>('#multiplication-fs-input'),
  guideGridInput: requiredElement<HTMLInputElement>('#multiplication-grid-input'),
  uniformBarsInput: requiredElement<HTMLInputElement>('#multiplication-uniform-bars-input'),
  carryStepsInput: requiredElement<HTMLInputElement>('#multiplication-carry-steps-input'),
  textHorizontalAlignInput: requiredElement<HTMLSelectElement>('#multiplication-text-horizontal-align-input'),
  textVerticalAlignInput: requiredElement<HTMLSelectElement>('#multiplication-text-vertical-align-input'),
  rendererModeInputs: document.querySelectorAll<HTMLInputElement>('input[name="multiplication-renderer-mode"]'),
  cellWidthOutput: requiredElement<HTMLOutputElement>('#multiplication-cw-output'),
  rowHeightOutput: requiredElement<HTMLOutputElement>('#multiplication-rh-output'),
  fontSizeOutput: requiredElement<HTMLOutputElement>('#multiplication-fs-output'),
  resultTitle: requiredElement<HTMLElement>('#multiplication-result-title'),
  answer: requiredElement<HTMLOutputElement>('#multiplication-answer-output'),
  normalization: requiredElement<HTMLElement>('#multiplication-normalization-output'),
  calculationJson: requiredElement<HTMLElement>('#multiplication-calculation-json-output'),
  rendererInputJson: requiredElement<HTMLElement>('#multiplication-renderer-input-output'),
  svgRendererPanel: requiredElement<HTMLElement>('#multiplication-svg-renderer-panel'),
  domRendererPanel: requiredElement<HTMLElement>('#multiplication-dom-renderer-panel'),
  svgStage: requiredElement<HTMLElement>('#multiplication-svg-stage'),
  domStage: requiredElement<HTMLElement>('#multiplication-dom-stage'),
  svg: requiredElement<SVGSVGElement>('#multiplication-svg'),
  dom: requiredElement<HTMLElement>('#multiplication-dom'),
  domLineLayer: requiredElement<HTMLElement>('#multiplication-line-layer'),
  domDigitLayer: requiredElement<HTMLElement>('#multiplication-digit-layer'),
}

const updateRendererMode = (): void => {
  const showsSvg = state.rendererMode === 'svg'
  elements.svgRendererPanel.hidden = !showsSvg
  elements.domRendererPanel.hidden = showsSvg
}

const updateRangeOutputs = (): void => {
  elements.cellWidthOutput.textContent = `${state.cellWidth}px`
  elements.rowHeightOutput.textContent = `${state.rowHeight}px`
  elements.fontSizeOutput.textContent = state.fontSizeRatio.toFixed(2)
}

const render = (): void => {
  try {
    const computation = computeMultiplication(state.multiplicand, state.multiplier)
    const boardScene = createMultiplicationBoardScene(computation, {
      cellWidth: state.cellWidth,
      rowHeight: state.rowHeight,
      fontSizeRatio: state.fontSizeRatio,
      showGuideGrid: state.showGuideGrid,
      textHorizontalAlign: state.textHorizontalAlign,
      textVerticalAlign: state.textVerticalAlign,
      uniformMultiplicationBars: state.uniformMultiplicationBars,
      showCarrySteps: state.showCarrySteps,
    })
    const boardMetrics = resolveBoardMetrics(boardScene)

    elements.error.textContent = ''
    elements.resultTitle.textContent = `${state.multiplicand} × ${state.multiplier}`
    elements.answer.textContent = computation.productDigits
    elements.normalization.textContent = `逐位乘法：${computation.multiplicandDigits} × ${computation.multiplierDigits} = ${computation.productDigits}`
    ;[elements.svgStage, elements.domStage].forEach((stage) => {
      stage.style.width = `${boardMetrics.width}px`
      stage.style.height = `${boardMetrics.height}px`
    })
    elements.dom.style.width = `${boardMetrics.width}px`
    elements.dom.style.height = `${boardMetrics.height}px`
    elements.domLineLayer.replaceChildren()
    elements.domDigitLayer.replaceChildren()
    renderSvgBoard(elements.svg, boardScene)
    renderDomBoard(elements.domLineLayer, elements.domDigitLayer, boardScene)
    updateRendererMode()

    const calculationFormatter = new JSONFormatter(computation, Infinity, {
      animateOpen: false, animateClose: false, hoverPreviewEnabled: true, maxArrayItems: 8,
    })
    elements.calculationJson.replaceChildren(calculationFormatter.render())
    const rendererInputFormatter = new JSONFormatter(boardScene, Infinity, {
      animateOpen: false, animateClose: false, hoverPreviewEnabled: true, maxArrayItems: 8,
    })
    elements.rendererInputJson.replaceChildren(rendererInputFormatter.render())
  } catch (error) {
    elements.error.textContent = error instanceof Error ? error.message : '输入无法计算，请检查格式。'
    elements.answer.textContent = '—'
    elements.svg.replaceChildren()
    elements.domLineLayer.replaceChildren()
    elements.domDigitLayer.replaceChildren()
    elements.calculationJson.replaceChildren()
    elements.rendererInputJson.replaceChildren()
  }
}

const bindControls = (): void => {
  elements.form.addEventListener('submit', (event) => {
    event.preventDefault()
    state.multiplicand = elements.multiplicandInput.value
    state.multiplier = elements.multiplierInput.value
    render()
  })
  elements.sampleButton.addEventListener('click', () => {
    elements.multiplicandInput.value = '145'
    elements.multiplierInput.value = '12'
    state.multiplicand = '145'
    state.multiplier = '12'
    render()
  })
  elements.multiplicandInput.addEventListener('input', () => {
    state.multiplicand = elements.multiplicandInput.value
    render()
  })
  elements.multiplierInput.addEventListener('input', () => {
    state.multiplier = elements.multiplierInput.value
    render()
  })
  elements.cellWidthInput.addEventListener('input', () => {
    state.cellWidth = Number(elements.cellWidthInput.value)
    updateRangeOutputs()
    render()
  })
  elements.rowHeightInput.addEventListener('input', () => {
    state.rowHeight = Number(elements.rowHeightInput.value)
    updateRangeOutputs()
    render()
  })
  elements.fontSizeInput.addEventListener('input', () => {
    state.fontSizeRatio = Number(elements.fontSizeInput.value)
    updateRangeOutputs()
    render()
  })
  elements.guideGridInput.addEventListener('change', () => {
    state.showGuideGrid = elements.guideGridInput.checked
    render()
  })
  elements.uniformBarsInput.addEventListener('change', () => {
    state.uniformMultiplicationBars = elements.uniformBarsInput.checked
    render()
  })
  elements.carryStepsInput.addEventListener('change', () => {
    state.showCarrySteps = elements.carryStepsInput.checked
    render()
  })
  elements.textHorizontalAlignInput.addEventListener('change', () => {
    state.textHorizontalAlign = elements.textHorizontalAlignInput.value as BoardTextHorizontalAlign
    render()
  })
  elements.textVerticalAlignInput.addEventListener('change', () => {
    state.textVerticalAlign = elements.textVerticalAlignInput.value as BoardTextVerticalAlign
    render()
  })
  elements.rendererModeInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (!input.checked) return
      state.rendererMode = input.value as RendererMode
      updateRendererMode()
    })
  })
}

updateRangeOutputs()
bindControls()
render()
