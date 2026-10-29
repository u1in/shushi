<script setup lang="ts">
import { computeMultiplication } from '@vertical-arithmetic/calculators'
import { createMultiplicationGridScene } from '@vertical-arithmetic/layout'
import NamingMapGrid from '../components/NamingMapGrid.vue'
import type { NamingMapItem } from '../components/NamingMapGrid.vue'

const computation = computeMultiplication('97', '89')
const scene = createMultiplicationGridScene(computation, {
  cellWidth: 64,
  rowHeight: 72,
  fontSizeRatio: 0.8,
  showGuideGrid: true,
  uniformMultiplicationBars: false,
  showCarrySteps: true,
})

const items: NamingMapItem[] = [
  { key: '01', name: '被乘数 · Multiplicand', description: '规范化后放在第一行的较大操作数。', token: 'multiplication.multiplicand', tone: 'tone-ink', source: 'text' },
  { key: '02', name: '乘数 · Multiplier', description: '放在第二行、与被乘数相乘的操作数。', token: 'multiplication.multiplier', tone: 'tone-blue', source: 'text' },
  { key: '03', name: '乘号 · Multiplication sign', description: '乘数行最左侧的 ×。', token: 'multiplication.operator', tone: 'tone-blue', source: 'text', badgeClass: 'naming-map-highlight--badge-left' },
  { key: '04', name: '乘法横线 · Input bar', description: '乘数下方的第一条横线。', token: 'multiplication.input-bar', tone: 'tone-blue', source: 'edge' },
  { key: '05', name: '部分积 · Partial product', description: '每个乘数位乘被乘数得到的中间结果。', token: 'multiplication.partial-product', tone: 'tone-green', source: 'text', rows: true },
  { key: '06', name: '本位进位 · Carry', description: '逐位相乘传给下一高位的进位。', token: 'multiplication.carry', tone: 'tone-carry', source: 'rendered-text', badgeClass: 'naming-map-highlight--badge-left' },
  { key: '07', name: '加法进位 · Addition carry', description: '部分积按列相加时传给下一列的进位。', token: 'multiplication.addition-carry', tone: 'tone-addcarry', source: 'rendered-text', badgeClass: 'naming-map-highlight--badge-left' },
  { key: '08', name: '求和横线 · Sum bar', description: '最后一个部分积下方、最终积上方的横线。', token: 'multiplication.sum-bar', tone: 'tone-sum', source: 'edge' },
  { key: '09', name: '最终积 · Product', description: '所有部分积按列相加得到的结果。', token: 'multiplication.product', tone: 'tone-product', source: 'text' },
  { key: '10', name: '辅助网格 · Guide grid', description: '帮助观察数字列、行和错位位置的参考网格。', token: 'guide-grid', tone: 'tone-grid', source: 'scene' },
]

const notes = [
  ['multiplicandDigits', '规范化并放在第一行的被乘数（较大操作数）。'], ['multiplierDigits', '规范化并放在第二行的乘数（较小操作数）。'],
  ['operandsSwapped', '输入顺序是否因“大数在上”而交换。'], ['productDigits', '最终积。'],
  ['partialProducts', '每个乘数位一项，包含乘数位、位移、部分积和逐位过程。'], ['partialProducts.shift', '十进制错位；个位为 0、十位为 1。'],
  ['partialProducts.value', '未补位、未乘 10^shift 的部分积数字。'], ['partialProducts.digitSteps', '逐位乘法过程，包含每一步的输入、结果和进位。'],
  ['additionSteps', '部分积按列相加的过程与进位。'], ['additionSteps.carryOut', '传给下一列的进位；最高位进位会显示在求和横线上。'],
]
</script>

<template>
  <main class="mx-auto min-h-screen w-[min(1660px,calc(100%-40px))] py-16">
    <RouterLink to="/" class="text-sm font-bold text-blue-700 hover:underline">← 返回首页</RouterLink>
    <p class="eyebrow mt-8">VERTICAL MULTIPLICATION · VUE NAMING MAP</p>
    <h1>乘法竖式元素命名图谱</h1>
    <p class="intro">图谱的选中状态由 Vue 管理；网格与高亮边界仍来自同一份乘法 `GridScene`。</p>

    <section class="mt-7">
      <NamingMapGrid :scene="scene" :items="items" />
    </section>

    <section class="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
      <h2 class="text-xl font-bold text-slate-800">乘法器结果</h2>
      <p class="mt-2 text-sm leading-6 text-slate-500">97 × 89 的计算器输出；字段注释与 `MultiplicationComputation` 契约保持一致。</p>
      <details class="mt-4 border-t border-slate-200 pt-3" open>
        <summary class="cursor-pointer font-bold text-blue-800">字段注释</summary>
        <dl class="mt-3 grid gap-x-4 gap-y-2 text-sm md:grid-cols-[max-content_1fr]">
          <template v-for="[field, description] in notes" :key="field"><dt class="font-mono font-bold text-blue-700">{{ field }}</dt><dd class="text-slate-600">{{ description }}</dd></template>
        </dl>
      </details>
      <pre class="mt-5 max-h-[37.5rem] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-700">{{ JSON.stringify(computation, null, 2) }}</pre>
    </section>
  </main>
</template>
