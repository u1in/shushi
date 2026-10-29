<script setup lang="ts">
import { computeShortDivision } from '@vertical-arithmetic/calculators'
import { createShortDivisionGridScene } from '@vertical-arithmetic/layout'
import NamingMapGrid from '../components/NamingMapGrid.vue'
import type { NamingMapItem } from '../components/NamingMapGrid.vue'

const computation = computeShortDivision({ mode: 'baseConversion', values: ['13'], targetBase: 2 })
const scene = createShortDivisionGridScene(computation, {
  cellWidth: 46,
  rowHeight: 60,
  fontSizeRatio: 0.82,
  showGuideGrid: true,
  showRemainders: true,
})

const items: NamingMapItem[] = [
  { key: '01', name: '除数 / 进制', description: '短除法左侧的质数、公共质数或目标进制数。', token: 'short-division.divisor', tone: 'tone-blue', source: 'text' },
  { key: '02', name: '短除竖线', description: '分隔左侧除数和右侧被除数或商的连续竖线。', token: 'short-division.separator', tone: 'tone-blue', source: 'edge' },
  { key: '03', name: '被除数 / 当前商', description: '每一轮右侧参与相除的数。', token: 'short-division.dividend', tone: 'tone-ink', source: 'text', rows: true },
  { key: '04', name: '短除横线', description: '每轮除法后、通向下一行商的横线。', token: 'short-division.bar', tone: 'tone-subtraction', source: 'edge', rows: true },
  { key: '05', name: '余数', description: '进制转换每一步记下的余数，最终须自下向上读取。', token: 'short-division.remainder', tone: 'tone-green', source: 'text', rows: true },
  { key: '06', name: '底行商', description: '流程终止时的商；因用途不同可为质数、互质数或 0。', token: 'short-division.final', tone: 'tone-partial', source: 'text' },
  { key: '07', name: '辅助网格', description: '帮助观察行列对齐的参考网格。', token: 'guide-grid', tone: 'tone-grid', source: 'scene' },
]

const notes = [
  ['mode', '短除法用途：`factorization`、`commonFactor` 或 `baseConversion`。'],
  ['inputValues', '规范化后的输入十进制数字串。'], ['steps', '从上到下的每一轮短除法。'],
  ['steps.divisor', '本轮写在左侧的除数。'], ['steps.dividends', '本轮右侧参与除法的值。'],
  ['steps.quotients', '本轮整数商，视觉上写在下一行。'], ['steps.remainders', '本轮余数；进制转换使用它生成结果。'],
  ['finalValues', '终止条件满足时的底行商。'], ['targetBase', '仅进制转换：目标进制（2–36）。'],
  ['remaindersBottomUp', '仅进制转换：倒序后的余数字符。'], ['convertedText', '仅进制转换：余数倒序拼接的目标进制结果。'],
]
</script>

<template>
  <main class="mx-auto min-h-screen w-[min(1660px,calc(100%-40px))] py-16">
    <RouterLink to="/" class="text-sm font-bold text-blue-700 hover:underline">← 返回首页</RouterLink>
    <p class="eyebrow mt-8">SHORT DIVISION · VUE NAMING MAP</p>
    <h1>短除法元素命名图谱</h1>
    <p class="intro">图谱以 13 转二进制为例；同一版式也承载质因数分解和公因数短除法。</p>
    <section class="mt-7"><NamingMapGrid :scene="scene" :items="items" /></section>
    <section class="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
      <h2 class="text-xl font-bold text-slate-800">短除法器结果</h2>
      <p class="mt-2 text-sm leading-6 text-slate-500">13(十进制) 转二进制的计算器输出；字段说明与 `ShortDivisionComputation` 契约保持一致。</p>
      <details class="mt-4 border-t border-slate-200 pt-3" open><summary class="cursor-pointer font-bold text-blue-800">字段注释</summary><dl class="mt-3 grid gap-x-4 gap-y-2 text-sm md:grid-cols-[max-content_1fr]"><template v-for="[field, description] in notes" :key="field"><dt class="font-mono font-bold text-blue-700">{{ field }}</dt><dd class="text-slate-600">{{ description }}</dd></template></dl></details>
      <pre class="mt-5 max-h-[37.5rem] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-700">{{ JSON.stringify(computation, null, 2) }}</pre>
    </section>
  </main>
</template>
