<script setup lang="ts">
import { nextTick, ref, useId } from 'vue'
import { AUTO_COLOR_THEME_VARIABLES } from '@u1in/shushi-core'

export type AutoColorThemeColorValues = {
  text: string
  carry: string
  borrow: string
  operator: string
  decimal: string
  rule: string
  bracketRule: string
}

const props = defineProps<{
  modelValue: AutoColorThemeColorValues
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AutoColorThemeColorValues]
}>()

type ThemeColorKey = keyof AutoColorThemeColorValues
type ThemeColorEntry = {
  key: ThemeColorKey
  label: string
  description: string
  variable: string
}

const entries: ThemeColorEntry[] = [
  { key: 'text', label: '普通数字', description: '普通数字与未分类文字', variable: AUTO_COLOR_THEME_VARIABLES.text },
  { key: 'carry', label: '进位', description: 'RB 进位提示', variable: AUTO_COLOR_THEME_VARIABLES.carry },
  { key: 'borrow', label: '借位', description: 'MT / MTD 借位提示', variable: AUTO_COLOR_THEME_VARIABLES.borrow },
  { key: 'operator', label: '运算符', description: '加减乘除运算符', variable: AUTO_COLOR_THEME_VARIABLES.operator },
  { key: 'decimal', label: '小数点', description: 'DOT 与小数点', variable: AUTO_COLOR_THEME_VARIABLES.decimal },
  { key: 'rule', label: '普通线条', description: '横线、边框与短除法分割线', variable: AUTO_COLOR_THEME_VARIABLES.rule },
  { key: 'bracketRule', label: '厂字线条', description: '除法厂字弯与厂字横', variable: AUTO_COLOR_THEME_VARIABLES.bracketRule },
]

const isOpen = ref(false)
const draft = ref<AutoColorThemeColorValues>({ ...props.modelValue })
const dialog = ref<HTMLElement>()
const dialogTitleId = useId()

const openDialog = async (): Promise<void> => {
  draft.value = { ...props.modelValue }
  isOpen.value = true
  await nextTick()
  dialog.value?.focus()
}

const closeDialog = (): void => {
  isOpen.value = false
}

const applyTheme = (): void => {
  emit('update:modelValue', { ...draft.value })
  closeDialog()
}
</script>

<template>
  <span class="auto-color-theme-editor">
    <button
      class="outline-button auto-color-theme-editor__trigger"
      type="button"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      @click="openDialog"
    >
      修改颜色
    </button>
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="dialog"
        class="ocr-modal auto-color-theme-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="dialogTitleId"
        tabindex="-1"
        @click.self="closeDialog"
        @keydown.esc.prevent="closeDialog"
      >
        <section class="ocr-modal__content auto-color-theme-modal__content">
          <div class="ocr-modal__header">
            <div>
              <p :id="dialogTitleId" class="panel-kicker">修改颜色</p>
              <p class="auto-color-theme-modal__hint">每个颜色都会写入对应 CSS 变量，并立即作用于当前预览区。</p>
            </div>
            <button class="ocr-modal__close" type="button" aria-label="关闭颜色编辑" @click="closeDialog">×</button>
          </div>
          <div class="auto-color-theme-editor__fields">
            <label v-for="entry in entries" :key="entry.key" class="auto-color-theme-editor__field">
              <span class="auto-color-theme-editor__label">
                <strong>{{ entry.label }}</strong>
                <small>{{ entry.description }}</small>
              </span>
              <input v-model="draft[entry.key]" type="color" :aria-label="`修改${entry.label}颜色`" />
              <code>{{ draft[entry.key] }}</code>
              <small class="auto-color-theme-editor__variable">{{ entry.variable }}</small>
            </label>
          </div>
          <div class="ocr-modal__actions">
            <button class="outline-button" type="button" @click="closeDialog">取消</button>
            <button class="primary-button" type="button" @click="applyTheme">确定应用</button>
          </div>
        </section>
      </div>
    </Teleport>
  </span>
</template>
