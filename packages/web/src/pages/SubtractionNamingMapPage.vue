<script setup lang="ts">
import { computeSubtraction } from '@vertical-arithmetic/calculators'
import { createSubtractionGridScene } from '@vertical-arithmetic/layout'
import NamingMapGrid from '../components/NamingMapGrid.vue'
import RendererDataPanel from '../components/RendererDataPanel.vue'
import type { NamingMapItem } from '../components/NamingMapGrid.vue'

const computation = computeSubtraction('502', '137')
const scene = createSubtractionGridScene(computation, { cellWidth: 64, rowHeight: 72, fontSizeRatio: 0.8, showGuideGrid: true, showBorrowSteps: true })
const items: NamingMapItem[] = [
  { key: '01', name: '被减数 · Minuend', description: '竖式主行中参与展示的工作被减数。', token: 'subtraction.minuend', tone: 'tone-ink', source: 'text' },
  { key: '02', name: '借位提示 · Borrow', description: '显示在被借位数字上方的中点 ·。', token: 'subtraction.borrow', tone: 'tone-carry', source: 'rendered-text', badgeClass: 'naming-map-highlight--badge-left' },
  { key: '03', name: '减数 · Subtrahend', description: '从被减数中减去的数。', token: 'subtraction.subtrahend', tone: 'tone-green', source: 'text' },
  { key: '04', name: '减号 · Subtraction sign', description: '减数行左侧的 −。', token: 'subtraction.operator', tone: 'tone-blue', source: 'text' },
  { key: '05', name: '减法横线 · Difference bar', description: '减数下方、差上方的横线。', token: 'subtraction.difference-bar', tone: 'tone-subtraction', source: 'edge' },
  { key: '06', name: '差 · Difference', description: '逐位相减后的结果。', token: 'subtraction.difference', tone: 'tone-product', source: 'text' },
  { key: '07', name: '辅助网格 · Guide grid', description: '观察同位对齐与连续借位的参考网格。', token: 'guide-grid', tone: 'tone-grid', source: 'scene' },
]
const notes = [
  ['minuendDigits / subtrahendDigits', '原始、规范化后的被减数和减数。'], ['workingMinuendDigits / workingSubtrahendDigits', '真正执行“大数减小数”过程的两个数；负结果时会交换。'],
  ['differenceDigits / resultText', '差的绝对值与最终显示结果（负数含 −）。'], ['isNegative', '原始被减数是否小于减数。'],
    ['steps', '从个位到最高位的逐列相减过程。'], ['steps.minuendDisplay', '借位后实际参与本列相减的中间数字；可为 10 至 18。'], ['steps.borrowIn / borrowOut', '由低位传入和向高位借出的借位标志。'],
]
</script>

<template>
  <main class="mx-auto min-h-screen w-[min(1660px,calc(100%-40px))] py-16">
    <RouterLink to="/" class="text-sm font-bold text-blue-700 hover:underline">← 返回首页</RouterLink>
    <p class="eyebrow mt-8">VERTICAL SUBTRACTION · VUE NAMING MAP</p><h1>减法竖式元素命名图谱</h1>
    <p class="intro">连续借位后的 4、9、12 保留在减法过程数据中；竖式主行显示原始工作被减数。</p>
    <section class="mt-7"><NamingMapGrid :scene="scene" :items="items" /></section>
    <section class="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50"><h2 class="text-xl font-bold text-slate-800">减法器结果</h2>
      <p class="mt-2 text-sm leading-6 text-slate-500">502 − 137 的计算器输出；字段注释与 `SubtractionComputation` 契约保持一致。</p>
      <details class="mt-4 border-t border-slate-200 pt-3" open><summary class="cursor-pointer font-bold text-blue-800">字段注释</summary><dl class="mt-3 grid gap-x-4 gap-y-2 text-sm md:grid-cols-[max-content_1fr]"><template v-for="[field, description] in notes" :key="field"><dt class="font-mono font-bold text-blue-700">{{ field }}</dt><dd class="text-slate-600">{{ description }}</dd></template></dl></details>
      <pre class="mt-5 max-h-[37.5rem] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-700">{{ JSON.stringify(computation, null, 2) }}</pre>
    </section>
    <RendererDataPanel :scene="scene" />
  </main>
</template>
