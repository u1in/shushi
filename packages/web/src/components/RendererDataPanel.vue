<script setup lang="ts">
import type { GridScene } from '@vertical-arithmetic/grid'

defineProps<{ scene: GridScene }>()

/** GridScene 是布局层交给 DOM/CSS 与 SVG 渲染器的完整、与运算无关的数据契约。 */
const rendererNotes: ReadonlyArray<readonly [string, string]> = [
  ['columns / rows', '列与行轨道数组；每个轨道包含 id 和正数 size，只描述真实可见的网格结构。'],
  ['padding', '场景四周的像素留白，避免文本或边线贴近渲染区域边缘。'],
  ['unitWidth / unitHeight', '网格单元的基准宽度与行高，供渲染器解析轨道几何。'],
  ['fontSize', '场景默认字号；文本单元格可通过 fontSizeRatio 在此基础上缩放。'],
  ['defaultTextStyleToken', '文本单元格未提供局部 styleToken 时继承的默认语义样式。'],
  ['textHorizontalAlign / textVerticalAlign', '文本默认水平与垂直对齐方式；单元格可以单独覆盖。'],
  ['elements', '实际绘制的元素数组；文本、直线和圆角均由元素数据表达。'],
  ['elements.id / position', '元素标识及其位置：cell 为单元区域；intersection 为行列交点；edge 为完整单元格边；edgeMidpoint 为边中点。'],
  ['elements.content', '文本、直线或圆角内容，包括文字、样式 token、字号比例和局部对齐覆盖。'],
  ['elements.styleToken', '元素的语义样式 token，由页面主题负责映射为视觉样式。'],
  ['showGuideGrid', '是否绘制用于检查轨道对齐的辅助网格。'],
  ['ariaLabel', '整个竖式场景的无障碍描述。'],
]
</script>

<template>
  <section class="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
    <h2 class="text-xl font-bold text-slate-800">渲染参数</h2>
    <p class="mt-2 text-sm leading-6 text-slate-500">以下是布局引擎实际传给 DOM/CSS 与 SVG 渲染器的 `GridScene` 数据。</p>
    <details class="mt-4 border-t border-slate-200 pt-3" open>
      <summary class="cursor-pointer font-bold text-blue-800">渲染器字段注释</summary>
      <dl class="mt-3 grid gap-x-4 gap-y-2 text-sm md:grid-cols-[max-content_1fr]">
        <template v-for="[field, description] in rendererNotes" :key="field">
          <dt class="font-mono font-bold text-blue-700">{{ field }}</dt>
          <dd class="text-slate-600">{{ description }}</dd>
        </template>
      </dl>
    </details>
    <pre class="mt-5 max-h-[37.5rem] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-700">{{ JSON.stringify(scene, null, 2) }}</pre>
  </section>
</template>
