<script setup lang="ts">
import { useClipboard } from './use-clipboard'

/** 文档中的只读源码块；与示例卡片不同，它不负责编译或预览。 */
const props = withDefaults(defineProps<{ code: string, title?: string }>(), {
  title: 'MACRO SOURCE',
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
    <pre><code>{{ props.code }}</code></pre>
  </div>
</template>
