<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  title: string
  description: string
  code: string
  language?: string
}>(), {
  language: 'typescript',
})

const copyState = ref<'idle' | 'copied' | 'error'>('idle')
let resetTimer: ReturnType<typeof setTimeout> | undefined
const flashedLineIndices = ref<number[]>([])
const flashKey = ref(0)
let flashTimer: ReturnType<typeof setTimeout> | undefined

const escapeHtml = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;')

/** 轻量高亮只处理展示所需的 TypeScript 常见 token，源码仍由原始字符串负责复制。 */
const highlightCode = (code: string): string => {
  const tokenPattern = /\/\/[^\n]*|\/\*[\s\S]*?\*\/|'(?:\\.|[^'])*'|"(?:\\.|[^"])*"|\b(?:import|from|const|let|return|try|catch|if|else|new|as|type|interface|true|false|null|undefined)\b|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*(?=\s*\()/g
  const keywords = new Set(['import', 'from', 'const', 'let', 'return', 'try', 'catch', 'if', 'else', 'new', 'as', 'type', 'interface'])
  const literals = new Set(['true', 'false', 'null', 'undefined'])
  let result = ''
  let cursor = 0

  for (const match of code.matchAll(tokenPattern)) {
    const token = match[0]
    const start = match.index ?? cursor
    result += escapeHtml(code.slice(cursor, start))
    const tokenKind = token.startsWith('//') || token.startsWith('/*')
      ? 'comment'
      : token.startsWith('\'') || token.startsWith('"')
        ? 'string'
        : keywords.has(token)
          ? 'keyword'
          : literals.has(token)
            ? 'literal'
            : /^\d/.test(token)
              ? 'number'
              : 'function'
    result += '<span class="code-token code-token--' + tokenKind + '">' + escapeHtml(token) + '</span>'
    cursor = start + token.length
  }

  return result + escapeHtml(code.slice(cursor))
}

const highlightedCode = computed(() => highlightCode(props.code))
const highlightedLines = computed(() => highlightedCode.value.split('\n'))
const copyLabel = computed(() => copyState.value === 'copied' ? '已复制全部代码' : copyState.value === 'error' ? '复制失败，请重试' : '复制全部代码')

/** 对比前后源码行，只短暂标记发生变化的行，帮助用户定位配置带来的代码变化。 */
watch(() => props.code, (nextCode, previousCode) => {
  if (previousCode === undefined) return

  const nextLines = nextCode.split('\n')
  const previousLines = previousCode.split('\n')
  const changedLines = nextLines.reduce<number[]>((indices, line, index) => {
    if (line !== previousLines[index]) indices.push(index)
    return indices
  }, [])

  if (changedLines.length === 0) return

  flashedLineIndices.value = changedLines
  flashKey.value += 1
  if (flashTimer) clearTimeout(flashTimer)
  flashTimer = setTimeout(() => {
    flashedLineIndices.value = []
  }, 900)
})

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

const copyCode = async (): Promise<void> => {
  try {
    await writeClipboard(props.code)
    copyState.value = 'copied'
  } catch {
    copyState.value = 'error'
  }
  if (resetTimer) clearTimeout(resetTimer)
  resetTimer = setTimeout(() => {
    copyState.value = 'idle'
  }, 1600)
}

onBeforeUnmount(() => {
  if (resetTimer) clearTimeout(resetTimer)
  if (flashTimer) clearTimeout(flashTimer)
})
</script>

<template>
  <section class="code-panel" aria-label="核心实现代码">
    <p class="panel-kicker">CORE IMPLEMENTATION</p>
    <h2>{{ title }}</h2>
    <p class="normalization">{{ description }}</p>
    <div class="code-panel__toolbar">
      <span class="code-panel__language">{{ language }}</span>
      <button class="outline-button code-panel__copy" type="button" :aria-label="copyLabel" @click="copyCode">{{ copyLabel }}</button>
    </div>
    <pre class="code-panel__source"><code><span
      v-for="(line, lineIndex) in highlightedLines"
      :key="flashKey + '-' + lineIndex"
      class="code-panel__line"
      :class="{ 'code-panel__line--changed': flashedLineIndices.includes(lineIndex) }"
      v-html="line"
    ></span></code></pre>
  </section>
</template>
