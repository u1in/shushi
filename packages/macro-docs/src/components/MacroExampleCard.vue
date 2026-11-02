<script setup lang="ts">
import { computed } from 'vue'
import { compileMacro } from '@vertical-arithmetic/macro'
import MacroGridPreview from './MacroGridPreview.vue'
import DocText from './DocText.vue'
import { useClipboard } from './use-clipboard'

/**
 * 可运行示例：左侧源码、右侧 SVG 预览。
 * 示例内容由文档数据提供，并在测试中统一编译，保证页面不会出现失效代码。
 */
const props = withDefaults(defineProps<{
  title: string
  code: string
  note?: string
}>(), {
  note: '',
})

const result = computed(() => {
  try {
    return { scene: compileMacro(props.code), error: '' }
  } catch (reason) {
    return { scene: undefined, error: reason instanceof Error ? reason.message : '示例无法编译。' }
  }
})

const { copied, copy } = useClipboard()
</script>

<template>
  <article class="mdocs-example">
    <header class="mdocs-example-head">
      <div>
        <p class="mdocs-example-kicker">可运行示例</p>
        <h3>{{ props.title }}</h3>
      </div>
      <button class="mdocs-copy-button mdocs-copy-button--light" type="button" :aria-label="copied ? '已复制示例' : '复制示例'" @click="copy(props.code)">
        {{ copied ? '已复制' : '复制' }}
      </button>
    </header>

    <div class="mdocs-example-body">
      <pre class="mdocs-example-code"><code>{{ props.code }}</code></pre>
      <div class="mdocs-example-preview">
        <template v-if="result.scene">
          <div class="mdocs-preview">
            <MacroGridPreview :scene="result.scene" />
          </div>
          <p class="mdocs-example-stats">{{ result.scene.columns.length }} 列 × {{ result.scene.rows.length }} 行</p>
        </template>
        <p v-else class="mdocs-error">{{ result.error }}</p>
      </div>
    </div>

    <p v-if="props.note" class="mdocs-example-note"><DocText :text="props.note" /></p>
  </article>
</template>
