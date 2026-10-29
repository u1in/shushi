<script setup lang="ts">
import { computed, ref } from 'vue'
import { computeMultiplication } from '@vertical-arithmetic/calculators'
import { createMultiplicationGridScene } from '@vertical-arithmetic/layout'
import GridPreview from './GridPreview.vue'
import type { MultiplicationComputation } from '@vertical-arithmetic/calculators'
import type { GridScene } from '@vertical-arithmetic/grid'

const multiplicand = ref('97')
const multiplier = ref('89')
const mode = ref<'dom' | 'svg' | 'both'>('both')
const cellWidth = ref(30)
const rowHeight = ref(46)
const fontSizeRatio = ref(1)
const showGuideGrid = ref(false)
const uniformMultiplicationBars = ref(false)
const showCarrySteps = ref(true)
const error = ref('')
const computation = ref<MultiplicationComputation>()
const scene = ref<GridScene>()
const answer = computed(() => computation.value?.productDigits ?? '—')

const calculate = (): void => {
  try {
    const result = computeMultiplication(multiplicand.value, multiplier.value)
    computation.value = result
    scene.value = createMultiplicationGridScene(result, {
      cellWidth: cellWidth.value,
      rowHeight: rowHeight.value,
      fontSizeRatio: fontSizeRatio.value,
      showGuideGrid: showGuideGrid.value,
      uniformMultiplicationBars: uniformMultiplicationBars.value,
      showCarrySteps: showCarrySteps.value,
    })
    error.value = ''
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '输入无法计算，请检查格式。'
  }
}

calculate()
</script>

<template>
  <div class="operation-demo operation-demo--multiplication" data-operation="multiplication">
    <p class="naming-map-link"><RouterLink to="/multiplication-elements">查看乘法竖式物件命名图谱 →</RouterLink></p>
    <section class="workspace" aria-label="乘法竖式工作区">
      <form class="control-panel" @submit.prevent="calculate">
        <div class="input-grid">
          <label class="field"><span>被乘数</span><input v-model="multiplicand" inputmode="numeric" autocomplete="off" /></label>
          <span class="division-operator" aria-hidden="true">×</span>
          <label class="field"><span>乘数</span><input v-model="multiplier" inputmode="numeric" autocomplete="off" /></label>
        </div>
        <div class="form-actions">
          <button class="primary-button" type="submit">生成竖式</button>
          <button class="ghost-button" type="button" @click="multiplicand = '97'; multiplier = '89'; calculate()">试试 97 × 89</button>
        </div>
        <p class="error-message" role="alert">{{ error }}</p>
        <div class="settings-panel">
          <div class="settings-controls">
            <label class="range-field"><span>方格宽度 <output>{{ cellWidth }}px</output></span><input v-model.number="cellWidth" type="range" min="28" max="56" @input="calculate" /></label>
            <label class="range-field"><span>行高 <output>{{ rowHeight }}px</output></span><input v-model.number="rowHeight" type="range" min="36" max="64" @input="calculate" /></label>
            <label class="range-field"><span>字号比例 <output>{{ fontSizeRatio.toFixed(2) }}</output></span><input v-model.number="fontSizeRatio" type="range" min="0.5" max="1.5" step="0.01" @input="calculate" /></label>
            <label class="switch-field"><input v-model="showGuideGrid" type="checkbox" @change="calculate" /><span class="switch-ui" aria-hidden="true"></span><span>显示辅助网格</span></label>
            <label class="switch-field"><input v-model="uniformMultiplicationBars" type="checkbox" @change="calculate" /><span class="switch-ui" aria-hidden="true"></span><span>乘法横线等宽</span></label>
            <label class="switch-field"><input v-model="showCarrySteps" type="checkbox" @change="calculate" /><span class="switch-ui" aria-hidden="true"></span><span>显示进位步骤</span></label>
          </div>
        </div>
      </form>
      <section class="result-card" aria-live="polite">
        <div class="calculation-result">
          <div class="result-heading"><div><p class="panel-kicker">CALCULATION</p><h2>{{ multiplicand }} × {{ multiplier }}</h2></div><output class="answer">{{ answer }}</output></div>
          <p class="normalization">{{ computation?.operandsSwapped ? '为便于竖式展示，较大操作数已置于上方。' : '按从右到左的逐位乘法计算。' }}</p>
          <fieldset class="renderer-mode-group" aria-label="渲染模式"><legend>渲染模式</legend><label v-for="item in ['svg', 'dom', 'both']" :key="item" class="render-mode-option"><input v-model="mode" type="radio" :value="item" /><span>{{ item === 'both' ? '两者' : item === 'dom' ? 'div + CSS' : 'SVG' }}</span></label></fieldset>
          <GridPreview v-if="scene" :scene="scene" :mode="mode" />
        </div>
      </section>
    </section>
  </div>
</template>
