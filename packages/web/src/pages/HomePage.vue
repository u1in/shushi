<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import DivisionCalculator from '../components/DivisionCalculator.vue'
import MultiplicationCalculator from '../components/MultiplicationCalculator.vue'
import AdditionCalculator from '../components/AdditionCalculator.vue'
import SubtractionCalculator from '../components/SubtractionCalculator.vue'
import ShortDivisionCalculator from '../components/ShortDivisionCalculator.vue'
import CompositeArithmeticCalculator from '../components/CompositeArithmeticCalculator.vue'
import MacroPlayground from '../components/MacroPlayground.vue'
import MacroAstInspector from '../components/MacroAstInspector.vue'
import ThemeControl from '../components/ThemeControl.vue'

const showBackToTop = ref(false)
// 使用相对路径兼容本地根路径与 GitHub Pages 的 /shushi/ 仓库路径。
const docsUrl = './doc/'

// 仅在页面滚动到主要内容区后显示入口，避免首屏增加无用的固定控件。
const updateBackToTopVisibility = (): void => {
  showBackToTop.value = window.scrollY > 480
}

const scrollToTop = (): void => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  updateBackToTopVisibility()
  window.addEventListener('scroll', updateBackToTopVisibility, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateBackToTopVisibility)
})
</script>

<template>
  <header class="site-header">
    <a class="site-header__brand" href="#top" aria-label="返回首页顶部">竖式·Shushi</a>
    <nav class="site-header__nav" aria-label="演示板块导航">
      <a href="#macro-playground">宏试验区</a>
      <a href="#macro-ast-inspector">AST 检查器</a>
      <a href="#addition">加法</a>
      <a href="#subtraction">减法</a>
      <a href="#multiplication">乘法</a>
      <a href="#division">长除法</a>
      <a href="#short-division">短除法</a>
      <a href="#composite-arithmetic">组合竖式</a>
    </nav>
    <ThemeControl />
  </header>

  <main id="top" class="page-shell">
    <section class="hero">
      <div class="hero-topline">
        <p class="eyebrow">竖式·Shushi · SVG · DOM</p>
      </div>
      <h1>竖式·Shushi</h1>
      <p class="intro">竖式运算的可视化工作台：支持宏源码编译、AST 图元点击修改、SVG 与 DOM/CSS 双渲染对照、OCR 按行识别，以及加法、减法、乘法、除法和短除法的逐步演示；网格尺寸、步骤和主题均可调整。</p>
      <nav class="hero-actions" aria-label="相关入口">
        <a class="hero-action-button" :href="docsUrl">查看文档</a>
      </nav>
    </section>

    <MacroPlayground id="macro-playground" />
    <MacroAstInspector id="macro-ast-inspector" />
    <AdditionCalculator id="addition" />
    <SubtractionCalculator id="subtraction" />
    <MultiplicationCalculator id="multiplication" />
    <DivisionCalculator id="division" />
    <ShortDivisionCalculator id="short-division" />
    <CompositeArithmeticCalculator id="composite-arithmetic" />

    <button
      v-if="showBackToTop"
      class="back-to-top"
      type="button"
      aria-label="返回页面顶部"
      @click="scrollToTop"
    >
      <span aria-hidden="true">↑</span>
      <span>返回顶部</span>
    </button>
  </main>
</template>
