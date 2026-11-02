<script setup lang="ts">
import { computed, ref } from 'vue'
import { createMacroAstInspection } from '@u1in/shushi-macro'
import type { MacroAstInspection, MacroNode } from '@u1in/shushi-macro'
import GridPreview from './GridPreview.vue'

/** 示例特意使用完整命令，便于直观看到编辑后输出如何降级为最简宏源码。 */
const initialSource = `GRID(
  ROW(MM(3), MM(5), MM(6)),
  ROW(MM(+), CELL(MM(2), RB(1)), CELL(MM(7), RB(1)), MM(8)),
  LINE,
  ROW(MM(6), MM(3), MM(4))
)`

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

/** 点击渲染元素后读取其 AST 引用；没有文字参数的线条和厂字弯仍可查看但不能改文本。 */
const selectElement = (elementId: string): void => {
  selectedElementId.value = elementId
  editedText.value = inspection.value.references[elementId]?.text ?? ''
  error.value = canEditSelectedText.value ? '' : '该元素没有可单独修改的文字参数。'
}

/** 只替换所选元素的第一个文字字面量，再以新 AST 重新编译和输出最简源码。 */
const applyText = (): void => {
  if (!selectedElementId.value) return
  try {
    inspection.value = inspection.value.updateElementText(selectedElementId.value, editedText.value)
    error.value = ''
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '无法更新选中的 AST 数据。'
  }
}

/** 重置为完整源码，方便重复体验“点击 → 修改 → 最简化输出”的链路。 */
const resetInspection = (): void => {
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
        <h2>点击元素，单独修改 AST 数据</h2>
        <p class="normalization">点击右侧 SVG 中的数字、运算符或注记，即可反查它对应的宏 AST 节点。修改文字后，示例会重新编译，并输出最简宏源码。</p>

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
          <button class="ghost-button" type="button" @click="resetInspection">恢复完整示例</button>
        </div>
        <p class="error-message" role="alert">{{ error }}</p>
      </section>

      <section class="result-card" aria-live="polite">
        <div class="calculation-result">
          <div class="result-heading">
            <div>
              <p class="panel-kicker">CLICKABLE SVG RESULT</p>
              <h2>点击任一宏图元</h2>
            </div>
          </div>
          <GridPreview :scene="inspection.scene" mode="svg" interactive :selected-element-id="selectedElementId" @element-click="selectElement" />
        </div>
      </section>

      <aside class="ast-output-panel" aria-label="最简宏源码输出">
        <p class="panel-kicker">MINIFIED MACRO</p>
        <h2>重新输出的最简式</h2>
        <pre><code>{{ inspection.minifiedSource }}</code></pre>
        <p>完整 `GRID`、`ROW`、`CELL` 与可省略的 `MM` 会在不改变画面语义时自动降级。</p>
      </aside>
    </section>
  </div>
</template>
