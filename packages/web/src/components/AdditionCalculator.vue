<script setup lang="ts">
import { computed, ref } from 'vue'
import { computeAddition } from '@vertical-arithmetic/calculators'
import { createAdditionGridScene } from '@vertical-arithmetic/layout'
import GridPreview from './GridPreview.vue'
import type { AdditionComputation } from '@vertical-arithmetic/calculators'
import type { GridScene } from '@vertical-arithmetic/grid'

const firstAddend = ref('356')
const secondAddend = ref('278')
const cellWidth = ref(30)
const rowHeight = ref(46)
const fontSizeRatio = ref(1)
const showGuideGrid = ref(false)
const showCarrySteps = ref(true)
const error = ref('')
const computation = ref<AdditionComputation>()
const scene = ref<GridScene>()
const answer = computed(() => computation.value?.sumDigits ?? '—')

/** 首页先提供双加数练习；计算器 API 仍支持传入三个及以上加数实现连加。 */
const calculate = (): void => {
  try {
    const result = computeAddition(firstAddend.value, secondAddend.value)
    computation.value = result
    scene.value = createAdditionGridScene(result, {
      cellWidth: cellWidth.value, rowHeight: rowHeight.value, fontSizeRatio: fontSizeRatio.value,
      showGuideGrid: showGuideGrid.value, showCarrySteps: showCarrySteps.value,
    })
    error.value = ''
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '输入无法计算，请检查格式。'
  }
}

calculate()
</script>

<template>
  <div class="operation-demo operation-demo--addition" data-operation="addition">
    <p class="naming-map-link"><RouterLink to="/addition-elements">查看加法竖式物件命名图谱 →</RouterLink></p>
    <section class="workspace" aria-label="加法竖式工作区">
      <form class="control-panel" @submit.prevent="calculate">
        <div class="input-grid">
          <label class="field"><span>第一个加数</span><input v-model="firstAddend" inputmode="numeric" autocomplete="off" @input="calculate" /></label>
          <span class="division-operator" aria-hidden="true">+</span>
          <label class="field"><span>第二个加数</span><input v-model="secondAddend" inputmode="numeric" autocomplete="off" @input="calculate" /></label>
        </div>
        <div class="form-actions">
          <button class="ghost-button" type="button" @click="firstAddend = '356'; secondAddend = '278'; calculate()">试试 356 + 278</button>
        </div>
        <p class="error-message" role="alert">{{ error }}</p>
        <div class="settings-panel"><div class="settings-controls">
          <div class="settings-range-group">
            <label class="range-field"><span>方格宽度 <output>{{ cellWidth }}px</output></span><input v-model.number="cellWidth" type="range" min="28" max="56" @input="calculate" /></label>
            <label class="range-field"><span>行高 <output>{{ rowHeight }}px</output></span><input v-model.number="rowHeight" type="range" min="36" max="64" @input="calculate" /></label>
            <label class="range-field"><span>字号比例 <output>{{ fontSizeRatio.toFixed(2) }}</output></span><input v-model.number="fontSizeRatio" type="range" min="0.5" max="1.5" step="0.01" @input="calculate" /></label>
          </div>
          <div class="settings-switch-group">
            <label class="switch-field"><input v-model="showGuideGrid" type="checkbox" @change="calculate" /><span class="switch-ui" aria-hidden="true"></span><span>显示辅助网格</span></label>
            <label class="switch-field"><input v-model="showCarrySteps" type="checkbox" @change="calculate" /><span class="switch-ui" aria-hidden="true"></span><span>显示进位步骤</span></label>
          </div>
        </div></div>
      </form>
      <section class="result-card" aria-live="polite"><div class="calculation-result">
        <div class="result-heading"><div><p class="panel-kicker">CALCULATION</p><h2>{{ firstAddend }} + {{ secondAddend }} =</h2></div><output class="answer">{{ answer }}</output></div>
        <p class="normalization">从个位开始相加；满十时把进位加到下一高位。</p>
        <GridPreview v-if="scene" :scene="scene" mode="both" />
      </div></section>
    </section>
  </div>
</template>
