<script setup lang="ts">
import { computed } from 'vue'
import { compileMacro } from '@vertical-arithmetic/macro'
import MacroGridPreview from './MacroGridPreview.vue'
import DocText from './DocText.vue'

/**
 * 完整版 / 语法糖版并排对照。
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
    <div class="mdocs-compare-head">
      <span class="mdocs-compare-kicker">SOURCE COMPARISON</span>
      <span
        class="mdocs-compare-badge"
        :class="{ 'is-mismatch': props.equivalent && !outputsMatch, 'is-semantic': !props.equivalent }"
      >
        {{ badgeText }}
      </span>
    </div>

    <div class="mdocs-compare-grid">
      <article class="mdocs-compare-card">
        <header>
          <h4>{{ props.leftTitle }}</h4>
          <span v-if="left.scene">{{ left.scene.columns.length }} 列 × {{ left.scene.rows.length }} 行</span>
        </header>
        <pre class="mdocs-compare-code"><code>{{ props.leftCode }}</code></pre>
        <div class="mdocs-compare-preview">
          <div v-if="left.scene" class="mdocs-preview">
            <MacroGridPreview :scene="left.scene" />
          </div>
          <p v-else class="mdocs-error">{{ left.error }}</p>
        </div>
      </article>

      <article class="mdocs-compare-card">
        <header>
          <h4>{{ props.rightTitle }}</h4>
          <span v-if="right.scene">{{ right.scene.columns.length }} 列 × {{ right.scene.rows.length }} 行</span>
        </header>
        <pre class="mdocs-compare-code"><code>{{ props.rightCode }}</code></pre>
        <div class="mdocs-compare-preview">
          <div v-if="right.scene" class="mdocs-preview">
            <MacroGridPreview :scene="right.scene" />
          </div>
          <p v-else class="mdocs-error">{{ right.error }}</p>
        </div>
      </article>
    </div>

    <p v-if="props.note" class="mdocs-compare-note"><DocText :text="props.note" /></p>
  </section>
</template>
