<script setup lang="ts">
import { computed, ref } from 'vue'
import { shushi, getMultiplicationStepCount } from '@u1in/shushi-core'
import GridPreview from './GridPreview.vue'
import VisibleTextRowsPanel from './VisibleTextRowsPanel.vue'
import CopyMacroButton from './CopyMacroButton.vue'
import CodeImplementationPanel from './CodeImplementationPanel.vue'
import { createShushiImplementationSnippet } from './implementationSnippets'
import type { GridScene, MultiplicationComputation } from '@u1in/shushi-core'
import { useCalculatorStepPlayback } from '../composables/stepPlayback'
import StepPlaybackControls from './StepPlaybackControls.vue'

const multiplicand = ref('97')
const multiplier = ref('89')
const cellWidth = ref(30)
const rowHeight = ref(46)
const fontSizeRatio = ref(1)
const showGuideGrid = ref(false)
const uniformMultiplicationBars = ref(false)
const showCarrySteps = ref(true)
const useTrailingZeroShortcut = ref(true)
const error = ref('')
const computation = ref<MultiplicationComputation>()
const scene = ref<GridScene>()
const macroSource = ref('')
const answer = computed(() => computation.value?.productDigits ?? '—')

const renderScene = (): void => {
  const result = shushi({
    operation: 'multiplication',
    operands: [multiplicand.value, multiplier.value],
    calculation: { useTrailingZeroShortcut: useTrailingZeroShortcut.value },
    settings: {
      cellWidth: cellWidth.value,
      rowHeight: rowHeight.value,
      fontSizeRatio: fontSizeRatio.value,
      showGuideGrid: showGuideGrid.value,
      uniformMultiplicationBars: uniformMultiplicationBars.value,
      showCarrySteps: showCarrySteps.value,
      visibleStepCount: visibleStepCount.value,
    },
  })
  computation.value = result.computation
  macroSource.value = result.source
  scene.value = result.scene
}
const playback = useCalculatorStepPlayback({
  getStepCount: () => {
    const result = computation.value
    if (!result) return 0
    // 播放步骤由布局层统一计算，快捷计算不会跳过基础按列求和。
    return getMultiplicationStepCount(result)
  },
  render: renderScene,
})
const visibleStepCount = playback.visibleStepCount
const currentStep = playback.currentStep
const stepCount = playback.stepCount
const canStart = playback.canStart
const canPrevious = playback.canPrevious
const canNext = playback.canNext
const implementationCode = computed(() => createShushiImplementationSnippet({
  operation: 'multiplication',
  fields: [['operands', [multiplicand.value, multiplier.value]]],
  calculation: [['useTrailingZeroShortcut', useTrailingZeroShortcut.value]],
  settings: [
    ['cellWidth', cellWidth.value],
    ['rowHeight', rowHeight.value],
    ['fontSizeRatio', fontSizeRatio.value],
    ['showGuideGrid', showGuideGrid.value],
    ['uniformMultiplicationBars', uniformMultiplicationBars.value],
    ['showCarrySteps', showCarrySteps.value],
    ['visibleStepCount', visibleStepCount.value],
  ],
}))

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
  <div class="operation-demo operation-demo--multiplication" data-operation="multiplication">
    <section class="workspace" aria-label="乘法竖式工作区">
      <form class="control-panel" @submit.prevent="calculate">
        <p class="panel-kicker">MULTIPLICATION CALCULATOR</p>
        <h2>乘法竖式计算器</h2>
        <p class="normalization">输入两个乘数，查看部分积、进位与最终结果。</p>
        <div class="input-grid">
          <label class="field"><span>第一个乘数</span><input v-model="multiplicand" inputmode="numeric" autocomplete="off" @input="calculate" /></label>
          <span class="division-operator" aria-hidden="true">×</span>
          <label class="field"><span>第二个乘数</span><input v-model="multiplier" inputmode="numeric" autocomplete="off" @input="calculate" /></label>
        </div>
        <div class="form-actions">
          <button class="ghost-button" type="button" @click="multiplicand = '97'; multiplier = '89'; calculate()">试试 97 × 89</button>
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
              <label class="switch-field"><input v-model="uniformMultiplicationBars" type="checkbox" @change="calculate" /><span class="switch-ui" aria-hidden="true"></span><span>乘法横线等宽</span></label>
              <label class="switch-field"><input v-model="showCarrySteps" type="checkbox" @change="calculate" /><span class="switch-ui" aria-hidden="true"></span><span>显示进位步骤</span></label>
              <label class="switch-field"><input v-model="useTrailingZeroShortcut" type="checkbox" @change="calculate" /><span class="switch-ui" aria-hidden="true"></span><span>启用 10 倍数快捷计算</span></label>
            </div>
          </div>
        </div>
      </form>
      <section class="result-card" aria-live="polite">
        <div class="calculation-result">
          <div class="result-heading"><div><p class="panel-kicker">CALCULATION</p><h2>{{ multiplicand }} × {{ multiplier }} =</h2></div><output class="answer">{{ answer }}</output><CopyMacroButton :source="macroSource" /><VisibleTextRowsPanel v-if="scene" :scene="scene" /></div>
          <p class="normalization">{{ computation?.trailingZeroShortcut ? `已将 ${computation.multiplierDigits} 作为第二行乘数，先计算 ${computation.trailingZeroShortcut.significantMultiplierDigits} 再补 ${computation.trailingZeroShortcut.trailingZeroCount} 个 0。` : computation?.operandsSwapped ? '为便于竖式展示，较大操作数已置于上方。' : '按从右到左的逐位乘法计算。' }}</p>
          <StepPlaybackControls :current-step="currentStep" :step-count="stepCount" :can-start="canStart" :can-previous="canPrevious" :can-next="canNext" @start="playback.start" @previous="playback.previous" @next="playback.next" @reset="playback.reset" />
          <GridPreview v-if="scene" :scene="scene" mode="both" />
        </div>
      </section>
      <CodeImplementationPanel
        title="乘法计算与部分积"
        description="计算选项控制快捷计算和过程展示，返回结果后统一交给布局与渲染链路。"
        :code="implementationCode"
      />
    </section>
  </div>
</template>
