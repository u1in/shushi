<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { minifyMacro } from '@u1in/shushi-macro'

const props = defineProps<{
  source: string
}>()

const copyState = ref<'idle' | 'copied' | 'error'>('idle')
let resetTimer: ReturnType<typeof setTimeout> | undefined

/** 优先使用 Clipboard API，非安全上下文再退回到浏览器原生复制命令。 */
const writeClipboard = async (text: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) throw new Error('浏览器拒绝了复制操作。')
}

/** 复制当前竖式对应的最简宏源码，并给出短暂的结果反馈。 */
const copyMacro = async (): Promise<void> => {
  try {
    await writeClipboard(minifyMacro(props.source))
    copyState.value = 'copied'
  } catch {
    copyState.value = 'error'
  }
  if (resetTimer) clearTimeout(resetTimer)
  resetTimer = setTimeout(() => {
    copyState.value = 'idle'
  }, 1600)
}

const label = computed(() => copyState.value === 'copied' ? '已复制宏命令' : copyState.value === 'error' ? '复制失败，请重试' : '复制宏命令')

onBeforeUnmount(() => {
  if (resetTimer) clearTimeout(resetTimer)
})
</script>

<template>
  <button class="primary-button step-playback__button copy-macro-button" type="button" :aria-label="label" @click="copyMacro">{{ label }}</button>
</template>
