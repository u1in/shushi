<script setup lang="ts">
import DivisionCalculator from '../components/DivisionCalculator.vue'
import MultiplicationCalculator from '../components/MultiplicationCalculator.vue'
import AdditionCalculator from '../components/AdditionCalculator.vue'
import SubtractionCalculator from '../components/SubtractionCalculator.vue'
import ShortDivisionCalculator from '../components/ShortDivisionCalculator.vue'
import MacroPlayground from '../components/MacroPlayground.vue'
</script>

<template>
  <main class="page-shell">
    <header class="mb-2 flex items-center justify-end gap-4 text-sm font-bold">
      <RouterLink to="/macro-rules" class="text-slate-500 transition hover:text-blue-700">宏语言参考</RouterLink>
      <span class="text-slate-300" aria-hidden="true">/</span>
      <RouterLink to="/macro-api" class="text-slate-500 transition hover:text-emerald-700">技术文档</RouterLink>
    </header>

    <section class="hero">
      <p class="eyebrow">@u1in/shushi · SVG · DOM</p>
      <h1>@u1in/shushi</h1>
      <p class="intro">用于展示加法、减法、乘法、除法和短除法的计算过程与竖式；每种运算均提供可缩放的过程网格。</p>
    </section>

    <MacroPlayground />
    <AdditionCalculator />
    <SubtractionCalculator />
    <MultiplicationCalculator />
    <DivisionCalculator />
    <ShortDivisionCalculator />
  </main>
</template>
