<script setup lang="ts">
import { computed, ref } from 'vue'
import { createMacroAstInspection } from '@u1in/shushi-macro'
import type { MacroAstInspection, MacroNode } from '@u1in/shushi-macro'
import GridPreview from './GridPreview.vue'
import VisibleTextRowsPanel from './VisibleTextRowsPanel.vue'
import CodeImplementationPanel from './CodeImplementationPanel.vue'
import { implementationSnippets } from './implementationSnippets'
import { arithmeticExamples, formatExampleSource, type MacroExample } from './macroPlaygroundExamples'

/** 示例使用最简宏命令，便于直接演示 AST 修改后仍按当前输入框风格回写源码。 */
const initialSource = arithmeticExamples[0].source

const source = ref(initialSource)
const inspection = ref<MacroAstInspection>(createMacroAstInspection(initialSource))
const selectedElementId = ref('')
const editedText = ref('')
const error = ref('')

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

/** 重新解析用户输入的宏；解析失败时保留上一次可渲染结果，避免画布突然消失。 */
const compileSource = (): void => {
  try {
    inspection.value = createMacroAstInspection(source.value)
    selectedElementId.value = ''
    editedText.value = ''
    error.value = ''
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '宏源码无法编译。'
  }
}

/** 输入宏源码时立即尝试编译，错误源码保留上一次可渲染结果。 */
const handleSourceInput = (event: Event): void => {
  const input = event.target
  if (!(input instanceof HTMLTextAreaElement)) return
  source.value = input.value
  compileSource()
}

/** 点击渲染元素后读取其 AST 引用；没有文字参数的线条和厂字弯仍可查看但不能改文本。 */
const selectElement = (elementId: string): void => {
  selectedElementId.value = elementId
  editedText.value = inspection.value.references[elementId]?.text ?? ''
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
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '无法更新选中的 AST 数据。'
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

/** 与宏试验区共用示例；载入后格式化源码，方便继续点击图元检查 AST。 */
const useExample = ({ source: exampleSource }: MacroExample): void => {
  source.value = formatExampleSource(exampleSource)
  compileSource()
}
</script>

<template>
  <div class="operation-demo macro-ast-inspector" data-operation="macro-ast-inspector">
    <section class="workspace" aria-label="宏 AST 元素检查器">
      <section class="control-panel">
        <p class="panel-kicker">AST ELEMENT INSPECTOR</p>
        <h2>AST检查</h2>
        <p class="normalization">检查宏图元对应的 AST 节点，并直接修改可编辑的文字数据。</p>

        <label class="macro-source-field">
          <span>宏源码</span>
          <textarea :value="source" aria-label="宏源码" spellcheck="false" @input="handleSourceInput" />
        </label>
        <div class="form-actions">
          <span class="macro-example-label">示例</span>
          <button v-for="example in arithmeticExamples" :key="example.label" class="ghost-button macro-example-button" type="button" @click="useExample(example)">{{ example.label }}</button>
        </div>
        <p class="error-message" role="alert">{{ error }}</p>
      </section>

      <section class="result-card" aria-live="polite">
        <div class="calculation-result">
          <div class="result-heading">
            <div>
              <p class="panel-kicker">CLICKABLE DOM / SVG RESULT</p>
              <h2>点击任一宏图元</h2>
            </div>
            <VisibleTextRowsPanel :scene="inspection.scene" />
          </div>
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
          <GridPreview :scene="inspection.scene" mode="both" interactive :selected-element-id="selectedElementId" @element-click="selectElement" />
        </div>
      </section>
      <CodeImplementationPanel
        title="AST 检查与单项回写"
        description="宏源码解析成可定位的 AST 引用，选中文字修改后再由检查器回写为当前源码。"
        :code="implementationSnippets.macroAstInspector"
      />
    </section>
  </div>
</template>
