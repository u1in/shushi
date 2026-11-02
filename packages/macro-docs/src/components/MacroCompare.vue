<script setup lang="ts">
import { computed } from 'vue'
import { compileMacro } from '@vertical-arithmetic/macro'
import MacroGridPreview from './MacroGridPreview.vue'
import HighlightedCode from './HighlightedCode.vue'
import DocText from './DocText.vue'

/**
 * 完整宏 / 简化宏 / 结果纵向对照。
 * 默认要求两组输出完全一致；个别简写带有额外的配色语义时，
 * 可显式标记 equivalent=false，让页面如实说明“位置等价但输出不同”。
 */
const props = withDefaults(defineProps<{
  leftTitle: string
  leftCode: string
  rightTitle: string
  rightCode: string
  note?: string
  equivalent?: boolean
}>(), {
  note: '',
  equivalent: true,
})

const compile = (code: string) => {
  try {
    return { scene: compileMacro(code), error: '' }
  } catch (reason) {
    return { scene: undefined, error: reason instanceof Error ? reason.message : '源码无法编译。' }
  }
}

const left = computed(() => compile(props.leftCode))
const right = computed(() => compile(props.rightCode))
/** 结果栏优先复用完整宏的场景；完整宏失败时退回简化宏，保证错误示例也有可见反馈。 */
const result = computed(() => left.value.scene ?? right.value.scene)
const resultError = computed(() => left.value.scene ? '' : right.value.error)
const outputsMatch = computed(() => Boolean(
  left.value.scene
  && right.value.scene
  && JSON.stringify(left.value.scene) === JSON.stringify(right.value.scene),
))

const badgeText = computed(() => {
  if (!props.equivalent) return '位置等价 · 输出不同'
  return outputsMatch.value ? '输出等价 ✓' : '输出有差异'
})
</script>

<template>
  <section class="mdocs-compare">
    <div class="mdocs-compare-grid">
      <article class="mdocs-compare-card">
        <div class="mdocs-compare-card-head">
          <h4>{{ props.leftTitle }}</h4>
        </div>
        <pre class="mdocs-compare-code"><code><HighlightedCode :code="props.leftCode" language="macro" /></code></pre>
      </article>

      <article class="mdocs-compare-card">
        <div class="mdocs-compare-card-head">
          <h4>{{ props.rightTitle }}</h4>
        </div>
        <pre class="mdocs-compare-code"><code><HighlightedCode :code="props.rightCode" language="macro" /></code></pre>
      </article>

      <article class="mdocs-compare-card mdocs-compare-result">
        <div class="mdocs-compare-card-head">
          <h4>结果</h4>
          <span
            class="mdocs-compare-badge"
            :class="{ 'is-mismatch': props.equivalent && !outputsMatch, 'is-semantic': !props.equivalent }"
          >
            {{ badgeText }}
          </span>
        </div>
        <div class="mdocs-compare-preview">
          <div v-if="result" class="mdocs-preview">
            <MacroGridPreview :scene="result" />
          </div>
          <p v-else class="mdocs-error">{{ resultError }}</p>
        </div>
      </article>
    </div>

    <p v-if="props.note" class="mdocs-compare-note"><DocText :text="props.note" /></p>
  </section>
</template>
