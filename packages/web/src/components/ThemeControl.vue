<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

type ThemeMode = 'light' | 'dark' | 'system'

const storageKey = 'shushi-theme-mode'
const themeMode = ref<ThemeMode>('system')
const resolvedTheme = ref<'light' | 'dark'>('light')
let mediaQuery: MediaQueryList | undefined

/** 读取用户偏好；无法访问本地存储时回退到跟随系统，避免阻塞首页渲染。 */
const readThemeMode = (): ThemeMode => {
  try {
    const stored = window.localStorage.getItem(storageKey)
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
  } catch {
    return 'system'
  }
}

const resolveSystemTheme = (): 'light' | 'dark' => mediaQuery?.matches ? 'dark' : 'light'

/** 将三态偏好转换成 html 属性；system 通过移除属性交给 prefers-color-scheme。 */
const applyTheme = (mode: ThemeMode): void => {
  const root = document.documentElement
  if (mode === 'system') root.removeAttribute('data-theme')
  else root.dataset.theme = mode
  resolvedTheme.value = mode === 'system' ? resolveSystemTheme() : mode
  try {
    window.localStorage.setItem(storageKey, mode)
  } catch {
    // 隐私模式下本地存储可能不可用，但主题仍然应该即时切换。
  }
}

const handleSystemThemeChange = (): void => {
  if (themeMode.value === 'system') resolvedTheme.value = resolveSystemTheme()
}

mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
mediaQuery.addEventListener('change', handleSystemThemeChange)
themeMode.value = readThemeMode()
watch(themeMode, applyTheme, { immediate: true })
onBeforeUnmount(() => mediaQuery?.removeEventListener('change', handleSystemThemeChange))

const themeOptions: Array<{ value: ThemeMode; label: string; icon: string }> = [
  { value: 'light', label: '浅色', icon: '☼' },
  { value: 'system', label: '系统', icon: '◐' },
  { value: 'dark', label: '深色', icon: '☾' },
]

const currentLabel = computed(() => themeOptions.find(({ value }) => value === themeMode.value)?.label ?? '系统')
</script>

<template>
  <div class="theme-control" aria-label="主题模式">
    <span class="theme-control__label">主题 · {{ currentLabel }}</span>
    <div class="theme-control__options" role="group" aria-label="选择主题模式">
      <button
        v-for="option in themeOptions"
        :key="option.value"
        type="button"
        class="theme-control__button"
        :class="{ 'theme-control__button--active': themeMode === option.value }"
        :aria-pressed="themeMode === option.value"
        :title="`${option.label}模式${option.value === 'system' ? `（当前${resolvedTheme === 'dark' ? '深色' : '浅色'}）` : ''}`"
        @click="themeMode = option.value"
      >
        <span aria-hidden="true">{{ option.icon }}</span>
        <span>{{ option.label }}</span>
      </button>
    </div>
  </div>
</template>
