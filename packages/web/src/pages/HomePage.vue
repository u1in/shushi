<script setup lang="ts">
import DivisionCalculator from '../components/DivisionCalculator.vue'
import MultiplicationCalculator from '../components/MultiplicationCalculator.vue'
import AdditionCalculator from '../components/AdditionCalculator.vue'
import SubtractionCalculator from '../components/SubtractionCalculator.vue'
import ShortDivisionCalculator from '../components/ShortDivisionCalculator.vue'
import MacroPlayground from '../components/MacroPlayground.vue'
import MacroAstInspector from '../components/MacroAstInspector.vue'
import ThemeControl from '../components/ThemeControl.vue'
</script>

<template>
  <main class="page-shell">
    <section class="hero">
      <div class="hero-topline">
        <p class="eyebrow">@u1in/shushi · SVG · DOM</p>
        <ThemeControl />
      </div>
      <h1>竖式运算的可视化工作台</h1>
      <p class="intro">用于展示加法、减法、乘法、除法和短除法的计算过程与竖式；每种运算均提供可缩放的过程网格。</p>
    </section>

    <MacroPlayground />
    <MacroAstInspector />
    <AdditionCalculator />
    <SubtractionCalculator />
    <MultiplicationCalculator />
    <DivisionCalculator />
    <ShortDivisionCalculator />
  </main>
</template>
