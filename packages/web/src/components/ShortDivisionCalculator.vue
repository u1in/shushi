<script setup lang="ts">
import { computed, ref } from 'vue'
import { computeShortDivision } from '@u1in/shushi-calculators'
import { compileCalculatorMacro, createShortDivisionMacroSource } from '@u1in/shushi-layout'
import GridPreview from './GridPreview.vue'
import GeneratedMacroSource from './GeneratedMacroSource.vue'
import VisibleTextRowsPanel from './VisibleTextRowsPanel.vue'
import type { ShortDivisionComputation, ShortDivisionMode } from '@u1in/shushi-calculators'
import type { GridScene } from '@u1in/shushi-grid'
import { useCalculatorStepPlayback } from '../composables/stepPlayback'
import StepPlaybackControls from './StepPlaybackControls.vue'

const mode = ref<ShortDivisionMode>('factorization')
const factorValue = ref('48')
const commonValues = ref('12, 18')
const conversionValue = ref('13')
const targetBase = ref(2)
const cellWidth = ref(30)
const rowHeight = ref(46)
const fontSizeRatio = ref(1)
const showGuideGrid = ref(false)
const showRemainders = ref(true)
const error = ref('')
const computation = ref<ShortDivisionComputation>()
const scene = ref<GridScene>()
const macroSource = ref('')

const renderScene = (): void => {
  if (!computation.value) return
  const settings = {
    cellWidth: cellWidth.value,
    rowHeight: rowHeight.value,
    fontSizeRatio: fontSizeRatio.value,
    showGuideGrid: showGuideGrid.value,
    showRemainders: showRemainders.value,
    visibleStepCount: visibleStepCount.value,
  }
  macroSource.value = createShortDivisionMacroSource(computation.value, settings)
  scene.value = compileCalculatorMacro(macroSource.value)
}
const playback = useCalculatorStepPlayback({ getStepCount: () => computation.value?.steps.length ?? 0, render: renderScene })
const visibleStepCount = playback.visibleStepCount
const currentStep = playback.currentStep
const stepCount = playback.stepCount
const canStart = playback.canStart
const canPrevious = playback.canPrevious
const canNext = playback.canNext

/** 将教学页面中的逗号或空格分隔输入转为计算器的多数字数组。 */
const splitValues = (value: string): string[] => value.split(/[,，\s]+/).filter(Boolean)

const answer = computed(() => {
  const result = computation.value
  if (!result) return '—'
  if (result.mode === 'factorization') return `${result.inputValues[0]} = ${result.factorizationText}`
  if (result.mode === 'commonFactor') return `GCD ${result.gcd} · LCM ${result.lcm}`
  return `${result.inputValues[0]}₁₀ = ${result.convertedText}₍${result.targetBase}₎`
})

const calculate = (): void => {
  try {
    const result = mode.value === 'factorization'
      ? computeShortDivision({ mode: 'factorization', values: [factorValue.value] })
      : mode.value === 'commonFactor'
        ? computeShortDivision({ mode: 'commonFactor', values: splitValues(commonValues.value) })
        : computeShortDivision({ mode: 'baseConversion', values: [conversionValue.value], targetBase: targetBase.value })
    computation.value = result
    visibleStepCount.value = undefined
    renderScene()
    error.value = ''
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '输入无法计算，请检查格式。'
  }
}

const chooseMode = (nextMode: ShortDivisionMode): void => {
  mode.value = nextMode
  calculate()
}

const applyExample = (): void => {
  if (mode.value === 'factorization') factorValue.value = '48'
  if (mode.value === 'commonFactor') commonValues.value = '12, 18'
  if (mode.value === 'baseConversion') {
    conversionValue.value = targetBase.value === 8 ? '100' : '13'
  }
  calculate()
}

calculate()
</script>

<template>
  <div class="operation-demo operation-demo--short-division" data-operation="short-division">
    <p class="naming-map-link"><RouterLink to="/short-division-elements">查看短除法竖式物件命名图谱 →</RouterLink></p>
    <section class="workspace" aria-label="短除法工作区">
      <form class="control-panel" @submit.prevent="calculate">
        <fieldset class="short-division-mode-group" aria-label="短除法用途">
          <label class="mode-option"><input :checked="mode === 'factorization'" type="radio" value="factorization" @change="chooseMode('factorization')" /><span>分解质因数</span></label>
          <label class="mode-option"><input :checked="mode === 'commonFactor'" type="radio" value="commonFactor" @change="chooseMode('commonFactor')" /><span>GCD / LCM</span></label>
          <label class="mode-option"><input :checked="mode === 'baseConversion'" type="radio" value="baseConversion" @change="chooseMode('baseConversion')" /><span>进制转换</span></label>
        </fieldset>
        <div v-if="mode === 'factorization'" class="input-grid input-grid--single">
          <label class="field"><span>待分解的正整数</span><input v-model="factorValue" inputmode="numeric" autocomplete="off" @input="calculate" /></label>
        </div>
        <div v-else-if="mode === 'commonFactor'" class="input-grid input-grid--single">
          <label class="field"><span>正整数（以逗号或空格分隔）</span><input v-model="commonValues" autocomplete="off" @input="calculate" /></label>
        </div>
        <div v-else class="input-grid">
          <label class="field"><span>十进制数</span><input v-model="conversionValue" inputmode="numeric" autocomplete="off" @input="calculate" /></label>
          <span class="division-operator" aria-hidden="true">→</span>
          <label class="field"><span>目标进制（2–36）</span><input v-model.number="targetBase" inputmode="numeric" min="2" max="36" type="number" @input="calculate" /></label>
        </div>
        <div class="form-actions">
          <button class="ghost-button" type="button" @click="applyExample">{{ mode === 'factorization' ? '试试分解 48' : mode === 'commonFactor' ? '试试 12 和 18' : '试试 13 转二进制' }}</button>
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
              <label v-if="mode === 'baseConversion'" class="switch-field"><input v-model="showRemainders" type="checkbox" @change="calculate" /><span class="switch-ui" aria-hidden="true"></span><span>显示每步余数</span></label>
            </div>
          </div>
        </div>
      </form>
      <section class="result-card" aria-live="polite">
        <div class="calculation-result">
          <div class="result-heading"><div><p class="panel-kicker">SHORT DIVISION</p><h2>{{ mode === 'factorization' ? '质因数分解' : mode === 'commonFactor' ? '最大公约数 / 最小公倍数' : '十进制转其他进制' }}</h2></div><output class="answer answer--short-division">{{ answer }}</output></div>
          <p class="normalization">{{ computation?.mode === 'factorization' ? `约数个数：${computation.divisorCount}；约数和：${computation.divisorSum}` : computation?.mode === 'commonFactor' ? '左侧公共质因数的乘积为 GCD；再乘底行所有商为 LCM。' : '余数从下往上读；每一步使用整数商。' }}</p>
          <StepPlaybackControls :current-step="currentStep" :step-count="stepCount" :can-start="canStart" :can-previous="canPrevious" :can-next="canNext" @start="playback.start" @previous="playback.previous" @next="playback.next" @reset="playback.reset" />
          <GridPreview v-if="scene" :scene="scene" mode="both" />
          <GeneratedMacroSource :source="macroSource" />
        </div>
      </section>
      <VisibleTextRowsPanel v-if="scene" :scene="scene" />
    </section>
  </div>
</template>
