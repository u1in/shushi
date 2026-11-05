<script setup lang="ts">
import { computed, ref } from 'vue'
import { shushiCore } from '@u1in/shushi-core'
import { completeMacro, createMacroAstInspection, formatMacro, minifyMacro, minifyMacroForCopy, unformatMacro } from '@u1in/shushi-macro'
import type { MacroAstInspection, MacroNode } from '@u1in/shushi-macro'
import GridPreview from './GridPreview.vue'
import VisibleTextRowsPanel from './VisibleTextRowsPanel.vue'
import CodeImplementationPanel from './CodeImplementationPanel.vue'
import { implementationSnippets } from './implementationSnippets'
import { arithmeticExamples, type MacroExample } from './macroPlaygroundExamples'

const DEFAULT_GRID_SETTINGS = {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
}

/** 算式输入只负责选择现有门户 API；生成的源码随后仍可在下方 textarea 中继续编辑。 */
const createInspectionFromExpression = (inputExpression: string): MacroAstInspection => {
  const normalizedExpression = inputExpression.trim().replace(/\s+/g, '').replace(/[xX*]/g, '×').replace(/÷/g, '/').replace(/−/g, '-')
  const divisionCount = (normalizedExpression.match(/\//g) ?? []).length
  if (divisionCount > 0) {
    if (divisionCount !== 1 || /[+\-×]/.test(normalizedExpression) || !/^\d+\/\d+$/.test(normalizedExpression)) {
      throw new Error('除法算式只能包含一组被除数和除数，例如 10230 ÷ 25。')
    }
    const [dividend, divisor] = normalizedExpression.split('/')
    const result = shushiCore({
      operation: 'division',
      divisor,
      dividend,
      calculation: { resultMode: 'decimal' },
      settings: {
        ...DEFAULT_GRID_SETTINGS,
        bracketBend: 1,
        uniformSubtractionBars: false,
        showZeroQuotientSteps: false,
      },
    })
    return createMacroAstInspection(minifyMacroForCopy(result.source))
  }

  const result = shushiCore({
    operation: 'composite',
    expression: normalizedExpression,
    settings: {
      ...DEFAULT_GRID_SETTINGS,
      showCarrySteps: true,
      showBorrowSteps: false,
      uniformMultiplicationBars: false,
    },
  })
  return createMacroAstInspection(minifyMacroForCopy(result.source))
}

const expression = ref(arithmeticExamples[0].expression)
const initialInspection = createInspectionFromExpression(expression.value)
const source = ref(initialInspection.source)
const inspection = ref<MacroAstInspection>(initialInspection)
const selectedElementId = ref('')
const editedText = ref('')
const error = ref('')
const errorTarget = ref<'expression' | 'source' | null>(null)

/** 将解析器偏底层的定位信息改写成用户能直接理解的提示。 */
const getReadableMacroError = (reason: unknown, fallback: string): string => {
  const message = reason instanceof Error ? reason.message : ''
  if (message.startsWith('此处需要参数')) {
    return '这里缺少宏命令或参数，请检查开头是否为空，以及括号内是否写了内容。'
  }
  return message.replace(/（第 \d+ 个字符附近：.*）$/, '') || fallback
}

const selectedReference = computed(() => inspection.value.references[selectedElementId.value])
const selectedNode = computed<MacroNode | undefined>(() => selectedReference.value?.node)
const selectedNodeLabel = computed(() => {
  const node = selectedNode.value
  if (!node) return '尚未选择元素'
  if (node.kind === 'call') return `${node.name}(…)`
  if (node.kind === 'symbol') return node.name
  return `文本：${node.value}`
})
const selectedPath = computed(() => selectedReference.value?.nodePath.join(' → ') || '—')
const canEditSelectedText = computed(() => selectedReference.value?.literalPath !== undefined)

/** 由算式重新生成最简宏；失败时保留上一次源码和 AST 预览，方便用户修正输入。 */
const generateFromExpression = (shouldFormat = false): void => {
  try {
    const nextInspection = createInspectionFromExpression(expression.value)
    const nextSource = shouldFormat ? formatMacro(nextInspection.source) : nextInspection.source
    const formattedInspection = shouldFormat ? createMacroAstInspection(nextSource) : nextInspection
    source.value = formattedInspection.source
    inspection.value = formattedInspection
    selectedElementId.value = ''
    editedText.value = ''
    error.value = ''
    errorTarget.value = null
  } catch (reason) {
    error.value = getReadableMacroError(reason, '算式无法生成宏源码。')
    errorTarget.value = 'expression'
  }
}

/** 重新解析用户输入的宏；解析失败时保留上一次可渲染结果，避免画布突然消失。 */
const compileSource = (): void => {
  try {
    inspection.value = createMacroAstInspection(source.value)
    selectedElementId.value = ''
    editedText.value = ''
    error.value = ''
    errorTarget.value = null
  } catch (reason) {
    error.value = getReadableMacroError(reason, '宏源码无法编译，请检查宏命令和参数。')
    errorTarget.value = 'source'
  }
}

/** 格式化或切换源码形式后立即重建 AST，确保画布和源码保持同一版本。 */
const transformSource = (transform: (value: string) => string): boolean => {
  try {
    source.value = transform(source.value)
    compileSource()
    return true
  } catch {
    // 源码不完整时不改写输入，避免用户丢失正在编辑的内容。
    return false
  }
}

const formatSource = (): void => { transformSource(formatMacro) }
const completeSource = (): void => { transformSource(completeMacro) }
const minifySource = (): void => { transformSource(minifyMacro) }
const unformatSource = (): void => { transformSource(unformatMacro) }

/** 输入宏源码时立即尝试编译，错误源码保留上一次可渲染结果。 */
const handleSourceInput = (event: Event): void => {
  const input = event.target
  if (!(input instanceof HTMLTextAreaElement)) return
  source.value = input.value
  compileSource()
}

/** 算式输入变化时走统一门户 API，不直接拼接宏源码。 */
const handleExpressionInput = (event: Event): void => {
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return
  expression.value = input.value
  generateFromExpression()
}

/** 点击渲染元素后读取其 AST 引用；没有文字参数的线条和厂字弯仍可查看但不能改文本。 */
const selectElement = (elementId: string): void => {
  selectedElementId.value = elementId
  editedText.value = inspection.value.references[elementId]?.text ?? ''
  errorTarget.value = null
  error.value = canEditSelectedText.value ? '' : '该元素没有可单独修改的文字参数。'
}

/** 只替换所选元素的第一个文字字面量，再按输入框当前风格回写源码并重新渲染。 */
const applyText = (): void => {
  if (!selectedElementId.value) return
  try {
    inspection.value = inspection.value.updateElementText(selectedElementId.value, editedText.value)
    // 完整版保留可读缩进，最简版保留分号行和语法糖，让下一次编译继续基于当前结果。
    source.value = inspection.value.source
    error.value = ''
    errorTarget.value = null
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '无法更新选中的 AST 数据。'
    errorTarget.value = null
  }
}

/** 选中文字只允许保留一个 Unicode 字符，避免一次修改跨越多个 AST 文本单元。 */
const handleEditedTextInput = (event: Event): void => {
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return
  const normalizedText = Array.from(input.value).slice(0, 1).join('')
  input.value = normalizedText
  editedText.value = normalizedText
  if (canEditSelectedText.value) applyText()
}

/** 示例只填入算式输入框，再复用算式生成链路更新宏源码和预览。 */
const useExample = ({ expression: exampleExpression }: MacroExample): void => {
  expression.value = exampleExpression
  generateFromExpression(true)
}
</script>

<template>
  <div class="operation-demo macro-ast-inspector" data-operation="macro-ast-inspector">
    <section class="workspace" aria-label="输入宏">
      <section class="control-panel">
        <p class="panel-kicker">MACRO EXPERIMENT</p>
        <h2>输入宏</h2>
        <p class="normalization">输入宏源码渲染竖式，点击图元即可单独修改。</p>

        <label class="macro-source-field macro-expression-field">
          <span>算式输入</span>
          <input :value="expression" aria-label="算式输入" autocomplete="off" spellcheck="false" @input="handleExpressionInput" />
          <p v-if="errorTarget === 'expression'" class="error-message" role="alert">{{ error }}</p>
          <small class="field-help">支持 +、-、×、*、x、÷、/；含除法时只能输入单个除法。</small>
        </label>

        <div class="macro-format-row">
          <div class="macro-format-toolbar" aria-label="源码形式">
            <span>源码形式</span>
            <button class="macro-insert-button" type="button" @click="minifySource">最简形式</button>
            <button class="macro-insert-button" type="button" @click="completeSource">完整形式</button>
          </div>
          <div class="macro-format-toolbar" aria-label="格式化宏源码">
            <span>格式化</span>
            <button class="macro-insert-button" type="button" @click="formatSource">格式化</button>
            <button class="macro-insert-button" type="button" @click="unformatSource">去格式化</button>
          </div>
        </div>

        <label class="macro-source-field">
          <span>宏源码</span>
          <textarea :value="source" aria-label="宏源码" spellcheck="false" @input="handleSourceInput" />
          <p v-if="errorTarget === 'source' || (!errorTarget && error)" class="error-message" role="alert">{{ error }}</p>
        </label>
        <div class="form-actions">
          <span class="macro-example-label">示例</span>
          <button v-for="example in arithmeticExamples" :key="example.label" class="ghost-button macro-example-button" type="button" @click="useExample(example)">{{ example.label }}</button>
        </div>
      </section>

      <section class="result-card" aria-live="polite">
        <div class="calculation-result">
          <div class="result-heading">
            <div>
              <p class="panel-kicker">MACRO PREVIEW</p>
              <h2>预览区</h2>
            </div>
            <VisibleTextRowsPanel :scene="inspection.scene" />
          </div>
          <section class="ast-inspection-panel" aria-label="图元 AST 定位修改">
            <p class="ast-inspection-panel__hint">点击任一宏图元，可查看 AST 并单独修改。</p>
            <dl class="ast-selection-details">
              <div><dt>渲染元素</dt><dd>{{ selectedElementId || '—' }}</dd></div>
              <div><dt>AST 节点</dt><dd>{{ selectedNodeLabel }}</dd></div>
              <div><dt>AST 路径</dt><dd>{{ selectedPath }}</dd></div>
              <div class="ast-edit-cell">
                <dt>局部修改</dt>
                <dd>
                  <input v-model="editedText" :disabled="!canEditSelectedText" maxlength="1" aria-label="局部修改 AST 文字" @input="handleEditedTextInput" />
                </dd>
              </div>
            </dl>
          </section>
          <GridPreview :scene="inspection.scene" mode="both" interactive :selected-element-id="selectedElementId" @element-click="selectElement" />
        </div>
      </section>
      <CodeImplementationPanel
        title="宏渲染及AST定位修改"
        description="宏源码先渲染为网格，再通过 AST 定位图元并回写单项文字。"
        :code="implementationSnippets.macroAstInspector"
      />
    </section>
  </div>
</template>
