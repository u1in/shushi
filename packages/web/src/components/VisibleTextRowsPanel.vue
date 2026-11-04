<script setup lang="ts">
import { nextTick, ref, useId } from 'vue'
import { extractVisibleTextRows } from '@u1in/shushi-grid'
import type { GridScene } from '@u1in/shushi-grid'

const props = defineProps<{ scene: GridScene }>()
const isOpen = ref(false)
const rows = ref<string[]>([])
const dialog = ref<HTMLElement>()
const dialogTitleId = useId()

/** 只有用户明确打开弹窗时才提取 OCR 行结果，避免页面初始渲染就执行该 API。 */
const openDialog = async (): Promise<void> => {
  rows.value = extractVisibleTextRows(props.scene)
  isOpen.value = true
  await nextTick()
  dialog.value?.focus()
}

const closeDialog = (): void => {
  isOpen.value = false
}
</script>

<template>
  <span class="visible-text-rows">
    <button
      class="outline-button visible-text-rows__button"
      type="button"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      @click="openDialog"
    >
      查看 OCR 结果
    </button>
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="dialog"
        class="ocr-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="dialogTitleId"
        tabindex="-1"
        @click.self="closeDialog"
        @keydown.esc.prevent="closeDialog"
      >
        <section class="ocr-modal__content">
          <div class="ocr-modal__header">
            <div>
              <p class="panel-kicker">OCR</p>
              <h2 :id="dialogTitleId">按行识别结果</h2>
            </div>
            <button class="ocr-modal__close" type="button" aria-label="关闭 OCR 结果" @click="closeDialog">×</button>
          </div>
          <div class="visible-text-rows__output" aria-live="polite">
            <p>extractVisibleTextRows(scene) 返回：</p>
            <pre>{{ JSON.stringify(rows, null, 2) }}</pre>
          </div>
          <div class="ocr-modal__actions">
            <button class="outline-button" type="button" @click="closeDialog">关闭</button>
          </div>
        </section>
      </div>
    </Teleport>
  </span>
</template>
