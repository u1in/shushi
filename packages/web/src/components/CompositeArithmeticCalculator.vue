<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  getCompositeArithmeticStepCount,
  getDivisionPlaybackStepCount,
  getMultiplicationStepCount,
  shushi,
} from '@u1in/shushi-core'
import type { AnyVerticalArithmeticResult, GridScene } from '@u1in/shushi-core'
import GridPreview from './GridPreview.vue'
import CopyMacroButton from './CopyMacroButton.vue'
import StepPlaybackControls from './StepPlaybackControls.vue'
import VisibleTextRowsPanel from './VisibleTextRowsPanel.vue'
import CodeImplementationPanel from './CodeImplementationPanel.vue'
import { createShushiImplementationSnippet } from './implementationSnippets'
import { useCalculatorStepPlayback } from '../composables/stepPlayback'

const expression = ref('125 + 75 - 20 × 3')
const showGuideGrid = ref(false)
const showCarrySteps = ref(true)
const showBorrowSteps = ref(false)
const showRemainders = ref(true)
const showZeroQuotientSteps = ref(false)
const error = ref('')
const result = ref<AnyVerticalArithmeticResult>()
const scene = ref<GridScene>()
const macroSource = ref('')

/** 统一展示 shushi 门户返回的各类运算结果，不让页面依赖某一种 computation 结构。 */
const answer = computed(() => {
  const computation = result.value?.computation
  if (!computation) return '—'
  if ('resultDigits' in computation) return computation.resultDigits
  if ('sumDigits' in computation) return computation.sumDigits
  if ('differenceDigits' in computation) return computation.isNegative ? `-${computation.differenceDigits}` : computation.differenceDigits
  if ('productDigits' in computation) return computation.productDigits
  if ('quotientText' in computation) return computation.remainder === '0' ? computation.quotientText : `${computation.quotientText} …… ${computation.remainder}`
  if (computation.mode === 'division') return `${computation.quotient} … ${computation.remainder}`
  if (computation.mode === 'factorization') return computation.factorizationText
  if (computation.mode === 'commonFactor') return `GCD ${computation.gcd} · LCM ${computation.lcm}`
  return computation.convertedText
})

/** 各专项布局器的播放事件数量不同，这里按门户返回的 computation 自动选择对应计数器。 */
const getPlaybackStepCount = (currentResult: AnyVerticalArithmeticResult | undefined): number => {
  const computation = currentResult?.computation
  if (!computation) return 0
  if ('initialValueDigits' in computation) return getCompositeArithmeticStepCount(computation)
  if ('quotientText' in computation) return getDivisionPlaybackStepCount(computation, showZeroQuotientSteps.value)
  if ('partialProducts' in computation) return getMultiplicationStepCount(computation)
  return computation.steps.length
}

const renderScene = (shouldRenderWithoutComputation = false): void => {
  if (!shouldRenderWithoutComputation && !result.value) return
  const nextResult = shushi(expression.value, {
    calculation: {
      resultMode: 'decimal',
      useTrailingZeroShortcut: false,
      preserveOperandOrder: true,
    },
    settings: {
      cellWidth: 30,
      rowHeight: 46,
      fontSizeRatio: 1,
      showGuideGrid: showGuideGrid.value,
      showCarrySteps: showCarrySteps.value,
      showBorrowSteps: showBorrowSteps.value,
      showRemainders: showRemainders.value,
      showZeroQuotientSteps: showZeroQuotientSteps.value,
      uniformMultiplicationBars: false,
      visibleStepCount: visibleStepCount.value,
    },
  })
  result.value = nextResult
  macroSource.value = nextResult.source
  scene.value = nextResult.scene
}

const playback = useCalculatorStepPlayback({
  getStepCount: () => getPlaybackStepCount(result.value),
  render: renderScene,
})
const visibleStepCount = playback.visibleStepCount
const currentStep = playback.currentStep
const stepCount = playback.stepCount
const canStart = playback.canStart
const canPrevious = playback.canPrevious
const canNext = playback.canNext
const implementationCode = computed(() => createShushiImplementationSnippet({
  operation: 'expression',
  fields: [['expression', expression.value]],
  settings: [
    ['cellWidth', 30],
    ['rowHeight', 46],
    ['fontSizeRatio', 1],
    ['showGuideGrid', showGuideGrid.value],
    ['showCarrySteps', showCarrySteps.value],
    ['showBorrowSteps', showBorrowSteps.value],
    ['showRemainders', showRemainders.value],
    ['showZeroQuotientSteps', showZeroQuotientSteps.value],
    ['uniformMultiplicationBars', false],
    ['visibleStepCount', visibleStepCount.value],
  ],
}))

const calculate = (): void => {
  if (!expression.value.trim()) {
    visibleStepCount.value = undefined
    result.value = undefined
    scene.value = undefined
    macroSource.value = ''
    error.value = ''
    return
  }
  try {
    visibleStepCount.value = undefined
    renderScene(true)
    error.value = ''
  } catch (reason) {
    result.value = undefined
    scene.value = undefined
    macroSource.value = ''
    error.value = reason instanceof Error ? reason.message : '表达式无法计算，请检查输入。'
  }
}

calculate()
</script>

<template>
  <div class="operation-demo operation-demo--composite" data-operation="composite-arithmetic">
    <section class="workspace" aria-label="表达式输入工作区">
      <form class="control-panel" @submit.prevent="calculate">
        <p class="panel-kicker">TRY IT YOURSELF</p>
        <h2>表达式输入</h2>
        <p class="normalization">输入算式，马上生成竖式和完整的计算步骤。</p>
        <div class="input-grid input-grid--single expression-input-grid">
          <label class="field">
            <span>表达式</span>
            <input v-model="expression" autocomplete="off" spellcheck="false" aria-describedby="composite-expression-help" @input="calculate" />
          </label>
        </div>
        <p class="error-message" role="alert">{{ error }}</p>
        <p id="composite-expression-help" class="field-help expression-rules">
          <span>支持连续 <code>+</code>、<code>-</code>、<code>×</code>（也可输入 <code>*</code> 或 <code>x</code>）。</span>
          <span>长除法用 <code>10230 ÷ 25</code> 或 <code>10230 / 25</code>。</span>
          <span>指定除数的短除法：<code>2|12</code>。</span>
          <span>分解质因数：<code>|48</code>。</span>
          <span>求最大公约数和最小公倍数：<code>2|12 18</code>。</span>
          <span>进制转换：<code>(13)2</code>，表示把十进制 13 转为二进制。</span>
        </p>
        <div class="form-actions">
          <button class="ghost-button" type="button" @click="expression = '125 + 75 - 20 × 3'; calculate()">试试 125 + 75 - 20 × 3</button>
        </div>
        <div class="settings-panel">
          <div class="settings-switch-group">
            <label class="switch-field"><input v-model="showGuideGrid" type="checkbox" @change="renderScene()" /><span class="switch-ui" aria-hidden="true"></span><span>显示辅助网格</span></label>
            <label class="switch-field"><input v-model="showCarrySteps" type="checkbox" @change="renderScene()" /><span class="switch-ui" aria-hidden="true"></span><span>显示加法/乘法进位</span></label>
            <label class="switch-field"><input v-model="showBorrowSteps" type="checkbox" @change="renderScene()" /><span class="switch-ui" aria-hidden="true"></span><span>显示减法借位</span></label>
            <label class="switch-field"><input v-model="showRemainders" type="checkbox" @change="renderScene()" /><span class="switch-ui" aria-hidden="true"></span><span>显示短除法余数</span></label>
            <label class="switch-field"><input v-model="showZeroQuotientSteps" type="checkbox" @change="renderScene()" /><span class="switch-ui" aria-hidden="true"></span><span>显示除法零商步骤</span></label>
          </div>
        </div>
      </form>
      <section class="result-card" aria-live="polite">
        <div class="calculation-result">
          <div class="result-heading"><div><p class="panel-kicker">VERTICAL PREVIEW</p><h2>{{ expression.trim() ? `${expression} =` : '等待输入表达式' }}</h2></div><template v-if="scene"><output class="answer">{{ answer }}</output><CopyMacroButton :source="macroSource" /><VisibleTextRowsPanel :scene="scene" /></template></div>
          <p class="normalization">{{ scene ? '每一步都会清楚展示；加减乘可以连续计算，除法和短除法也会自动排成对应的竖式。' : '在左侧输入算式，这里会显示对应的竖式。' }}</p>
          <StepPlaybackControls
            v-if="scene"
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
          <div v-else class="renderer-comparison renderer-comparison--both renderer-comparison--empty" role="status" aria-live="polite">
            <p><strong>暂无表达式</strong><span>请在左侧输入算式开始计算</span></p>
          </div>
        </div>
      </section>
      <CodeImplementationPanel
        title="看看它是怎么工作的"
        description="输入算式后，系统会自动生成竖式，你可以按步骤查看完整的计算过程。"
        :code="implementationCode"
      />
    </section>
  </div>
</template>
