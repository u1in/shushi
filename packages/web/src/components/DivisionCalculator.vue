<script setup lang="ts">
import { computed, ref } from 'vue'
import { computeDivision } from '@u1in/shushi-calculators'
import { compileCalculatorMacro, createDivisionMacroSource, getDivisionPlaybackStepCount } from '@u1in/shushi-layout'
import GridPreview from './GridPreview.vue'
import GeneratedMacroSource from './GeneratedMacroSource.vue'
import VisibleTextRowsPanel from './VisibleTextRowsPanel.vue'
import type { DivisionComputation } from '@u1in/shushi-calculators'
import type { GridScene } from '@u1in/shushi-grid'
import { useCalculatorStepPlayback } from '../composables/stepPlayback'
import StepPlaybackControls from './StepPlaybackControls.vue'

const dividend = ref('10230')
const divisor = ref('25')
const resultMode = ref<'decimal' | 'remainder'>('decimal')
const cellWidth = ref(30)
const rowHeight = ref(46)
const fontSizeRatio = ref(1)
const showGuideGrid = ref(false)
const uniformSubtractionBars = ref(false)
const showZeroQuotientSteps = ref(false)
const error = ref('')
const computation = ref<DivisionComputation>()
const scene = ref<GridScene>()
const macroSource = ref('')

const renderScene = (): void => {
  if (!computation.value) return
  const settings = {
    cellWidth: cellWidth.value,
    rowHeight: rowHeight.value,
    fontSizeRatio: fontSizeRatio.value,
    bracketBend: 1,
    showGuideGrid: showGuideGrid.value,
    uniformSubtractionBars: uniformSubtractionBars.value,
    showZeroQuotientSteps: showZeroQuotientSteps.value,
    visibleStepCount: visibleStepCount.value,
  }
  macroSource.value = createDivisionMacroSource(computation.value, settings)
  scene.value = compileCalculatorMacro(macroSource.value)
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

const answer = computed(() => computation.value
  ? computation.value.remainder === '0' ? computation.value.quotientText : `${computation.value.quotientText} …… ${computation.value.remainder}`
  : '—')

const calculate = (): void => {
  try {
    const result = computeDivision(divisor.value, dividend.value, { resultMode: resultMode.value })
    computation.value = result
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
    <p class="naming-map-link"><RouterLink to="/division-elements">查看除法竖式物件命名图谱 →</RouterLink></p>
    <section class="workspace" aria-label="除法竖式工作区">
      <form class="control-panel" @submit.prevent="calculate">
        <div class="input-grid">
          <label class="field"><span>被除数</span><input v-model="dividend" inputmode="numeric" autocomplete="off" @input="calculate" /></label>
          <span class="division-operator" aria-hidden="true">÷</span>
          <label class="field"><span>除数</span><input v-model="divisor" inputmode="numeric" autocomplete="off" @input="calculate" /></label>
        </div>
        <div class="form-actions">
          <button class="ghost-button" type="button" @click="dividend = '10230'; divisor = '25'; calculate()">试试 10230 ÷ 25</button>
          <fieldset class="result-mode-group" aria-label="结果模式">
            <label class="mode-option"><input v-model="resultMode" type="radio" value="decimal" @change="calculate" /><span>小数模式</span></label>
            <label class="mode-option"><input v-model="resultMode" type="radio" value="remainder" @change="calculate" /><span>余数模式</span></label>
          </fieldset>
        </div>
        <p class="error-message" role="alert">{{ error }}</p>
        <div class="settings-panel">
          <div class="settings-controls">
            <div class="settings-range-group">
              <label class="range-field"><span>方格宽度 <output>{{ cellWidth }}px</output></span><input v-model.number="cellWidth" type="range" min="28" max="56" @input="calculate" /></label>
              <label class="range-field"><span>行高 <output>{{ rowHeight }}px</output></span><input v-model.number="rowHeight" type="range" min="36" max="64" @input="calculate" /></label>
              <label class="range-field"><span>字号比例 <output>{{ fontSizeRatio.toFixed(2) }}</output></span><input v-model.number="fontSizeRatio" type="range" min="0.5" max="1.5" step="0.01" @input="calculate" /></label>
            </div>
            <div class="settings-switch-group">
              <label class="switch-field"><input v-model="showGuideGrid" type="checkbox" @change="calculate" /><span class="switch-ui" aria-hidden="true"></span><span>显示辅助网格</span></label>
              <label class="switch-field"><input v-model="uniformSubtractionBars" type="checkbox" @change="calculate" /><span class="switch-ui" aria-hidden="true"></span><span>减法横线等宽</span></label>
              <label class="switch-field"><input v-model="showZeroQuotientSteps" type="checkbox" @change="calculate" /><span class="switch-ui" aria-hidden="true"></span><span>显示试商为 0 的步骤</span></label>
            </div>
          </div>
        </div>
      </form>
      <section class="result-card" aria-live="polite">
        <div class="calculation-result">
          <div class="result-heading"><div><p class="panel-kicker">CALCULATION</p><h2>{{ dividend }} ÷ {{ divisor }} =</h2></div><output class="answer">{{ answer }}</output></div>
          <p class="normalization">{{ computation?.hasFraction ? '小数模式：逐位长除法结果' : '整数逐位长除法' }}</p>
          <StepPlaybackControls :current-step="currentStep" :step-count="stepCount" :can-start="canStart" :can-previous="canPrevious" :can-next="canNext" @start="playback.start" @previous="playback.previous" @next="playback.next" @reset="playback.reset" />
          <GridPreview v-if="scene" :scene="scene" mode="both" />
          <GeneratedMacroSource :source="macroSource" />
        </div>
      </section>
      <VisibleTextRowsPanel v-if="scene" :scene="scene" />
    </section>
  </div>
</template>
