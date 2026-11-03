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
      <p class="intro">这是一个可交互的竖式计算与宏语言工作台：支持宏源码编译、AST 图元点击修改、SVG 与 DOM/CSS 双渲染对照、OCR 按行识别，以及加法、减法、乘法、除法和短除法的逐步演示；网格尺寸、步骤和主题均可调整。</p>
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
