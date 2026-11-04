<script setup lang="ts">
import { computed, ref } from 'vue'
import { compileMacro, completeMacro, formatMacro, minifyMacro, unformatMacro } from '@u1in/shushi-macro'
import GridPreview from './GridPreview.vue'
import VisibleTextRowsPanel from './VisibleTextRowsPanel.vue'
import CodeImplementationPanel from './CodeImplementationPanel.vue'
import { arithmeticExamples, formatExampleSource, type MacroExample } from './macroPlaygroundExamples'
import { implementationSnippets } from './implementationSnippets'

const source = ref(formatExampleSource(arithmeticExamples[0].source))

/** 输入在每次变更后立即编译；错误保留在输入区而不会影响既有运算器。 */
const result = computed(() => {
  try {
    return { scene: compileMacro(source.value), error: '' }
  } catch (reason) {
    return { scene: undefined, error: reason instanceof Error ? reason.message : '宏源码无法编译。' }
  }
})

/** 示例源码由计算器链路生成；载入时同样展示完整源码，保证默认视图可读。 */
const useExample = ({ source: exampleSource }: MacroExample): void => {
  source.value = formatExampleSource(exampleSource)
}

/** 格式化失败时保留原源码，让现有编译错误继续提示用户修正输入。 */
const transformSource = (transform: (value: string) => string): boolean => {
  try {
    source.value = transform(source.value)
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
</script>

<template>
  <div class="operation-demo macro-playground" data-operation="macro">
    <section class="workspace" aria-label="宏试验区">
      <section class="control-panel">
        <p class="panel-kicker">MACRO PLAYGROUND</p>
        <h2>宏试验区</h2>
        <p class="normalization">输入宏源码并查看渲染结果，具体宏命令请参阅文档。</p>
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
          <textarea v-model="source" spellcheck="false" aria-label="宏源码输入框"></textarea>
        </label>
        <div class="form-actions">
          <span class="macro-example-label">示例</span>
          <button v-for="example in arithmeticExamples" :key="example.label" class="ghost-button macro-example-button" type="button" @click="useExample(example)">{{ example.label }}</button>
        </div>
        <p class="error-message" role="alert">{{ result.error }}</p>
      </section>
      <section class="result-card" aria-live="polite">
        <div v-if="result.scene" class="calculation-result">
          <div class="result-heading">
            <div>
              <p class="panel-kicker">COMPILED GRID SCENE</p>
              <h2>已推导 {{ result.scene.columns.length }} 列、{{ result.scene.rows.length }} 行</h2>
            </div>
            <VisibleTextRowsPanel :scene="result.scene" />
          </div>
          <GridPreview :scene="result.scene" mode="both" />
        </div>
        <div v-else class="calculation-result">
          <p class="panel-kicker">COMPILATION ERROR</p>
          <h2>请修正宏源码后预览</h2>
        </div>
      </section>
      <CodeImplementationPanel
        title="编译与格式化宏源码"
        description="输入宏先经过统一编译器生成 GridScene；格式化操作只改写源码，不复制渲染逻辑。"
        :code="implementationSnippets.macroPlayground"
      />
    </section>
  </div>
</template>
