<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { extractVisibleTextRows } from '@vertical-arithmetic/grid'
import type { GridScene } from '@vertical-arithmetic/grid'

const props = defineProps<{ scene: GridScene }>()
const isOpen = ref(false)
const rows = computed(() => extractVisibleTextRows(props.scene))

// 算式或播放进度改变会生成新场景，关闭旧结果以免用户误认它仍对应当前竖式。
watch(() => props.scene, () => { isOpen.value = false })
</script>

<template>
  <section class="visible-text-rows" aria-label="OCR 按行结果">
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
