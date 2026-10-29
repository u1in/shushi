<script setup lang="ts">
import DivisionCalculator from '../components/DivisionCalculator.vue'
import MultiplicationCalculator from '../components/MultiplicationCalculator.vue'
import AdditionCalculator from '../components/AdditionCalculator.vue'
import SubtractionCalculator from '../components/SubtractionCalculator.vue'
</script>

<template>
  <main class="page-shell">
    <section class="hero">
      <p class="eyebrow">VERTICAL ARITHMETIC · SVG · DOM</p>
      <h1>四则运算竖式项目</h1>
      <p class="intro">用于展示四则运算的计算过程与竖式；每种运算均提供可缩放的过程网格。</p>
    </section>

    <AdditionCalculator />
    <SubtractionCalculator />
    <DivisionCalculator />
    <MultiplicationCalculator />
  </main>
</template>
