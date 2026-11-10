<script setup lang="ts">
import { computed, ref } from 'vue'
import { shushi, getDivisionPlaybackStepCount } from '@u1in/shushi-core'
import GridPreview from './GridPreview.vue'
import VisibleTextRowsPanel from './VisibleTextRowsPanel.vue'
import CopyMacroButton from './CopyMacroButton.vue'
import CodeImplementationPanel from './CodeImplementationPanel.vue'
import { createShushiImplementationSnippet } from './implementationSnippets'
import { DEFAULT_RENDERER_FONT, type RendererFontFamily } from './rendererFonts'
import type { DivisionComputation, DivisionVerticalArithmeticResult, GridScene } from '@u1in/shushi-core'
import { useCalculatorStepPlayback } from '../composables/stepPlayback'
import StepPlaybackControls from './StepPlaybackControls.vue'

const dividend = ref('10230')
const divisor = ref('25')
// 留空时采用默认小数展开上限；老师可填写更精确的位数。
const maxDecimalDigits = ref('')
const cellWidth = ref(30)
const rowHeight = ref(46)
const fontSizeRatio = ref(1)
const rendererFont = ref<RendererFontFamily>(DEFAULT_RENDERER_FONT)
const showGuideGrid = ref(false)
const uniformSubtractionBars = ref(false)
const showZeroQuotientSteps = ref(false)
const error = ref('')
const computation = ref<DivisionComputation>()
const scene = ref<GridScene>()
const macroSource = ref('')
const divisionCalculation = computed(() =>
  maxDecimalDigits.value.trim() === '' ? {} : { maxDecimalDigits: Number(maxDecimalDigits.value) },
)

const renderScene = (): void => {
  const result = shushi(`${dividend.value} ÷ ${divisor.value}`, {
    fontFamily: rendererFont.value,
    calculation: divisionCalculation.value,
    settings: {
      cellWidth: cellWidth.value,
      rowHeight: rowHeight.value,
      fontSizeRatio: fontSizeRatio.value,
      bracketBend: 1,
      showGuideGrid: showGuideGrid.value,
      uniformSubtractionBars: uniformSubtractionBars.value,
      showZeroQuotientSteps: showZeroQuotientSteps.value,
      visibleStepCount: visibleStepCount.value,
    },
  }) as DivisionVerticalArithmeticResult
  computation.value = result.computation
  macroSource.value = result.source
  scene.value = result.scene
}
const handleFontChange = (fontFamily: RendererFontFamily): void => {
  rendererFont.value = fontFamily
  renderScene()
}
const playback = useCalculatorStepPlayback({
  getStepCount: () => {
    const result = computation.value
    return result ? getDivisionPlaybackStepCount(result, showZeroQuotientSteps.value) : 0
  },
  render: renderScene,
})
const visibleStepCount = playback.visibleStepCount
const currentStep = playback.currentStep
const stepCount = playback.stepCount
const canStart = playback.canStart
const canPrevious = playback.canPrevious
const canNext = playback.canNext
const implementationCode = computed(() =>
  createShushiImplementationSnippet({
    operation: 'division',
    fontFamily: rendererFont.value,
    fields: [
      ['divisor', divisor.value],
      ['dividend', dividend.value],
    ],
    calculation: maxDecimalDigits.value.trim() === '' ? [] : [['maxDecimalDigits', Number(maxDecimalDigits.value)]],
    settings: [
      ['cellWidth', cellWidth.value],
      ['rowHeight', rowHeight.value],
      ['fontSizeRatio', fontSizeRatio.value],
      ['bracketBend', 1],
      ['showGuideGrid', showGuideGrid.value],
      ['uniformSubtractionBars', uniformSubtractionBars.value],
      ['showZeroQuotientSteps', showZeroQuotientSteps.value],
      ['visibleStepCount', visibleStepCount.value],
    ],
  }),
)

const answer = computed(() =>
  computation.value
    ? computation.value.remainder === '0'
      ? computation.value.quotientText
      : `${computation.value.quotientText} …… ${computation.value.remainder}`
    : '—',
)

const calculate = (): void => {
  try {
    visibleStepCount.value = undefined
    renderScene()
    error.value = ''
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '输入无法计算，请检查格式。'
  }
}

calculate()
</script>

<template>
  <div class="operation-demo operation-demo--division" data-operation="division">
    <section class="workspace" aria-label="除法竖式工作区">
      <form class="control-panel" @submit.prevent="calculate">
        <p class="panel-kicker">LONG DIVISION CALCULATOR</p>
        <h2>除法竖式计算器</h2>
        <p class="normalization">输入被除数和除数，查看试商、减法与商的生成过程。</p>
        <div class="input-grid">
          <label class="field"
            ><span>被除数</span><input v-model="dividend" inputmode="decimal" autocomplete="off" @input="calculate"
          /></label>
          <span class="division-operator" aria-hidden="true">÷</span>
          <label class="field"
            ><span>除数</span><input v-model="divisor" inputmode="decimal" autocomplete="off" @input="calculate"
          /></label>
        </div>
        <p class="error-message" role="alert">{{ error }}</p>
        <div class="form-actions">
          <button
            class="ghost-button"
            type="button"
            @click="
              dividend = '10230'
              divisor = '25'
              calculate()
            "
          >
            试试 10230 ÷ 25
          </button>
        </div>
        <div class="settings-panel">
          <div class="settings-controls">
            <div class="settings-range-group">
              <label class="range-field"
                ><span
                  >方格宽度 <output>{{ cellWidth }}px</output></span
                ><input v-model.number="cellWidth" type="range" min="28" max="56" @input="calculate"
              /></label>
              <label class="range-field"
                ><span
                  >行高 <output>{{ rowHeight }}px</output></span
                ><input v-model.number="rowHeight" type="range" min="36" max="64" @input="calculate"
              /></label>
              <label class="range-field"
                ><span
                  >字号比例 <output>{{ fontSizeRatio.toFixed(2) }}</output></span
                ><input v-model.number="fontSizeRatio" type="range" min="0.5" max="1.5" step="0.01" @input="calculate"
              /></label>
              <label class="field"
                ><span>结果保留小数位数（0 表示仅保留到个位，留空默认 10 位）</span
                ><input
                  v-model="maxDecimalDigits"
                  type="number"
                  min="0"
                  step="1"
                  inputmode="numeric"
                  placeholder="留空时默认 10 位"
                  @input="calculate"
              /></label>
            </div>
            <div class="settings-switch-group">
              <label class="switch-field"
                ><input v-model="showGuideGrid" type="checkbox" @change="calculate" /><span
                  class="switch-ui"
                  aria-hidden="true"
                ></span
                ><span>显示辅助网格</span></label
              >
              <label class="switch-field"
                ><input v-model="uniformSubtractionBars" type="checkbox" @change="calculate" /><span
                  class="switch-ui"
                  aria-hidden="true"
                ></span
                ><span>减法横线等宽</span></label
              >
              <label class="switch-field"
                ><input v-model="showZeroQuotientSteps" type="checkbox" @change="calculate" /><span
                  class="switch-ui"
                  aria-hidden="true"
                ></span
                ><span>显示试商为 0 的步骤</span></label
              >
            </div>
          </div>
        </div>
      </form>
      <section class="result-card" aria-live="polite">
        <div class="calculation-result">
          <p class="panel-kicker result-heading__kicker">CALCULATION</p>
          <div class="result-heading">
            <h2>{{ dividend }} ÷ {{ divisor }} =</h2>
            <output class="answer">{{ answer }}</output
            ><CopyMacroButton :source="macroSource" /><VisibleTextRowsPanel v-if="scene" :scene="scene" />
          </div>
          <p class="normalization">
            {{
              computation?.decimalTruncated
                ? `小数计算到第 ${computation.fractionalDigitCount} 位后停止，保留当前余数`
                : computation?.hasFraction
                  ? '小数逐位长除法结果'
                  : '整数逐位长除法（返回余数）'
            }}
          </p>
          <StepPlaybackControls
            :current-step="currentStep"
            :step-count="stepCount"
            :can-start="canStart"
            :can-previous="canPrevious"
            :can-next="canNext"
            :computation="computation"
            @start="playback.start"
            @previous="playback.previous"
            @next="playback.next"
            @reset="playback.reset"
          />
          <GridPreview
            v-if="scene"
            :scene="scene"
            :font-family="rendererFont"
            mode="both"
            @font-change="handleFontChange"
          />
        </div>
      </section>
      <CodeImplementationPanel
        title="长除法过程与商"
        description="长除法显式区分除数和被除数，计算结果、宏源码与网格场景保持同一份输入设置。"
        :code="implementationCode"
      />
    </section>
  </div>
</template>
