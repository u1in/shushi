import { onBeforeUnmount, ref } from 'vue'

/**
 * 文档中的代码块共用同一套复制反馈：点击后短暂显示“已复制”，
 * 浏览器拒绝剪贴板权限时保持原按钮文案，不抛错打断阅读。
 */
export const useClipboard = (duration = 1600) => {
  const copied = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  const copy = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text)
      copied.value = true
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => { copied.value = false }, duration)
    } catch {
      copied.value = false
    }
  }

  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer)
  })

  return { copied, copy }
}
