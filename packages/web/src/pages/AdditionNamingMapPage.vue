<script setup lang="ts">
import { computeAddition } from '@vertical-arithmetic/calculators'
import { createAdditionGridScene } from '@vertical-arithmetic/layout'
import NamingMapGrid from '../components/NamingMapGrid.vue'
import RendererDataPanel from '../components/RendererDataPanel.vue'
import type { NamingMapItem } from '../components/NamingMapGrid.vue'

const computation = computeAddition('356', '278')
const scene = createAdditionGridScene(computation, { cellWidth: 64, rowHeight: 72, fontSizeRatio: 0.8, showGuideGrid: true, showCarrySteps: true })
const items: NamingMapItem[] = [
  { key: '01', name: '加数 · Addend', description: '参与相加且按个位右对齐的数。', token: 'addition.addend', tone: 'tone-ink', source: 'text', rows: true },
  { key: '02', name: '加号 · Addition sign', description: '最后一个加数行左侧的 +。', token: 'addition.operator', tone: 'tone-blue', source: 'text' },
  { key: '03', name: '进位 · Carry', description: '本列满十后传给前一位的 1。', token: 'addition.carry', tone: 'tone-carry', source: 'rendered-text', badgeClass: 'naming-map-highlight--badge-left' },
  { key: '04', name: '加法横线 · Sum bar', description: '加数下方、和上方的横线。', token: 'addition.sum-bar', tone: 'tone-sum', source: 'edge' },
  { key: '05', name: '和 · Sum', description: '所有加数按列相加得到的结果。', token: 'addition.sum', tone: 'tone-product', source: 'text' },
  { key: '06', name: '辅助网格 · Guide grid', description: '观察数位对齐和进位位置的参考网格。', token: 'guide-grid', tone: 'tone-grid', source: 'scene' },
]
const notes = [
  ['addendDigits', '规范化后的加数字符串数组；可含两个或多个加数。'], ['sumDigits', '去掉前导 0 后的最终和。'],
  ['steps', '从个位到最高位的按列加法过程。'], ['steps.columnFromRight', '从个位起算的零基数位。'],
  ['steps.addendDigits', '各加数在本列参与相加的数字；缺失位按 0 计算。'], ['steps.carryIn / carryOut', '来自低位和传给高位的进位。'],
]
</script>

<template>
  <main class="mx-auto min-h-screen w-[min(1660px,calc(100%-40px))] py-16">
    <RouterLink to="/" class="text-sm font-bold text-blue-700 hover:underline">← 返回首页</RouterLink>
    <p class="eyebrow mt-8">VERTICAL ADDITION · VUE NAMING MAP</p><h1>加法竖式元素命名图谱</h1>
    <p class="intro">进位、横线和数字都来自同一份加法 `GridScene`。</p>
    <section class="mt-7"><NamingMapGrid :scene="scene" :items="items" /></section>
    <section class="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50"><h2 class="text-xl font-bold text-slate-800">加法器结果</h2>
      <p class="mt-2 text-sm leading-6 text-slate-500">356 + 278 的计算器输出；字段注释与 `AdditionComputation` 契约保持一致。</p>
      <details class="mt-4 border-t border-slate-200 pt-3" open><summary class="cursor-pointer font-bold text-blue-800">字段注释</summary><dl class="mt-3 grid gap-x-4 gap-y-2 text-sm md:grid-cols-[max-content_1fr]"><template v-for="[field, description] in notes" :key="field"><dt class="font-mono font-bold text-blue-700">{{ field }}</dt><dd class="text-slate-600">{{ description }}</dd></template></dl></details>
      <pre class="mt-5 max-h-[37.5rem] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-700">{{ JSON.stringify(computation, null, 2) }}</pre>
    </section>
    <RendererDataPanel :scene="scene" />
  </main>
</template>
