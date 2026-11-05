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
      计算可见行
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
              <p :id="dialogTitleId" class="panel-kicker">计算可见行</p>
            </div>
            <button class="ocr-modal__close" type="button" aria-label="关闭计算可见行" @click="closeDialog">×</button>
          </div>
          <div class="visible-text-rows__description">
            <p>下面的结果按行整理竖式中实际显示的文字，方便和 OCR（图片文字识别）结果对比。</p>
            <p>进位和借位会单独占一行，即使它们在排版上属于数字行的一部分。</p>
            <p>因此，分行结果可能和你看到的竖式分组略有不同，这是正常的。</p>
          </div>
          <div class="visible-text-rows__output" aria-live="polite">
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
