<script setup lang="ts">
import { computed } from 'vue'

/**
 * 极小的行内排版器：把反引号包住的内容渲染成 code，把 **...** 渲染成粗体。
 * 文档正文仍然保持纯文本数据，避免在内容文件里手写 HTML。
 */
const props = defineProps<{ text: string }>()

interface TextSegment {
  code: boolean
  bold: boolean
  value: string
}

const segments = computed<TextSegment[]>(() => props.text
  .split(/(\*\*[^*]+\*\*|`[^`]*`)/g)
  .filter((part) => part.length > 0)
  .map((part) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return { code: false, bold: true, value: part.slice(2, -2) }
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return { code: true, bold: false, value: part.slice(1, -1) }
    }
    return { code: false, bold: false, value: part }
  }))
</script>

<template>
  <template v-for="(segment, index) in segments" :key="index">
    <code v-if="segment.code" class="mdocs-inline-code">{{ segment.value }}</code>
    <strong v-else-if="segment.bold">{{ segment.value }}</strong>
    <template v-else>{{ segment.value }}</template>
  </template>
</template>
