<script setup lang="ts">
import { computed, ref } from 'vue'
import { shushi } from '@u1in/shushi-core'
import GridPreview from './GridPreview.vue'
import VisibleTextRowsPanel from './VisibleTextRowsPanel.vue'
import CopyMacroButton from './CopyMacroButton.vue'
import CodeImplementationPanel from './CodeImplementationPanel.vue'
import { createShushiImplementationSnippet } from './implementationSnippets'
import type { GridScene, SubtractionComputation, SubtractionVerticalArithmeticResult } from '@u1in/shushi-core'
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
  const result = shushi(`${minuend.value} - ${subtrahend.value}`, {
    settings: {
      cellWidth: cellWidth.value, rowHeight: rowHeight.value, fontSizeRatio: fontSizeRatio.value,
      showGuideGrid: showGuideGrid.value, showBorrowSteps: showBorrowSteps.value,
      visibleStepCount: visibleStepCount.value,
    },
  }) as SubtractionVerticalArithmeticResult
  computation.value = result.computation
  macroSource.value = result.source
  scene.value = result.scene
}
const playback = useCalculatorStepPlayback({ getStepCount: () => computation.value?.steps.length ?? 0, render: renderScene })
const visibleStepCount = playback.visibleStepCount
const currentStep = playback.currentStep
const stepCount = playback.stepCount
const canStart = playback.canStart
const canPrevious = playback.canPrevious
const canNext = playback.canNext
const implementationCode = computed(() => createShushiImplementationSnippet({
  operation: 'subtraction',
  fields: [['operands', [minuend.value, subtrahend.value]]],
  settings: [
    ['cellWidth', cellWidth.value],
    ['rowHeight', rowHeight.value],
    ['fontSizeRatio', fontSizeRatio.value],
    ['showGuideGrid', showGuideGrid.value],
    ['showBorrowSteps', showBorrowSteps.value],
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
  <div class="operation-demo operation-demo--subtraction" data-operation="subtraction">
    <section class="workspace" aria-label="减法竖式工作区">
      <form class="control-panel" @submit.prevent="calculate">
        <p class="panel-kicker">SUBTRACTION CALCULATOR</p>
        <h2>减法竖式计算器</h2>
        <p class="normalization">输入被减数和减数，逐位查看相减与借位过程。</p>
        <div class="input-grid">
          <label class="field"><span>被减数</span><input v-model="minuend" inputmode="numeric" autocomplete="off" @input="calculate" /></label>
          <span class="division-operator" aria-hidden="true">−</span>
          <label class="field"><span>减数</span><input v-model="subtrahend" inputmode="numeric" autocomplete="off" @input="calculate" /></label>
        </div>
        <p class="error-message" role="alert">{{ error }}</p>
        <div class="form-actions">
          <button class="ghost-button" type="button" @click="minuend = '502'; subtrahend = '137'; calculate()">试试 502 − 137</button>
        </div>
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
        <div class="result-heading"><div><p class="panel-kicker">CALCULATION</p><h2>{{ minuend }} − {{ subtrahend }} =</h2></div><output class="answer">{{ answer }}</output><CopyMacroButton :source="macroSource" /><VisibleTextRowsPanel v-if="scene" :scene="scene" /></div>
        <p class="normalization">从个位开始相减；不够减时向高位借 1，当作 10 再减。</p>
        <p v-if="computation?.isNegative" class="normalization">原式结果为负数，竖式展示其绝对值的“大数减小数”借位过程。</p>
        <StepPlaybackControls :current-step="currentStep" :step-count="stepCount" :can-start="canStart" :can-previous="canPrevious" :can-next="canNext" @start="playback.start" @previous="playback.previous" @next="playback.next" @reset="playback.reset" />
        <GridPreview v-if="scene" :scene="scene" mode="both" />
      </div></section>
      <CodeImplementationPanel
        title="减法计算与借位过程"
        description="通过 settings 控制借位提示和播放步骤，计算层仍只负责过程数据，布局层负责场景。"
        :code="implementationCode"
      />
    </section>
  </div>
</template>
