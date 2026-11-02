<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { compileMacro, formatMacro } from '@vertical-arithmetic/macro'
import MacroGridPreview from './MacroGridPreview.vue'
import DocText from './DocText.vue'

/**
 * 页内“补全代码”练习。
 * 学生先修改 starter，右侧实时编译；点击“补全代码”会填入参考写法。
 * 默认比较编译后的 GridScene，因此换行和空格不会影响结果；
 * 只要求改写源码结构的练习可传 mode="source"，改为比较去空白后的源码。
 */
const props = withDefaults(defineProps<{
  title: string
  task: string
  starter: string
  answer: string
  hint?: string
  mode?: 'scene' | 'source'
}>(), {
  mode: 'scene',
})

const source = ref(props.starter)

// 文档页面复用同一个组件实例，切换页面时必须把编辑器重置为新练习。
watch(() => props.starter, (value) => {
  source.value = value
})

const result = computed(() => {
  try {
    return { scene: compileMacro(source.value), error: '' }
  } catch (reason) {
    return { scene: undefined, error: reason instanceof Error ? reason.message : '宏源码无法编译。' }
  }
})

const answerScene = computed(() => {
  try {
    return compileMacro(props.answer)
  } catch {
    return undefined
  }
})

const normalizeSource = (value: string): string => value.replace(/\s+/g, '')

const isComplete = computed(() => {
  if (props.mode === 'source') {
    return normalizeSource(source.value) === normalizeSource(props.answer)
  }
  if (!result.value.scene || !answerScene.value) return false
  return JSON.stringify(result.value.scene) === JSON.stringify(answerScene.value)
})

const fillAnswer = (): void => {
  source.value = props.answer
}

const resetPractice = (): void => {
  source.value = props.starter
}

/** 源码不完整时格式化会失败；保留原文，让编译错误继续提示具体位置。 */
const formatSource = (): void => {
  try {
    source.value = formatMacro(source.value)
  } catch {
    // 保留用户正在编辑的内容。
  }
}
</script>

<template>
  <section class="mdocs-sandbox" :class="{ 'is-complete': isComplete }">
    <header class="mdocs-sandbox-head">
      <div>
        <p class="mdocs-sandbox-kicker">TRY IT YOURSELF</p>
        <h3>{{ props.title }}</h3>
      </div>
      <span class="mdocs-sandbox-status" :class="{ 'is-complete': isComplete }">
        {{ isComplete ? '已完成参考写法' : '练习中' }}
      </span>
    </header>

    <p class="mdocs-sandbox-task"><DocText :text="props.task" /></p>

    <div class="mdocs-sandbox-grid">
      <div class="mdocs-sandbox-editor">
        <div class="mdocs-sandbox-toolbar">
          <span>编辑源码</span>
          <div>
            <button type="button" class="mdocs-ghost-button" @click="formatSource">格式化</button>
            <button type="button" class="mdocs-ghost-button" :disabled="isComplete" @click="fillAnswer">补全代码</button>
            <button type="button" class="mdocs-ghost-button" @click="resetPractice">还原练习</button>
          </div>
        </div>
        <textarea
          v-model="source"
          class="mdocs-sandbox-input"
          spellcheck="false"
          aria-label="练习源码输入框"
        ></textarea>
        <p v-if="result.error" class="mdocs-error" role="alert">{{ result.error }}</p>
        <p v-else class="mdocs-success">编译通过 · {{ result.scene?.columns.length }} 列 × {{ result.scene?.rows.length }} 行</p>
        <details v-if="props.hint" class="mdocs-sandbox-hint">
          <summary>需要一点提示？</summary>
          <p><DocText :text="props.hint" /></p>
        </details>
      </div>

      <div class="mdocs-sandbox-preview">
        <div v-if="result.scene" class="mdocs-preview">
          <MacroGridPreview :scene="result.scene" />
        </div>
        <div v-else class="mdocs-sandbox-placeholder">
          <strong>等待可编译的源码</strong>
          <span>修正左侧错误后，预览会自动刷新。</span>
        </div>
      </div>
    </div>
  </section>
</template>
