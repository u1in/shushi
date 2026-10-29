<script setup lang="ts">
import DivisionCalculator from '../components/DivisionCalculator.vue'
import MultiplicationCalculator from '../components/MultiplicationCalculator.vue'
</script>

<template>
  <main class="page-shell">
    <section class="hero">
      <p class="eyebrow">VERTICAL ARITHMETIC · SVG · DOM</p>
      <h1>小学竖式项目</h1>
      <p class="intro">用于展示小学四则运算的计算过程与竖式；当前提供可缩放的长除法和乘法竖式。</p>
    </section>

    <DivisionCalculator />
    <MultiplicationCalculator />
  </main>
</template>
