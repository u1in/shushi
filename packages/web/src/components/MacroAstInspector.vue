<script setup lang="ts">
import { computed, ref } from 'vue'
import { createMacroAstInspection } from '@u1in/shushi-macro'
import type { MacroAstInspection, MacroNode } from '@u1in/shushi-macro'
import GridPreview from './GridPreview.vue'
import VisibleTextRowsPanel from './VisibleTextRowsPanel.vue'

/** 示例特意使用完整命令，便于直观看到 AST 修改后仍按当前输入框风格回写源码。 */
const initialSource = `GRID(
  ROW(MM(3), MM(5), MM(6)),
  ROW(MM(+), CELL(MM(2), RB(1)), CELL(MM(7), RB(1)), MM(8)),
  LINE,
  ROW(MM(6), MM(3), MM(4))
)`

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

/** 重置为完整源码，方便重复体验“点击 → 修改 → 回写源码”的链路。 */
const resetInspection = (): void => {
  source.value = initialSource
  inspection.value = createMacroAstInspection(initialSource)
  selectedElementId.value = ''
  editedText.value = ''
  error.value = ''
}
</script>

<template>
  <div class="operation-demo macro-ast-inspector" data-operation="macro-ast-inspector">
    <section class="workspace" aria-label="宏 AST 元素检查器">
      <section class="control-panel">
        <p class="panel-kicker">AST ELEMENT INSPECTOR</p>
        <h2>输入宏，点击元素修改 AST 数据</h2>
        <p class="normalization">先输入或修改宏源码并编译；再点击右侧 DOM/CSS 或 SVG 中的数字、运算符或注记，即可反查并单独修改对应的 AST 节点。</p>

        <label class="macro-source-field">
          <span>宏源码</span>
          <textarea v-model="source" aria-label="宏源码" spellcheck="false" @keydown.ctrl.enter.prevent="compileSource" />
        </label>
        <div class="form-actions">
          <button class="primary-button" type="button" @click="compileSource">编译宏</button>
          <button class="ghost-button" type="button" @click="resetInspection">恢复完整示例</button>
        </div>
        <p class="normalization">提示：在源码框中按 Ctrl + Enter 也可以编译。</p>
        <p class="error-message" role="alert">{{ error }}</p>

        <dl class="ast-selection-details">
          <div><dt>渲染元素</dt><dd>{{ selectedElementId || '—' }}</dd></div>
          <div><dt>AST 节点</dt><dd>{{ selectedNodeLabel }}</dd></div>
          <div><dt>AST 路径</dt><dd>{{ selectedPath }}</dd></div>
        </dl>

        <label class="macro-source-field">
          <span>所选文字</span>
          <input v-model="editedText" :disabled="!canEditSelectedText" aria-label="所选 AST 文字" @keyup.enter="applyText" />
        </label>
        <div class="form-actions">
          <button class="ghost-button" type="button" :disabled="!canEditSelectedText" @click="applyText">应用单项修改</button>
        </div>
      </section>

      <section class="result-card" aria-live="polite">
        <div class="calculation-result">
          <div class="result-heading">
            <div>
              <p class="panel-kicker">CLICKABLE DOM / SVG RESULT</p>
              <h2>点击任一宏图元</h2>
            </div>
          </div>
          <GridPreview :scene="inspection.scene" mode="both" interactive :selected-element-id="selectedElementId" @element-click="selectElement" />
        </div>
      </section>
      <VisibleTextRowsPanel :scene="inspection.scene" />
    </section>
  </div>
</template>
