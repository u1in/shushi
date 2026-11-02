<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { compileMacro, formatMacro, minifyMacro } from '@u1in/shushi-macro'
import GridPreview from './GridPreview.vue'
import VisibleTextRowsPanel from './VisibleTextRowsPanel.vue'
import { arithmeticExamples, formatExampleSource, type MacroExample } from './macroPlaygroundExamples'

const source = ref(formatExampleSource(arithmeticExamples[0].source))
const sourceTextarea = ref<HTMLTextAreaElement>()
/** 快速插入模板默认收起，避免挤占宏源码编辑区。 */
const isInsertOpen = ref(false)

interface MacroSnippet {
  label: string
  source: string
  /** 插入后光标应停留在模板的哪个字符之后。 */
  cursorOffset: number
  title: string
}

interface MacroSnippetGroup {
  label: string
  snippets: MacroSnippet[]
}

const macroSnippetGroups: MacroSnippetGroup[] = [
  {
    label: '结构',
    snippets: [
      { label: 'GRID', source: 'GRID(),', cursorOffset: 5, title: '插入公式网格根节点' },
      { label: 'CELL', source: 'CELL(),', cursorOffset: 5, title: '组合一个单元格中的图元' },
      { label: '[]', source: '[],', cursorOffset: 1, title: '用方括号组合一个单元格中的图元' },
      { label: 'ROW', source: 'ROW(),', cursorOffset: 4, title: '插入数字行' },
      { label: 'LN', source: 'LN,', cursorOffset: 3, title: '插入 LINE 行级横线别名' },
      { label: 'DIV', source: 'DIV,', cursorOffset: 4, title: '插入短除法分割边界（自动切换半格模式）' },
      { label: 'VALUE', source: 'VALUE(),', cursorOffset: 6, title: '插入短除法右侧数值组' },
    ],
  },
  {
    label: '文本定位',
    snippets: [
      { label: 'LT', source: 'LT(),', cursorOffset: 3, title: '单元格左上文本' },
      { label: 'MT', source: 'MT(),', cursorOffset: 3, title: '单元格中上文本' },
      { label: 'MTD', source: 'MTD,', cursorOffset: 4, title: '单元格中上借位点简写（等价 MT(·)）' },
      { label: 'RT', source: 'RT(),', cursorOffset: 3, title: '单元格右上文本' },
      { label: 'ML', source: 'ML(),', cursorOffset: 3, title: '单元格左中文本' },
      { label: 'MM', source: 'MM(),', cursorOffset: 3, title: '单元格中心文本' },
      { label: 'MR', source: 'MR(),', cursorOffset: 3, title: '单元格右中文本' },
      { label: 'LB', source: 'LB(),', cursorOffset: 3, title: '单元格左下文本' },
      { label: 'MB', source: 'MB(),', cursorOffset: 3, title: '单元格中下文本' },
      { label: 'RB', source: 'RB(),', cursorOffset: 3, title: '单元格右下角文本，可用于进位标记' },
      { label: 'RBL', source: 'RBL(),', cursorOffset: 4, title: '右边界文字行框位置' },
    ],
  },
  {
    label: '几何符号',
    snippets: [
      { label: '▢', source: 'MM(▢),', cursorOffset: 6, title: '插入方框符号' },
      { label: '★', source: 'MM(★),', cursorOffset: 6, title: '插入星星符号' },
      { label: '☾', source: 'MM(☾),', cursorOffset: 6, title: '插入月亮符号' },
      { label: '♡', source: 'MM(♡),', cursorOffset: 6, title: '插入爱心符号' },
      { label: '△', source: 'MM(△),', cursorOffset: 6, title: '插入三角符号' },
      { label: '○', source: 'MM(○),', cursorOffset: 6, title: '插入圆形符号' },
      { label: '◆', source: 'MM(◆),', cursorOffset: 6, title: '插入菱形符号' },
      { label: '✦', source: 'MM(✦),', cursorOffset: 6, title: '插入闪光符号' },
    ],
  },
  {
    label: '特殊变量',
    snippets: [
      { label: 'DOT', source: 'DOT,', cursorOffset: 4, title: '右边界小数点简写' },
      { label: 'EP', source: 'EP,', cursorOffset: 3, title: '插入 EMPTY 空单元格别名' },
      { label: 'BK', source: 'BK,', cursorOffset: 3, title: '插入 BRACKET 厂字弯别名' },
    ],
  },
  {
    label: '边框装饰',
    snippets: [
      { label: 'TBD', source: 'TBD,', cursorOffset: 4, title: '单元格上边框' },
      { label: 'RBD', source: 'RBD,', cursorOffset: 4, title: '单元格右边框' },
      { label: 'BBD', source: 'BBD,', cursorOffset: 4, title: '单元格下边框' },
      { label: 'LBD', source: 'LBD,', cursorOffset: 4, title: '单元格左边框' },
    ],
  },
  {
    label: '样式配置',
    snippets: [
      { label: 'STYLE', source: 'STYLE(),', cursorOffset: 6, title: '插入受限跨渲染器样式' },
      { label: 'KV', source: 'KV(key, value),', cursorOffset: 3, title: '插入配置键值对' },
    ],
  },
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

/** 切换示例时同样展示格式化源码，保证每个示例的默认视图都可读。 */
const useExample = ({ source: exampleSource }: MacroExample): void => {
  source.value = formatExampleSource(exampleSource)
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
        <p class="normalization">支持 GRID、ROW、CELL、九宫格定位宏、DOT、BRACKET、LINE、DIV、VALUE、STYLE 与 KV；短除法只需在 ROW 中写 DIV，编译器会自动切换半格阶梯，无需 KV(trackUnit, half)。顶层分号行可直接写中心文字，方括号仅首项可省略 MM，编译器会自动补齐 ROW 与无配置的 GRID。载入示例时会自动按函数层级格式化源码。</p>
        <div class="macro-insert-toolbar" aria-label="快速插入宏">
          <div class="macro-insert-header">
            <span>快速插入</span>
            <button class="macro-insert-button" type="button" :aria-expanded="isInsertOpen" aria-controls="macro-insert-groups" @click="isInsertOpen = !isInsertOpen">{{ isInsertOpen ? '收起' : '展开' }}</button>
          </div>
          <div v-show="isInsertOpen" id="macro-insert-groups" class="macro-insert-groups">
            <div v-for="group in macroSnippetGroups" :key="group.label" class="macro-insert-group">
              <span class="macro-insert-group-label">{{ group.label }}</span>
              <button v-for="snippet in group.snippets" :key="snippet.label" class="macro-insert-button" type="button" :title="snippet.title" @click="insertSnippet(snippet)">{{ snippet.label }}</button>
            </div>
          </div>
        </div>
        <div class="macro-format-toolbar" aria-label="格式化宏源码">
          <span>格式化</span>
          <button class="macro-insert-button" type="button" @click="formatSource">格式化</button>
          <button class="macro-insert-button" type="button" @click="minifySource">最简化</button>
        </div>
        <label class="macro-source-field">
          <span>宏源码</span>
          <textarea ref="sourceTextarea" v-model="source" spellcheck="false" aria-label="宏源码输入框"></textarea>
        </label>
        <div class="form-actions">
          <span class="macro-example-label">示例</span>
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
        </div>
        <div v-else class="calculation-result">
          <p class="panel-kicker">COMPILATION ERROR</p>
          <h2>请修正宏源码后预览</h2>
        </div>
      </section>
      <VisibleTextRowsPanel v-if="result.scene" :scene="result.scene" />
    </section>
  </div>
</template>
