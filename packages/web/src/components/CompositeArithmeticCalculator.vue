<script setup lang="ts">
import { computed, ref } from 'vue'
import { AUTO_COLOR_THEME_FALLBACK, shushi } from '@u1in/shushi-core'
import type { AnyVerticalArithmeticResult, GridScene } from '@u1in/shushi-core'
import GridPreview from './GridPreview.vue'
import AutoColorThemeEditor from './AutoColorThemeEditor.vue'
import { toAutoColorTheme, type AutoColorThemeColorValues } from './autoColorTheme'
import CopyMacroButton from './CopyMacroButton.vue'
import StepPlaybackControls from './StepPlaybackControls.vue'
import VisibleTextRowsPanel from './VisibleTextRowsPanel.vue'
import CodeImplementationPanel from './CodeImplementationPanel.vue'
import { createShushiImplementationSnippet } from './implementationSnippets'
import { DEFAULT_RENDERER_FONT, type RendererFontFamily } from './rendererFonts'
import { useCalculatorStepPlayback } from '../composables/stepPlayback'
import { getOperationPlaybackStepCount } from '../composables/operationPlayback'

const expression = ref('125 + 75 - 20 × 3')
const cellWidth = ref(30)
const rowHeight = ref(46)
const fontSizeRatio = ref(1)
const rendererFont = ref<RendererFontFamily>(DEFAULT_RENDERER_FONT)
// 首页长除法默认保留 8 位，老师可在输入为长除法时直接调整。
const maxDecimalDigits = ref(8)
const useTrailingZeroShortcut = ref(true)
const showGuideGrid = ref(false)
const showCarrySteps = ref(true)
const showBorrowSteps = ref(false)
const useMinimalDecimalResult = ref(false)
const showRemainders = ref(true)
const showZeroQuotientSteps = ref(false)
const error = ref('')
const result = ref<AnyVerticalArithmeticResult>()
const scene = ref<GridScene>()
const macroSource = ref('')
const previewTheme = ref<AutoColorThemeColorValues>({
  text: AUTO_COLOR_THEME_FALLBACK.text,
  carry: AUTO_COLOR_THEME_FALLBACK.carry,
  borrow: AUTO_COLOR_THEME_FALLBACK.borrow,
  operator: AUTO_COLOR_THEME_FALLBACK.operator,
  decimal: AUTO_COLOR_THEME_FALLBACK.decimal,
  strike: AUTO_COLOR_THEME_FALLBACK.strike,
  rule: AUTO_COLOR_THEME_FALLBACK.rule.color!,
  bracketRule: AUTO_COLOR_THEME_FALLBACK.bracketRule.color!,
})

/** 只有单独乘法且任一操作数是非零 10 的倍数时，才开放乘法末尾零快捷计算。 */
const standaloneMultiplicationOperands = computed(() => {
  const normalizedExpression = expression.value.replace(/\s+/g, '')
  const match = /^(\d+)[×*xX](\d+)$/.exec(normalizedExpression)
  if (!match) return undefined
  return [match[1].replace(/^0+(?=\d)/, ''), match[2].replace(/^0+(?=\d)/, '')] as const
})
const canUseTrailingZeroShortcut = computed(
  () => standaloneMultiplicationOperands.value?.some((value) => value !== '0' && value.endsWith('0')) ?? false,
)
const trailingZeroShortcutEnabled = computed(() => canUseTrailingZeroShortcut.value && useTrailingZeroShortcut.value)
const isLongDivisionExpression = computed(() => /^\d+(?:\.\d+)?\s*[÷/]\s*\d+(?:\.\d+)?$/.test(expression.value))
const isCommonFactorResult = computed(() => {
  const computation = result.value?.computation
  return Boolean(computation && 'gcd' in computation && 'lcm' in computation)
})
const isBaseConversionResult = computed(() => {
  const computation = result.value?.computation
  return Boolean(computation && 'convertedText' in computation)
})

/** 统一展示 shushi 门户返回的各类运算结果，不让页面依赖某一种 computation 结构。 */
const answer = computed(() => {
  const computation = result.value?.computation
  if (!computation) return '—'
  if ('resultDigits' in computation) return computation.resultDigits
  if ('sumText' in computation) return computation.sumText
  if ('differenceDigits' in computation) return computation.resultText
  if ('productText' in computation) return computation.productText
  if ('quotientText' in computation)
    return computation.remainder === '0'
      ? computation.quotientText
      : `${computation.quotientText} …… ${computation.remainder}`
  if (computation.mode === 'division') return `${computation.quotient} … ${computation.remainder}`
  if (computation.mode === 'factorization') return computation.factorizationText
  if (computation.mode === 'commonFactor') return `最大公约数是${computation.gcd}，最小公倍数是${computation.lcm}`
  return `${computation.inputValues[0]}的${computation.targetBase}进制是${computation.convertedText}`
})

const renderScene = (shouldRenderWithoutComputation = false): void => {
  if (!shouldRenderWithoutComputation && !result.value) return
  const nextResult = shushi(expression.value, {
    fontFamily: rendererFont.value,
    colorTheme: toAutoColorTheme(previewTheme.value),
    calculation: {
      maxDecimalDigits: maxDecimalDigits.value,
      useTrailingZeroShortcut: trailingZeroShortcutEnabled.value,
      preserveOperandOrder: !trailingZeroShortcutEnabled.value,
    },
    settings: {
      cellWidth: cellWidth.value,
      rowHeight: rowHeight.value,
      fontSizeRatio: fontSizeRatio.value,
      showGuideGrid: showGuideGrid.value,
      showCarrySteps: showCarrySteps.value,
      showBorrowSteps: showBorrowSteps.value,
      useMinimalDecimalResult: useMinimalDecimalResult.value,
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
const handleFontChange = (fontFamily: RendererFontFamily): void => {
  rendererFont.value = fontFamily
  renderScene()
}

/** 颜色主题通过 JavaScript 重新生成场景，避免依赖预览容器的 CSS 继承。 */
const handleThemeChange = (theme: AutoColorThemeColorValues): void => {
  previewTheme.value = theme
  renderScene()
}

const playback = useCalculatorStepPlayback({
  getStepCount: () => getOperationPlaybackStepCount(result.value, showZeroQuotientSteps.value),
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
    operation: 'expression',
    fontFamily: rendererFont.value,
    colorTheme: previewTheme.value,
    fields: [['expression', expression.value]],
    calculation: [
      ['maxDecimalDigits', maxDecimalDigits.value],
      ['useTrailingZeroShortcut', trailingZeroShortcutEnabled.value],
      ['preserveOperandOrder', !trailingZeroShortcutEnabled.value],
    ],
    settings: [
      ['cellWidth', cellWidth.value],
      ['rowHeight', rowHeight.value],
      ['fontSizeRatio', fontSizeRatio.value],
      ['showGuideGrid', showGuideGrid.value],
      ['showCarrySteps', showCarrySteps.value],
      ['showBorrowSteps', showBorrowSteps.value],
      ['useMinimalDecimalResult', useMinimalDecimalResult.value],
      ['showRemainders', showRemainders.value],
      ['showZeroQuotientSteps', showZeroQuotientSteps.value],
      ['uniformMultiplicationBars', false],
      ['visibleStepCount', visibleStepCount.value],
    ],
  }),
)

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

const useExampleExpression = (): void => {
  expression.value = '125 + 75 - 20 × 3'
  calculate()
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
            <input
              v-model="expression"
              autocomplete="off"
              spellcheck="false"
              aria-describedby="composite-expression-help"
              @input="calculate"
            />
          </label>
        </div>
        <div v-if="isLongDivisionExpression" class="input-grid input-grid--single decimal-limit-input-grid">
          <label class="field">
            <span>最大小数位（0 表示到个位取余）</span>
            <input
              v-model.number="maxDecimalDigits"
              type="number"
              min="0"
              step="1"
              inputmode="numeric"
              @input="calculate"
            />
          </label>
        </div>
        <p class="error-message" role="alert">{{ error }}</p>
        <p id="composite-expression-help" class="field-help expression-rules">
          <span
            >支持连续 <code>+</code>、<code>-</code>、<code>×</code>（也可输入 <code>*</code> 或
            <code>x</code>）。</span
          >
          <span>加法、乘法和长除法可输入小数，例如 <code>1.2 × 3.4</code>、<code>34.5 / 5</code>。</span>
          <span>长除法也可用 <code>10230 ÷ 25</code> 或 <code>10230 / 25</code>。</span>
          <span>分解质因数：<code>|48</code>。</span>
          <span>求最大公约数和最小公倍数：<code>|12 18</code>（自动试除）。</span>
          <span>进制转换：<code>(13)2</code>，表示把十进制 13 转为二进制。</span>
        </p>
        <div class="form-actions">
          <button class="ghost-button" type="button" @click="useExampleExpression">试试 125 + 75 - 20 × 3</button>
        </div>
        <div class="settings-panel">
          <div class="settings-controls">
            <div class="settings-range-group">
              <label class="range-field"
                ><span
                  >方格宽度 <output>{{ cellWidth }}px</output></span
                ><input v-model.number="cellWidth" type="range" min="28" max="56" @input="renderScene()"
              /></label>
              <label class="range-field"
                ><span
                  >行高 <output>{{ rowHeight }}px</output></span
                ><input v-model.number="rowHeight" type="range" min="36" max="64" @input="renderScene()"
              /></label>
              <label class="range-field"
                ><span
                  >字号比例 <output>{{ fontSizeRatio.toFixed(2) }}</output></span
                ><input
                  v-model.number="fontSizeRatio"
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.01"
                  @input="renderScene()"
              /></label>
            </div>
            <div class="settings-switch-group">
              <label class="switch-field"
                ><input v-model="showGuideGrid" type="checkbox" @change="renderScene()" /><span
                  class="switch-ui"
                  aria-hidden="true"
                ></span
                ><span>显示辅助网格</span></label
              >
              <label class="switch-field"
                ><input v-model="showCarrySteps" type="checkbox" @change="renderScene()" /><span
                  class="switch-ui"
                  aria-hidden="true"
                ></span
                ><span>显示加法/乘法进位</span></label
              >
              <label class="switch-field"
                ><input v-model="showBorrowSteps" type="checkbox" @change="renderScene()" /><span
                  class="switch-ui"
                  aria-hidden="true"
                ></span
                ><span>显示减法借位</span></label
              >
              <label class="switch-field"
                ><input v-model="useMinimalDecimalResult" type="checkbox" @change="renderScene()" /><span
                  class="switch-ui"
                  aria-hidden="true"
                ></span
                ><span>小数结果最简式</span></label
              >
              <label class="switch-field"
                ><input v-model="showRemainders" type="checkbox" @change="renderScene()" /><span
                  class="switch-ui"
                  aria-hidden="true"
                ></span
                ><span>显示短除法余数</span></label
              >
              <label class="switch-field"
                ><input v-model="showZeroQuotientSteps" type="checkbox" @change="renderScene()" /><span
                  class="switch-ui"
                  aria-hidden="true"
                ></span
                ><span>显示除法零商步骤</span></label
              >
              <label v-if="canUseTrailingZeroShortcut" class="switch-field"
                ><input v-model="useTrailingZeroShortcut" type="checkbox" @change="renderScene()" /><span
                  class="switch-ui"
                  aria-hidden="true"
                ></span
                ><span>启用 10 倍数快捷计算</span></label
              >
            </div>
          </div>
        </div>
      </form>
      <section class="result-card" aria-live="polite">
        <div class="calculation-result">
          <p class="panel-kicker result-heading__kicker">VERTICAL PREVIEW</p>
          <div class="result-heading">
            <div class="result-heading__title">
              <h2 v-if="!isCommonFactorResult && !isBaseConversionResult">
                {{ expression.trim() ? `${expression} = ` : '等待输入表达式'
                }}<output v-if="scene"> {{ answer }}</output>
              </h2>
              <h2 v-else-if="scene">
                <output>{{ answer }}</output>
              </h2>
            </div>
            <template v-if="scene"
              ><CopyMacroButton :source="macroSource" /><VisibleTextRowsPanel :scene="scene"
            /></template>
          </div>
          <p class="normalization">
            {{
              scene
                ? '每一步都会清楚展示；加减乘可以连续计算，除法和短除法也会自动排成对应的竖式。'
                : '在左侧输入算式，这里会显示对应的竖式。'
            }}
          </p>
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
          <GridPreview
            v-if="scene"
            :scene="scene"
            :font-family="rendererFont"
            mode="both"
            @font-change="handleFontChange"
          >
            <template #theme-control>
              <AutoColorThemeEditor :model-value="previewTheme" @update:model-value="handleThemeChange" />
            </template>
          </GridPreview>
          <div
            v-else
            class="renderer-comparison renderer-comparison--both renderer-comparison--empty"
            role="status"
            aria-live="polite"
          >
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
