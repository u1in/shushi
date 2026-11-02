<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ source: string }>()
const copied = ref(false)

/** 自动计算出的源码与人工录入使用完全相同的宏语法，可直接复制复刻。 */
const copySource = async (): Promise<void> => {
  await navigator.clipboard?.writeText(props.source)
  copied.value = true
  window.setTimeout(() => { copied.value = false }, 1600)
}
</script>

<template>
  <details v-if="source" class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
    <summary class="cursor-pointer text-sm font-bold text-slate-700">可复刻的竖式宏源码</summary>
    <p class="mt-2 text-xs text-slate-600">此源码由计算过程自动填写；复制到“网格宏试验区”会经过同一编译路径得到相同竖式。</p>
    <pre class="mt-2 max-h-48 overflow-auto rounded-lg bg-white p-3 text-xs leading-5 text-slate-800"><code>{{ source }}</code></pre>
    <button class="ghost-button mt-2" type="button" @click="copySource">{{ copied ? '已复制' : '复制宏源码' }}</button>
  </details>
</template>
