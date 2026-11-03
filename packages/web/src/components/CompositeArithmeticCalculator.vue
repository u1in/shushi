<script setup lang="ts">
import { computed, ref } from 'vue'
import { computeCompositeArithmetic } from '@u1in/shushi-calculators'
import { compileCalculatorMacro, createCompositeArithmeticMacroSource, getCompositeArithmeticStepCount } from '@u1in/shushi-layout'
import type { CompositeArithmeticComputation } from '@u1in/shushi-calculators'
import type { GridScene } from '@u1in/shushi-grid'
import GridPreview from './GridPreview.vue'
import CopyMacroButton from './CopyMacroButton.vue'
import StepPlaybackControls from './StepPlaybackControls.vue'
import VisibleTextRowsPanel from './VisibleTextRowsPanel.vue'
import { useCalculatorStepPlayback } from '../composables/stepPlayback'

const expression = ref('125 + 75 - 20 × 3')
const showGuideGrid = ref(false)
const showCarrySteps = ref(true)
const showBorrowSteps = ref(true)
const error = ref('')
const computation = ref<CompositeArithmeticComputation>()
const scene = ref<GridScene>()
const macroSource = ref('')
const answer = computed(() => computation.value?.resultDigits ?? '—')

const renderScene = (): void => {
  if (!computation.value) return
  macroSource.value = createCompositeArithmeticMacroSource(computation.value, {
    cellWidth: 30,
    rowHeight: 46,
    fontSizeRatio: 1,
    showGuideGrid: showGuideGrid.value,
    showCarrySteps: showCarrySteps.value,
    showBorrowSteps: showBorrowSteps.value,
    uniformMultiplicationBars: false,
    visibleStepCount: visibleStepCount.value,
  })
  scene.value = compileCalculatorMacro(macroSource.value)
}

const playback = useCalculatorStepPlayback({
  getStepCount: () => computation.value ? getCompositeArithmeticStepCount(computation.value) : 0,
  render: renderScene,
})
const visibleStepCount = playback.visibleStepCount
const currentStep = playback.currentStep
const stepCount = playback.stepCount
const canStart = playback.canStart
const canPrevious = playback.canPrevious
const canNext = playback.canNext

const calculate = (): void => {
  try {
    computation.value = computeCompositeArithmetic(expression.value)
    visibleStepCount.value = undefined
    renderScene()
    error.value = ''
  } catch (reason) {
    computation.value = undefined
    scene.value = undefined
    macroSource.value = ''
    error.value = reason instanceof Error ? reason.message : '表达式无法计算，请检查输入。'
  }
}

calculate()
</script>

<template>
  <div class="operation-demo operation-demo--composite" data-operation="composite-arithmetic">
    <section class="workspace" aria-label="组合竖式工作区">
      <form class="control-panel" @submit.prevent="calculate">
        <p class="panel-kicker">COMPOSITE ARITHMETIC</p>
        <h2>组合竖式计算器</h2>
        <p class="normalization">按从左到右的书写顺序串联加、减、乘，所有步骤连续排入同一个竖式。</p>
        <div class="input-grid input-grid--single">
          <label class="field">
            <span>组合表达式</span>
            <input v-model="expression" autocomplete="off" spellcheck="false" aria-describedby="composite-expression-help" @input="calculate" />
          </label>
        </div>
        <p id="composite-expression-help" class="field-help">支持 <code>+</code>、<code>-</code>、<code>×</code>（也可输入 <code>*</code>）；不使用通常的乘法优先级。</p>
        <div class="form-actions">
          <button class="ghost-button" type="button" @click="expression = '125 + 75 - 20 × 3'; calculate()">试试 125 + 75 - 20 × 3</button>
        </div>
        <p class="error-message" role="alert">{{ error }}</p>
        <div class="settings-panel">
          <div class="settings-switch-group">
            <label class="switch-field"><input v-model="showGuideGrid" type="checkbox" @change="renderScene" /><span class="switch-ui" aria-hidden="true"></span><span>显示辅助网格</span></label>
            <label class="switch-field"><input v-model="showCarrySteps" type="checkbox" @change="renderScene" /><span class="switch-ui" aria-hidden="true"></span><span>显示加法/乘法进位</span></label>
            <label class="switch-field"><input v-model="showBorrowSteps" type="checkbox" @change="renderScene" /><span class="switch-ui" aria-hidden="true"></span><span>显示减法借位</span></label>
          </div>
        </div>
      </form>
      <section class="result-card" aria-live="polite">
        <div class="calculation-result">
          <div class="result-heading"><div><p class="panel-kicker">SINGLE VERTICAL EXPRESSION</p><h2>{{ expression }} =</h2></div><output class="answer">{{ answer }}</output><CopyMacroButton :source="macroSource" /></div>
          <p class="normalization">组合乘法固定关闭 10 倍数快捷计算，也不会为了排版调换上下操作数；每一步结果会紧接下一步继续计算。</p>
          <StepPlaybackControls
            :current-step="currentStep"
            :step-count="stepCount"
            :can-start="canStart"
            :can-previous="canPrevious"
            :can-next="canNext"
            @start="playback.start"
            @previous="playback.previous"
            @next="playback.next"
            @reset="playback.reset"
          />
          <GridPreview v-if="scene" :scene="scene" mode="both" />
        </div>
      </section>
      <VisibleTextRowsPanel v-if="scene" :scene="scene" />
    </section>
  </div>
</template>
