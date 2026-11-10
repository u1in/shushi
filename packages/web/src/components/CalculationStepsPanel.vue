<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId } from 'vue'

const props = defineProps<{
  computation: unknown
}>()

const isOpen = ref(false)
const dialog = ref<HTMLElement>()
const dialogTitleId = useId()
const copyState = ref<'idle' | 'copied' | 'error'>('idle')
let resetTimer: ReturnType<typeof setTimeout> | undefined

/** 只展示同一份过程契约及精简结果，避免把布局辅助字段复制进检查 JSON。 */
const computationJson = computed(() => {
  const computation = props.computation
  if (!computation || typeof computation !== 'object' || !('calculationSteps' in computation))
    return JSON.stringify(computation, null, 2) ?? '暂无计算数据'
  const { calculationSteps, ...rawResult } = computation as { calculationSteps: unknown; [key: string]: unknown }
  const resultKeys = [
    'sumText',
    'resultText',
    'productText',
    'quotientText',
    'resultDigits',
    'finalValues',
    'factorizationText',
    'gcd',
    'lcm',
    'convertedText',
    'remainder',
  ]
  const result = Object.fromEntries(resultKeys.flatMap((key) => (key in rawResult ? [[key, rawResult[key]]] : [])))
  return JSON.stringify({ steps: calculationSteps, result }, null, 2)
})

const openDialog = async (): Promise<void> => {
  isOpen.value = true
  await nextTick()
  dialog.value?.focus()
}

const closeDialog = (): void => {
  isOpen.value = false
}

/** 优先使用 Clipboard API，非安全上下文再回退到浏览器原生复制命令。 */
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

const copyJson = async (): Promise<void> => {
  try {
    await writeClipboard(computationJson.value)
    copyState.value = 'copied'
  } catch {
    copyState.value = 'error'
  }
  if (resetTimer) clearTimeout(resetTimer)
  resetTimer = setTimeout(() => {
    copyState.value = 'idle'
  }, 1600)
}

const copyLabel = computed(() =>
  copyState.value === 'copied' ? '已复制 JSON' : copyState.value === 'error' ? '复制失败，请重试' : '复制 JSON',
)

onBeforeUnmount(() => {
  if (resetTimer) clearTimeout(resetTimer)
})
</script>

<template>
  <span class="calculation-steps-panel">
    <button
      class="outline-button step-playback__button"
      type="button"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      @click="openDialog"
    >
      查看计算步骤
    </button>
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="dialog"
        class="ocr-modal calculation-steps-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="dialogTitleId"
        tabindex="-1"
        @click.self="closeDialog"
        @keydown.esc.prevent="closeDialog"
      >
        <section class="ocr-modal__content calculation-steps-modal__content">
          <div class="ocr-modal__header">
            <div>
              <p :id="dialogTitleId" class="panel-kicker">查看计算步骤</p>
              <p class="calculation-steps__description">
                这是计算、播放和检查共用的步骤
                JSON。数组下标即步骤序号；每项只含本步已经发生的数据，后面只保留精简结果。
              </p>
            </div>
            <button class="ocr-modal__close" type="button" aria-label="关闭计算步骤" @click="closeDialog">×</button>
          </div>
          <div class="calculation-steps__output" aria-live="polite">
            <div class="calculation-steps__toolbar">
              <button
                class="calculation-steps__copy"
                type="button"
                :aria-label="copyLabel"
                :title="copyLabel"
                @click="copyJson"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <rect x="8" y="8" width="11" height="11" rx="2" />
                  <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                </svg>
                <span class="visually-hidden">{{ copyLabel }}</span>
              </button>
            </div>
            <div class="calculation-steps__body">
              <pre>{{ computationJson }}</pre>
            </div>
          </div>
          <div class="ocr-modal__actions">
            <button class="outline-button" type="button" @click="closeDialog">关闭</button>
          </div>
        </section>
      </div>
    </Teleport>
  </span>
</template>
