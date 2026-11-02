<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { resolveGridMetrics } from '@vertical-arithmetic/grid'
import { renderSvgGrid } from '@vertical-arithmetic/renderers'
import type { GridScene } from '@vertical-arithmetic/grid'

/**
 * 文档专用的轻量 SVG 预览。
 * 只消费 GridScene，不依赖主应用的 GridPreview 页面组件，
 * 让 macro-docs 包可以独立维护和复用。
 */
const props = defineProps<{ scene: GridScene }>()

const svg = ref<SVGSVGElement>()
const metrics = computed(() => resolveGridMetrics(props.scene))

const render = async (): Promise<void> => {
  await nextTick()
  if (!svg.value) return
  svg.value.replaceChildren()
  renderSvgGrid(svg.value, props.scene)
}

onMounted(render)
watch(() => props.scene, render)
</script>

<template>
  <div class="mdocs-preview-stage" :style="{ width: `${metrics.width}px`, height: `${metrics.height}px` }">
    <svg
      ref="svg"
      class="mdocs-preview-svg"
      :width="metrics.width"
      :height="metrics.height"
      role="img"
      :aria-label="props.scene.ariaLabel"
    ></svg>
  </div>
</template>
