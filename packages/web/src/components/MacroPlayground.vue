<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { compileMacro, formatMacro, minifyMacro } from '@vertical-arithmetic/macro'
import GridPreview from './GridPreview.vue'
import VisibleTextRowsPanel from './VisibleTextRowsPanel.vue'

interface MacroExample {
  label: string
  source: string
}

/** 与主页下方四则运算器的默认题目对应；GRID 默认启用自动配色，因此无需额外配置。 */
const arithmeticExamples: MacroExample[] = [
  {
    label: '356 + 278 = 634',
    source: 'ROW(MM(3),MM(5),MM(6)),ROW(MM(+),CELL(MM(2),RB(1)),CELL(MM(7),RB(1)),MM(8)),LINE,ROW(MM(6),MM(3),MM(4))',
  },
  {
    label: '502 − 137 = 365',
    source: 'ROW(CELL(MM(5),MT(·)),CELL(MM(0),MT(·)),MM(2)),ROW(MM(−),MM(1),MM(3),MM(7)),LINE,ROW(MM(3),MM(6),MM(5))',
  },
  {
    label: '97 × 89 = 8633',
    source: 'ROW(MM(9),MM(7)),ROW(MM(×),CELL(MM(8),RB(6)),MM(9)),LINE(KV(span,full)),ROW(MM(8),MM(7),MM(3)),ROW(CELL(MM(7),RB(1)),CELL(MM(7),RB(1)),CELL(MM(6),LT(5)),EMPTY),LINE(KV(span,full)),ROW(MM(8),MM(6),MM(3),MM(3))',
  },
  {
    label: '10230 ÷ 25 = 409.2',
    source: 'ROW(MM(4),MM(0),CELL(MM(9),DOT),MM(2)),ROW(MM(2),MM(5),BRACKET,MM(1),MM(0),MM(2),MM(3),MM(0),MM(0)),ROW(MM(1),MM(0),MM(0),EMPTY,EMPTY,EMPTY),LINE,ROW(MM(2),MM(3),MM(0),EMPTY),ROW(MM(2),MM(2),MM(5),EMPTY),LINE,ROW(MM(5),MM(0)),ROW(MM(5),MM(0)),LINE,ROW(MM(0))',
  },
]

const source = ref(arithmeticExamples[0].source)
const sourceTextarea = ref<HTMLTextAreaElement>()

interface MacroSnippet {
  label: string
  source: string
  /** 插入后光标应停留在模板的哪个字符之后。 */
  cursorOffset: number
  title: string
}

const macroSnippets: MacroSnippet[] = [
  { label: 'GRID', source: 'GRID()', cursorOffset: 5, title: '插入公式网格根节点' },
  { label: 'MM', source: 'MM()', cursorOffset: 3, title: '单元格中心文本' },
  { label: 'MT', source: 'MT()', cursorOffset: 3, title: '单元格中上文本' },
  { label: 'RB', source: 'RB()', cursorOffset: 3, title: '单元格右下角文本，可用于进位标记' },
  { label: 'RBL', source: 'RBL()', cursorOffset: 4, title: '右边界文字行框位置' },
  { label: 'DOT', source: 'DOT', cursorOffset: 3, title: '右边界小数点简写' },
  { label: 'BRACKET', source: 'BRACKET', cursorOffset: 7, title: '插入半列宽的厂字弯' },
  { label: 'CELL', source: 'CELL()', cursorOffset: 5, title: '组合一个单元格中的图元' },
  { label: 'ROW', source: 'ROW()', cursorOffset: 4, title: '插入数字行' },
  { label: 'LINE', source: 'LINE', cursorOffset: 4, title: '插入行级横线' },
  { label: 'STYLE', source: 'STYLE()', cursorOffset: 6, title: '插入受限跨渲染器样式' },
  { label: 'KV', source: 'KV(key, value)', cursorOffset: 3, title: '插入配置键值对' },
  { label: 'TBD', source: 'TBD', cursorOffset: 3, title: '单元格上边框' },
  { label: 'RBD', source: 'RBD', cursorOffset: 3, title: '单元格右边框' },
  { label: 'BBD', source: 'BBD', cursorOffset: 3, title: '单元格下边框' },
  { label: 'LBD', source: 'LBD', cursorOffset: 3, title: '单元格左边框' },
]

/** 在选择区替换或光标处插入宏模板，避免用户反复手输基础语法。 */
const insertSnippet = async ({ source: snippet, cursorOffset }: MacroSnippet): Promise<void> => {
  const textarea = sourceTextarea.value
  const selectionStart = textarea?.selectionStart ?? source.value.length
  const selectionEnd = textarea?.selectionEnd ?? selectionStart
  source.value = `${source.value.slice(0, selectionStart)}${snippet}${source.value.slice(selectionEnd)}`
  await nextTick()
  textarea?.focus()
  const cursor = selectionStart + cursorOffset
  textarea?.setSelectionRange(cursor, cursor)
}

/** 输入在每次变更后立即编译；错误保留在输入区而不会影响既有运算器。 */
const result = computed(() => {
  try {
    return { scene: compileMacro(source.value), error: '' }
  } catch (reason) {
    return { scene: undefined, error: reason instanceof Error ? reason.message : '宏源码无法编译。' }
  }
})

const useExample = ({ source: exampleSource }: MacroExample): void => {
  source.value = exampleSource
}

/** 格式化失败时保留原源码，让现有编译错误继续提示用户修正输入。 */
const transformSource = (transform: (value: string) => string): void => {
  try {
    source.value = transform(source.value)
  } catch {
    // 源码不完整时不改写输入，避免用户丢失正在编辑的内容。
  }
}

const formatSource = (): void => transformSource(formatMacro)
const minifySource = (): void => transformSource(minifyMacro)
</script>

<template>
  <div class="operation-demo macro-playground" data-operation="macro">
    <section class="workspace" aria-label="公式宏试验区">
      <section class="control-panel">
        <p class="panel-kicker">MACRO PLAYGROUND</p>
        <h2>网格宏试验区</h2>
        <p class="normalization">支持 GRID、ROW、CELL、九宫格定位宏、DOT、BRACKET、LINE、STYLE 与 KV；未指定列数时按最长行自动推导。自动配色默认开启，也可直接省略无配置的 GRID。</p>
        <div class="macro-insert-toolbar" aria-label="快速插入宏">
          <span>快速插入</span>
          <button v-for="snippet in macroSnippets" :key="snippet.label" class="macro-insert-button" type="button" :title="snippet.title" @click="insertSnippet(snippet)">{{ snippet.label }}</button>
        </div>
        <div class="macro-format-toolbar" aria-label="格式化宏源码">
          <span>格式化</span>
          <button class="macro-insert-button" type="button" @click="formatSource">格式化</button>
          <button class="macro-insert-button" type="button" @click="minifySource">去格式化</button>
        </div>
        <label class="macro-source-field">
          <span>宏源码</span>
          <textarea ref="sourceTextarea" v-model="source" spellcheck="false" aria-label="宏源码输入框"></textarea>
        </label>
        <div class="form-actions">
          <span class="macro-example-label">四则示例</span>
          <button v-for="example in arithmeticExamples" :key="example.label" class="ghost-button macro-example-button" type="button" @click="useExample(example)">{{ example.label }}</button>
        </div>
        <p class="error-message" role="alert">{{ result.error }}</p>
      </section>
      <section class="result-card" aria-live="polite">
        <div v-if="result.scene" class="calculation-result">
          <div class="result-heading">
            <div>
              <p class="panel-kicker">COMPILED GRID SCENE</p>
              <h2>已推导 {{ result.scene.columns.length }} 列、{{ result.scene.rows.length }} 行</h2>
            </div>
          </div>
          <GridPreview :scene="result.scene" mode="both" />
          <VisibleTextRowsPanel :scene="result.scene" />
        </div>
        <div v-else class="calculation-result">
          <p class="panel-kicker">COMPILATION ERROR</p>
          <h2>请修正宏源码后预览</h2>
        </div>
      </section>
    </section>
  </div>
</template>
