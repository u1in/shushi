<script setup lang="ts">
import { useClipboard } from './use-clipboard'
import HighlightedCode from './HighlightedCode.vue'
import type { DocCodeLanguage } from '@u1in/shushi-docs/macro/types'

/** 文档中的只读源码块；与示例卡片不同，它不负责编译或预览。 */
const props = withDefaults(defineProps<{ code: string, title?: string, language?: DocCodeLanguage }>(), {
  title: 'MACRO SOURCE',
  language: 'macro',
})

const { copied, copy } = useClipboard()
</script>

<template>
  <div class="mdocs-code">
    <div class="mdocs-code-head">
      <span>{{ props.title }}</span>
      <button class="mdocs-copy-button" type="button" :aria-label="copied ? '已复制源码' : '复制源码'" @click="copy(props.code)">
        {{ copied ? '已复制' : '复制' }}
      </button>
    </div>
    <pre><code><HighlightedCode :code="props.code" :language="props.language" /></code></pre>
  </div>
</template>
