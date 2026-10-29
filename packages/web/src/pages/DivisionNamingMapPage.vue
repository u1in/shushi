<script setup lang="ts">
import { computeDivision } from '@vertical-arithmetic/calculators'
import { createDivisionGridScene } from '@vertical-arithmetic/layout'
import NamingMapGrid from '../components/NamingMapGrid.vue'
import type { NamingMapItem } from '../components/NamingMapGrid.vue'

const computation = computeDivision('25', '10230', { resultMode: 'decimal' })
const scene = createDivisionGridScene(computation, {
  cellWidth: 46,
  rowHeight: 60,
  fontSizeRatio: 0.82,
  bracketBend: 1,
  showGuideGrid: true,
  uniformSubtractionBars: false,
  showZeroQuotientSteps: false,
})

const items: NamingMapItem[] = [
  { key: '01', name: '商 · Quotient', description: '除法计算得到的结果，逐位写在被除数上方。', token: 'division.quotient', tone: 'tone-blue', source: 'text' },
  { key: '02', name: '小数点 · Decimal point', description: '整数部分和小数部分之间的分隔点。', token: 'division.decimal-separator', tone: 'tone-blue', source: 'text' },
  { key: '03', name: '除数 · Divisor', description: '用来进行除法的数。', token: 'division.divisor', tone: 'tone-blue', source: 'text' },
  { key: '04', name: '厂字弯 · Division bracket bend', description: '连接除数和被除数的弯曲部分。', token: 'division.bracket', tone: 'tone-blue', source: 'cell' },
  { key: '05', name: '厂字横 · Division bracket top bar', description: '从厂字弯向右延伸的横线。', token: 'division.bracket-top-line', tone: 'tone-blue', source: 'cell' },
  { key: '06', name: '被除数 · Dividend', description: '要被相除的数。', token: 'division.dividend', tone: 'tone-ink', source: 'text' },
  { key: '07', name: '补零列 · Appended zero', description: '计算小数时，在被除数末尾补上的零。', token: 'division.appended-zero', tone: 'tone-muted', source: 'text' },
  { key: '08', name: '部分减数 · Partial subtrahend', description: '除数乘本轮商位得到的乘积。', token: 'division.partial-subtrahend', tone: 'tone-green', source: 'text', rows: true },
  { key: '09', name: '部分被减数 · Partial minuend', description: '继续落下并参与本轮减法的数。', token: 'division.partial-minuend', tone: 'tone-partial', source: 'text', rows: true },
  { key: '10', name: '减法线 · Subtraction bar', description: '部分减数下方表示减法的横线。', token: 'division.subtraction-bar', tone: 'tone-subtraction', source: 'edge' },
  { key: '11', name: '余数 · Remainder', description: '全部计算完成后剩下的数。', token: 'division.remainder', tone: 'tone-partial', source: 'text' },
  { key: '12', name: '辅助网格 · Guide grid', description: '帮助观察数字列和行位置的参考网格。', token: 'guide-grid', tone: 'tone-grid', source: 'scene' },
]

const notes = [
  ['divisorDigits', '规范化后的除数。'], ['dividendDigits', '规范化后的被除数。'], ['quotientText', '最终显示的商。'],
  ['quotientTokens', '商的语义 token 数组；数字和小数点各自占据显示列。'], ['quotientTokens.kind', '`digit` 表示商数字，`decimalSeparator` 表示小数点。'],
  ['quotientTokens.digit', '该列显示的字符；小数分隔符固定为 `.`。'], ['quotientTokens.column', '该 token 的显示列。'],
  ['steps', '从左到右的逐步除法过程。'], ['steps.dividendColumn', '本轮商位对应的被除数列。'], ['steps.divisor', '本轮使用的除数。'],
  ['steps.quotientDigit', '本轮得到的商位。'], ['steps.partialDividend', '本轮参与计算的部分被除数。'], ['steps.product', '除数乘本轮商位得到的乘积。'], ['steps.remainder', '本轮相减后的余数。'],
  ['remainder', '全部计算完成后的最终余数。'], ['hasFraction', '是否得到有限小数。'],
  ['decimalFallback', '小数循环或超出上限时是否退回余数模式。'], ['fractionalDigitCount', '成功的小数位数量。'],
  ['digitColumnCount', '被除数和补零后的总列数。'], ['integerStartColumn', '第一位有效整数商所在的列。'],
]
</script>

<template>
  <main class="mx-auto min-h-screen w-[min(1660px,calc(100%-40px))] py-16">
    <RouterLink to="/" class="text-sm font-bold text-blue-700 hover:underline">← 返回首页</RouterLink>
    <p class="eyebrow mt-8">VERTICAL DIVISION · VUE NAMING MAP</p>
    <h1>竖式元素命名图谱</h1>
    <p class="intro">彩色框和目录均由 Vue 组件驱动；线框仍根据真实 `GridScene` 单元格计算。</p>

    <section class="mt-7">
      <NamingMapGrid :scene="scene" :items="items" />
    </section>

    <section class="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
      <h2 class="text-xl font-bold text-slate-800">除法器结果</h2>
      <p class="mt-2 text-sm leading-6 text-slate-500">10230 ÷ 25 的计算器输出；字段注释与 `DivisionComputation` 契约保持一致。</p>
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
