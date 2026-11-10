<script setup lang="ts">
import { computed, ref } from 'vue'
import { shushi } from '@u1in/shushi-core'
import GridPreview from './GridPreview.vue'
import VisibleTextRowsPanel from './VisibleTextRowsPanel.vue'
import CopyMacroButton from './CopyMacroButton.vue'
import CodeImplementationPanel from './CodeImplementationPanel.vue'
import { createShushiImplementationSnippet } from './implementationSnippets'
import { DEFAULT_RENDERER_FONT, type RendererFontFamily } from './rendererFonts'
import type {
  GridScene,
  ShortDivisionComputation,
  ShortDivisionMode,
  ShortDivisionVerticalArithmeticResult,
} from '@u1in/shushi-core'
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
const rendererFont = ref<RendererFontFamily>(DEFAULT_RENDERER_FONT)
const showGuideGrid = ref(false)
const showRemainders = ref(true)
const error = ref('')
const computation = ref<ShortDivisionComputation>()
const scene = ref<GridScene>()
const macroSource = ref('')

/** 三个教学模式各自映射到可读的表达式语法，再统一交给 shushi 解析。 */
const createShortDivisionExpression = (): string => {
  if (mode.value === 'factorization') return `|${factorValue.value}`
  if (mode.value === 'commonFactor') return `|${splitValues(commonValues.value).join(' ')}`
  return `(${conversionValue.value})${targetBase.value}`
}

const renderScene = (): void => {
  const result = shushi(createShortDivisionExpression(), {
    fontFamily: rendererFont.value,
    settings: {
      cellWidth: cellWidth.value,
      rowHeight: rowHeight.value,
      fontSizeRatio: fontSizeRatio.value,
      showGuideGrid: showGuideGrid.value,
      showRemainders: showRemainders.value,
      visibleStepCount: visibleStepCount.value,
    },
  }) as ShortDivisionVerticalArithmeticResult
  computation.value = result.computation
  macroSource.value = result.source
  scene.value = result.scene
}
const handleFontChange = (fontFamily: RendererFontFamily): void => {
  rendererFont.value = fontFamily
  renderScene()
}
const playback = useCalculatorStepPlayback({
  getStepCount: () => computation.value?.steps.length ?? 0,
  render: renderScene,
})
const visibleStepCount = playback.visibleStepCount
const currentStep = playback.currentStep
const stepCount = playback.stepCount
const canStart = playback.canStart
const canPrevious = playback.canPrevious
const canNext = playback.canNext

/** 将教学页面中的逗号或空格分隔输入转为计算器的多数字数组。 */
const splitValues = (value: string): string[] => value.split(/[,，\s]+/).filter(Boolean)

const implementationCode = computed(() =>
  createShushiImplementationSnippet({
    operation: 'shortDivision',
    fontFamily: rendererFont.value,
    fields: [
      ['mode', mode.value],
      [
        'values',
        mode.value === 'factorization'
          ? [factorValue.value]
          : mode.value === 'commonFactor'
            ? splitValues(commonValues.value)
            : [conversionValue.value],
      ],
      ['targetBase', mode.value === 'baseConversion' ? targetBase.value : undefined],
    ],
    settings: [
      ['cellWidth', cellWidth.value],
      ['rowHeight', rowHeight.value],
      ['fontSizeRatio', fontSizeRatio.value],
      ['showGuideGrid', showGuideGrid.value],
      ['showRemainders', showRemainders.value],
      ['visibleStepCount', visibleStepCount.value],
    ],
  }),
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
    <section class="workspace" aria-label="短除法工作区">
      <form class="control-panel" @submit.prevent="calculate">
        <p class="panel-kicker">SHORT DIVISION CALCULATOR</p>
        <h2>短除法计算器</h2>
        <p class="normalization">支持质因数分解、公因数与进制转换的逐步演示。</p>
        <fieldset class="short-division-mode-group" aria-label="短除法用途">
          <label class="mode-option"
            ><input
              :checked="mode === 'factorization'"
              type="radio"
              value="factorization"
              @change="chooseMode('factorization')"
            /><span>分解质因数</span></label
          >
          <label class="mode-option"
            ><input
              :checked="mode === 'commonFactor'"
              type="radio"
              value="commonFactor"
              @change="chooseMode('commonFactor')"
            /><span>GCD / LCM</span></label
          >
          <label class="mode-option"
            ><input
              :checked="mode === 'baseConversion'"
              type="radio"
              value="baseConversion"
              @change="chooseMode('baseConversion')"
            /><span>进制转换</span></label
          >
        </fieldset>
        <div v-if="mode === 'factorization'" class="input-grid input-grid--single">
          <label class="field"
            ><span>待分解的正整数</span
            ><input v-model="factorValue" inputmode="numeric" autocomplete="off" @input="calculate"
          /></label>
        </div>
        <div v-else-if="mode === 'commonFactor'" class="input-grid input-grid--single">
          <label class="field"
            ><span>正整数（以逗号或空格分隔）</span><input v-model="commonValues" autocomplete="off" @input="calculate"
          /></label>
        </div>
        <div v-else class="input-grid">
          <label class="field"
            ><span>十进制数</span
            ><input v-model="conversionValue" inputmode="numeric" autocomplete="off" @input="calculate"
          /></label>
          <span class="division-operator" aria-hidden="true">→</span>
          <label class="field"
            ><span>目标进制（2–36）</span
            ><input v-model.number="targetBase" inputmode="numeric" min="2" max="36" type="number" @input="calculate"
          /></label>
        </div>
        <p class="error-message" role="alert">{{ error }}</p>
        <div class="form-actions">
          <button class="ghost-button" type="button" @click="applyExample">
            {{
              mode === 'factorization' ? '试试分解 48' : mode === 'commonFactor' ? '试试 12 和 18' : '试试 13 转二进制'
            }}
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
            </div>
            <div class="settings-switch-group">
              <label class="switch-field"
                ><input v-model="showGuideGrid" type="checkbox" @change="calculate" /><span
                  class="switch-ui"
                  aria-hidden="true"
                ></span
                ><span>显示辅助网格</span></label
              >
              <label v-if="mode === 'baseConversion'" class="switch-field"
                ><input v-model="showRemainders" type="checkbox" @change="calculate" /><span
                  class="switch-ui"
                  aria-hidden="true"
                ></span
                ><span>显示每步余数</span></label
              >
            </div>
          </div>
        </div>
      </form>
      <section class="result-card" aria-live="polite">
        <div class="calculation-result">
          <p class="panel-kicker result-heading__kicker">SHORT DIVISION</p>
          <div class="result-heading">
            <h2>
              {{
                mode === 'factorization'
                  ? '质因数分解'
                  : mode === 'commonFactor'
                    ? '最大公约数 / 最小公倍数'
                    : '十进制转其他进制'
              }}
            </h2>
            <CopyMacroButton :source="macroSource" /><VisibleTextRowsPanel v-if="scene" :scene="scene" />
          </div>
          <p class="normalization">
            {{
              computation?.mode === 'factorization'
                ? `约数个数：${computation.divisorCount}；约数和：${computation.divisorSum}`
                : computation?.mode === 'commonFactor'
                  ? '左侧公共质因数的乘积为 GCD；再乘底行所有商为 LCM。'
                  : '余数从下往上读；每一步使用整数商。'
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
        title="短除法表达式解析"
        description="使用 |48 分解质因数、|12 18 自动求公因数、(13)2 转换进制；全部由 shushi 解析为统一场景。"
        :code="implementationCode"
      />
    </section>
  </div>
</template>
