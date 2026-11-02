<script setup lang="ts">
import { computed, ref } from 'vue'
import { extractVisibleTextRows } from '@u1in/shushi-grid'
import type { GridScene } from '@u1in/shushi-grid'

const props = defineProps<{ scene: GridScene }>()
/** 首页默认展开 OCR 结果；场景更新时保持展开并实时刷新按行内容。 */
const isOpen = ref(true)
const rows = computed(() => extractVisibleTextRows(props.scene))
</script>

<template>
  <section class="ocr-panel visible-text-rows" aria-label="OCR 按行结果">
    <p class="panel-kicker">OCR</p>
    <h2>按行识别结果</h2>
    <button
      class="ghost-button visible-text-rows__button"
      type="button"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      {{ isOpen ? '隐藏 OCR 按行结果' : '查看 OCR 按行结果' }}
    </button>
    <div v-if="isOpen" class="visible-text-rows__output" aria-live="polite">
      <p>extractVisibleTextRows(scene) 返回：</p>
      <pre>{{ JSON.stringify(rows, null, 2) }}</pre>
    </div>
  </section>
</template>
