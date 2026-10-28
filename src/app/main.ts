/** Main page entry: wires the current calculator, board scene, controls, and render modes. */
import '../styles/main.css'
import { resolveBoardMetrics } from '../scene/geometry'
import { computeDivision } from '../calculators/division'
import { renderDomBoard } from '../renderers/dom-board-renderer'
import JSONFormatter from 'json-formatter-js'
import { renderSvgBoard } from '../renderers/svg-board-renderer'
import type { BoardTextHorizontalAlign, BoardTextVerticalAlign, DivisionResultMode } from '../scene/types'
import { createDivisionBoardScene } from '../layouts/division-layout'

type RendererMode = 'svg' | 'dom'

const state = {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
  textHorizontalAlign: 'center' as BoardTextHorizontalAlign,
  textVerticalAlign: 'center' as BoardTextVerticalAlign,
  uniformSubtractionBars: false,
  showZeroQuotientSteps: false,
  resultMode: 'decimal' as DivisionResultMode,
  rendererMode: 'svg' as RendererMode,
  maxDecimalDigits: 24,
  divisor: '25',
  dividend: '10230',
}

const requiredElement = <ElementType extends Element>(selector: string): ElementType => {
  const element = document.querySelector<ElementType>(selector)
  if (!element) throw new Error(`页面缺少必要元素：${selector}`)
  return element
}

const elements = {
  form: requiredElement<HTMLFormElement>('#division-form'),
  divisorInput: requiredElement<HTMLInputElement>('#divisor-input'),
  dividendInput: requiredElement<HTMLInputElement>('#dividend-input'),
  sampleButton: requiredElement<HTMLButtonElement>('#sample-button'),
  error: requiredElement<HTMLElement>('#error-message'),
  cellWidthInput: requiredElement<HTMLInputElement>('#cw-input'),
  rowHeightInput: requiredElement<HTMLInputElement>('#rh-input'),
  fontSizeInput: requiredElement<HTMLInputElement>('#fs-input'),
  guideGridInput: requiredElement<HTMLInputElement>('#grid-input'),
  textHorizontalAlignInput: requiredElement<HTMLSelectElement>('#text-horizontal-align-input'),
  textVerticalAlignInput: requiredElement<HTMLSelectElement>('#text-vertical-align-input'),
  uniformSubtractionInput: requiredElement<HTMLInputElement>('#uniform-subtraction-input'),
  zeroQuotientStepsInput: requiredElement<HTMLInputElement>('#zero-quotient-steps-input'),
  resultModeInputs: document.querySelectorAll<HTMLInputElement>('input[name="result-mode"]'),
  rendererModeInputs: document.querySelectorAll<HTMLInputElement>('input[name="renderer-mode"]'),
  cellWidthOutput: requiredElement<HTMLOutputElement>('#cw-output'),
  rowHeightOutput: requiredElement<HTMLOutputElement>('#rh-output'),
  fontSizeOutput: requiredElement<HTMLOutputElement>('#fs-output'),
  resultTitle: requiredElement<HTMLElement>('#result-title'),
  answer: requiredElement<HTMLOutputElement>('#answer-output'),
  normalization: requiredElement<HTMLElement>('#normalization-output'),
  calculationJson: requiredElement<HTMLElement>('#calculation-json-output'),
  rendererInputJson: requiredElement<HTMLElement>('#renderer-input-output'),
  svgRendererPanel: requiredElement<HTMLElement>('#svg-renderer-panel'),
  domRendererPanel: requiredElement<HTMLElement>('#dom-renderer-panel'),
  svgStage: requiredElement<HTMLElement>('#svg-stage'),
  domStage: requiredElement<HTMLElement>('#dom-stage'),
  svg: requiredElement<SVGSVGElement>('#division-svg'),
  dom: requiredElement<HTMLElement>('#division-dom'),
  domLineLayer: requiredElement<HTMLElement>('#division-line-layer'),
  domDigitLayer: requiredElement<HTMLElement>('#division-digit-layer'),
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
    const computation = computeDivision(state.divisor, state.dividend, {
      resultMode: state.resultMode,
      maxDecimalDigits: state.maxDecimalDigits,
    })
    const boardScene = createDivisionBoardScene(computation, {
      cellWidth: state.cellWidth,
      rowHeight: state.rowHeight,
      fontSizeRatio: state.fontSizeRatio,
      bracketBend: 1,
      showGuideGrid: state.showGuideGrid,
      textHorizontalAlign: state.textHorizontalAlign,
      textVerticalAlign: state.textVerticalAlign,
      uniformSubtractionBars: state.uniformSubtractionBars,
      showZeroQuotientSteps: state.showZeroQuotientSteps,
    })

    elements.error.textContent = ''
    elements.resultTitle.textContent = `${state.dividend} ÷ ${state.divisor}`
    elements.answer.textContent = computation.remainder === '0'
      ? computation.quotientText
      : `${computation.quotientText} …… ${computation.remainder}`
    elements.normalization.textContent = computation.decimalFallback
      ? `小数模式未能在 ${state.maxDecimalDigits} 位内算尽，已切换为余数：${computation.remainder}`
      : computation.hasFraction
        ? `小数模式：${computation.dividendDigits} ÷ ${computation.divisorDigits} = ${computation.quotientText}`
        : `整数逐位长除法：${computation.dividendDigits} ÷ ${computation.divisorDigits} · 余数 ${computation.remainder}`

    const boardMetrics = resolveBoardMetrics(boardScene)
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

    const jsonFormatter = new JSONFormatter(computation, Infinity, {
      animateOpen: false,
      animateClose: false,
      hoverPreviewEnabled: true,
      maxArrayItems: 8,
    })
    elements.calculationJson.replaceChildren(jsonFormatter.render())
    const rendererInputFormatter = new JSONFormatter(boardScene, Infinity, {
      animateOpen: false,
      animateClose: false,
      hoverPreviewEnabled: true,
      maxArrayItems: 8,
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
  elements.textHorizontalAlignInput.addEventListener('change', () => {
    state.textHorizontalAlign = elements.textHorizontalAlignInput.value as BoardTextHorizontalAlign
    render()
  })
  elements.textVerticalAlignInput.addEventListener('change', () => {
    state.textVerticalAlign = elements.textVerticalAlignInput.value as BoardTextVerticalAlign
    render()
  })
  elements.uniformSubtractionInput.addEventListener('change', () => {
    state.uniformSubtractionBars = elements.uniformSubtractionInput.checked
    render()
  })
  elements.zeroQuotientStepsInput.addEventListener('change', () => {
    state.showZeroQuotientSteps = elements.zeroQuotientStepsInput.checked
    render()
  })
  elements.resultModeInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (input.checked) {
        state.resultMode = input.value as DivisionResultMode
        render()
      }
    })
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
