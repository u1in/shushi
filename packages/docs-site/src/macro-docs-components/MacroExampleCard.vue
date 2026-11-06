<script setup lang="ts">
import { computed } from 'vue'
import { compileMacro } from '@u1in/shushi-macro'
import MacroGridPreview from './MacroGridPreview.vue'
import DocText from './DocText.vue'
import { useClipboard } from './use-clipboard'
import HighlightedCode from './HighlightedCode.vue'
import type { DocCodeLanguage } from '@u1in/shushi-docs/macro/types'

/**
 * 可运行示例：展示源码并即时编译右侧预览。
 * 示例内容由文档数据提供，并在测试中统一编译，保证页面不会出现失效代码。
 */
const props = withDefaults(
  defineProps<{
    title: string
    code: string
    note?: string
    language?: DocCodeLanguage
  }>(),
  {
    note: '',
    language: 'macro',
  },
)

const result = computed(() => {
  try {
    return { scene: compileMacro(props.code), error: '' }
  } catch (reason) {
    return { scene: undefined, error: reason instanceof Error ? reason.message : '示例无法编译。' }
  }
})

const { copied, copy } = useClipboard()
</script>

<template>
  <article class="mdocs-example">
    <header class="mdocs-example-head">
      <span class="mdocs-example-label">{{ props.title }}</span>
      <span v-if="result.scene" class="mdocs-example-result-label">结果</span>
      <button
        class="mdocs-copy-button mdocs-copy-button--light"
        type="button"
        :aria-label="copied ? '已复制示例' : '复制示例'"
        @click="copy(props.code)"
      >
        {{ copied ? '已复制' : '复制' }}
      </button>
    </header>

    <div class="mdocs-example-body">
      <pre
        class="mdocs-example-code"
      ><code><HighlightedCode :code="props.code" :language="props.language" /></code></pre>
      <div class="mdocs-example-preview">
        <template v-if="result.scene">
          <div class="mdocs-preview">
            <MacroGridPreview :scene="result.scene" />
          </div>
          <p class="mdocs-example-stats">{{ result.scene.columns.length }} 列 × {{ result.scene.rows.length }} 行</p>
        </template>
        <p v-else class="mdocs-error">{{ result.error }}</p>
      </div>
    </div>

    <p v-if="props.note" class="mdocs-example-note"><DocText :text="props.note" /></p>
  </article>
</template>
