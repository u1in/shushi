<script setup lang="ts">
import { ref, watch } from 'vue'

type ThemeMode = 'light' | 'dark'

const storageKey = 'shushi-theme-mode'
const themeMode = ref<ThemeMode>('light')
let mediaQuery: MediaQueryList | undefined

const resolveSystemTheme = (): ThemeMode => mediaQuery?.matches ? 'dark' : 'light'

/** 读取已保存的显式选择；首次访问或旧版 system 值都按系统偏好初始化。 */
const readThemeMode = (): ThemeMode => {
  try {
    const stored = window.localStorage.getItem(storageKey)
    return stored === 'light' || stored === 'dark' ? stored : resolveSystemTheme()
  } catch {
    return resolveSystemTheme()
  }
}

/** 将当前显式主题写入 html 属性并保存，后续进入页面可恢复用户选择。 */
const applyTheme = (mode: ThemeMode): void => {
  const root = document.documentElement
  root.dataset.theme = mode
  try {
    window.localStorage.setItem(storageKey, mode)
  } catch {
    // 隐私模式下本地存储可能不可用，但主题仍然应该即时切换。
  }
}

mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
themeMode.value = readThemeMode()
watch(themeMode, applyTheme, { immediate: true })

const themeOptions: Array<{ value: ThemeMode; label: string; icon: string }> = [
  { value: 'light', label: '浅色', icon: '☼' },
  { value: 'dark', label: '深色', icon: '☾' },
]

</script>

<template>
  <div class="theme-control" aria-label="主题模式">
    <div class="theme-control__options" role="group" aria-label="选择主题模式">
      <button
        v-for="option in themeOptions"
        :key="option.value"
        type="button"
        class="theme-control__button"
        :class="{ 'theme-control__button--active': themeMode === option.value }"
        :aria-pressed="themeMode === option.value"
        :title="`${option.label}模式`"
        @click="themeMode = option.value"
      >
        <span aria-hidden="true">{{ option.icon }}</span>
        <span>{{ option.label }}</span>
      </button>
    </div>
  </div>
</template>
