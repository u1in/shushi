<script setup lang="ts">
import { computed } from 'vue'
import type { DocCodeLanguage } from '@vertical-arithmetic/docs/macro/types'

interface CodeToken {
  text: string
  className?: string
}

const props = withDefaults(defineProps<{
  code: string
  language?: DocCodeLanguage
}>(), {
  language: 'macro',
})

const keywordSets: Record<DocCodeLanguage, Set<string>> = {
  macro: new Set(['GRID', 'ROW', 'CELL', 'EMPTY', 'LINE', 'DIV', 'VALUE', 'STYLE', 'KV', 'MM', 'RB', 'MT']),
  typescript: new Set(['as', 'const', 'document', 'export', 'from', 'function', 'import', 'interface', 'new', 'return', 'type', 'const', 'string', 'number', 'boolean', 'void']),
  css: new Set(['position', 'absolute', 'background', 'color', 'display', 'font-family', 'font-size', 'font-weight', 'line-height', 'white-space']),
  text: new Set(),
}

/** 将代码切成安全的 token，模板使用文本插值，因此不会执行代码或注入 HTML。 */
const tokenize = (code: string, language: DocCodeLanguage): CodeToken[] => {
  const tokens: CodeToken[] = []
  const keywords = keywordSets[language]
  let index = 0

  while (index < code.length) {
    const rest = code.slice(index)
    const comment = rest.match(/^\/\/[^\n]*|^\/\*[\s\S]*?\*\//)
    if (comment) {
      tokens.push({ text: comment[0], className: 'code-token-comment' })
      index += comment[0].length
      continue
    }

    const quoted = rest.match(/^(?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)/)
    if (quoted) {
      tokens.push({ text: quoted[0], className: 'code-token-string' })
      index += quoted[0].length
      continue
    }

    const number = rest.match(/^\b\d+(?:\.\d+)?\b/)
    if (number) {
      tokens.push({ text: number[0], className: 'code-token-number' })
      index += number[0].length
      continue
    }

    const identifier = rest.match(/^[A-Za-z_$][A-Za-z0-9_$-]*/)
    if (identifier) {
      const word = identifier[0]
      const followedByCall = /^\s*\(/.test(rest.slice(word.length))
      const className = followedByCall
        ? 'code-token-function'
        : keywords.has(word) ? 'code-token-keyword' : undefined
      tokens.push({ text: word, className })
      index += word.length
      continue
    }

    tokens.push({ text: code[index], className: undefined })
    index += 1
  }

  return tokens
}

const tokens = computed(() => tokenize(props.code, props.language))
</script>

<template>
  <span v-for="(token, index) in tokens" :key="index" :class="token.className">{{ token.text }}</span>
</template>
