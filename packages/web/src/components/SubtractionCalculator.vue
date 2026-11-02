<script setup lang="ts">
import { computed, ref } from 'vue'
import { computeSubtraction } from '@u1in/shushi-calculators'
import { compileCalculatorMacro, createSubtractionMacroSource } from '@u1in/shushi-layout'
import GridPreview from './GridPreview.vue'
import GeneratedMacroSource from './GeneratedMacroSource.vue'
import VisibleTextRowsPanel from './VisibleTextRowsPanel.vue'
import type { SubtractionComputation } from '@u1in/shushi-calculators'
import type { GridScene } from '@u1in/shushi-grid'
import { useCalculatorStepPlayback } from '../composables/stepPlayback'
import StepPlaybackControls from './StepPlaybackControls.vue'

const minuend = ref('502')
const subtrahend = ref('137')
const cellWidth = ref(30)
const rowHeight = ref(46)
const fontSizeRatio = ref(1)
const showGuideGrid = ref(false)
const showBorrowSteps = ref(true)
const error = ref('')
const computation = ref<SubtractionComputation>()
const scene = ref<GridScene>()
const macroSource = ref('')
const answer = computed(() => computation.value?.resultText ?? '—')

const renderScene = (): void => {
  if (!computation.value) return
  const settings = {
    cellWidth: cellWidth.value, rowHeight: rowHeight.value, fontSizeRatio: fontSizeRatio.value,
    showGuideGrid: showGuideGrid.value, showBorrowSteps: showBorrowSteps.value,
    visibleStepCount: visibleStepCount.value,
  }
  macroSource.value = createSubtractionMacroSource(computation.value, settings)
  scene.value = compileCalculatorMacro(macroSource.value)
}
const playback = useCalculatorStepPlayback({ getStepCount: () => computation.value?.steps.length ?? 0, render: renderScene })
const visibleStepCount = playback.visibleStepCount
const currentStep = playback.currentStep
const stepCount = playback.stepCount
const canStart = playback.canStart
const canPrevious = playback.canPrevious
const canNext = playback.canNext

const calculate = (): void => {
  try {
    const result = computeSubtraction(minuend.value, subtrahend.value)
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
  <div class="operation-demo operation-demo--subtraction" data-operation="subtraction">
    <p class="naming-map-link"><RouterLink to="/subtraction-elements">查看减法竖式物件命名图谱 →</RouterLink></p>
    <section class="workspace" aria-label="减法竖式工作区">
      <form class="control-panel" @submit.prevent="calculate">
        <div class="input-grid">
          <label class="field"><span>被减数</span><input v-model="minuend" inputmode="numeric" autocomplete="off" @input="calculate" /></label>
          <span class="division-operator" aria-hidden="true">−</span>
          <label class="field"><span>减数</span><input v-model="subtrahend" inputmode="numeric" autocomplete="off" @input="calculate" /></label>
        </div>
        <div class="form-actions">
          <button class="ghost-button" type="button" @click="minuend = '502'; subtrahend = '137'; calculate()">试试 502 − 137</button>
        </div>
        <p class="error-message" role="alert">{{ error }}</p>
        <div class="settings-panel"><div class="settings-controls">
          <div class="settings-range-group">
            <label class="range-field"><span>方格宽度 <output>{{ cellWidth }}px</output></span><input v-model.number="cellWidth" type="range" min="28" max="56" @input="calculate" /></label>
            <label class="range-field"><span>行高 <output>{{ rowHeight }}px</output></span><input v-model.number="rowHeight" type="range" min="36" max="64" @input="calculate" /></label>
            <label class="range-field"><span>字号比例 <output>{{ fontSizeRatio.toFixed(2) }}</output></span><input v-model.number="fontSizeRatio" type="range" min="0.5" max="1.5" step="0.01" @input="calculate" /></label>
          </div>
          <div class="settings-switch-group">
            <label class="switch-field"><input v-model="showGuideGrid" type="checkbox" @change="calculate" /><span class="switch-ui" aria-hidden="true"></span><span>显示辅助网格</span></label>
            <label class="switch-field"><input v-model="showBorrowSteps" type="checkbox" @change="calculate" /><span class="switch-ui" aria-hidden="true"></span><span>显示借位步骤</span></label>
          </div>
        </div></div>
      </form>
      <section class="result-card" aria-live="polite"><div class="calculation-result">
        <div class="result-heading"><div><p class="panel-kicker">CALCULATION</p><h2>{{ minuend }} − {{ subtrahend }} =</h2></div><output class="answer">{{ answer }}</output></div>
        <p class="normalization">从个位开始相减；不够减时向高位借 1，当作 10 再减。</p>
        <p v-if="computation?.isNegative" class="normalization">原式结果为负数，竖式展示其绝对值的“大数减小数”借位过程。</p>
        <StepPlaybackControls :current-step="currentStep" :step-count="stepCount" :can-start="canStart" :can-previous="canPrevious" :can-next="canNext" @start="playback.start" @previous="playback.previous" @next="playback.next" @reset="playback.reset" />
        <GridPreview v-if="scene" :scene="scene" mode="both" />
        <GeneratedMacroSource :source="macroSource" />
      </div></section>
      <VisibleTextRowsPanel v-if="scene" :scene="scene" />
    </section>
  </div>
</template>
