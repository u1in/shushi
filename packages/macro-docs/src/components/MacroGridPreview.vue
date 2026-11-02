<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { resolveGridMetrics } from '@vertical-arithmetic/grid'
import { renderSvgGrid } from '@vertical-arithmetic/renderers'
import type { GridScene } from '@vertical-arithmetic/grid'

/**
 * 文档专用的轻量 SVG 预览。
 * 渲染器直接创建 SVG；这里只负责把它挂到文档舞台上。
 */
const props = defineProps<{ scene: GridScene }>()

const host = ref<HTMLElement>()
const metrics = computed(() => resolveGridMetrics(props.scene))

const render = async (): Promise<void> => {
  await nextTick()
  if (!host.value) return
  const svg = renderSvgGrid(props.scene)
  svg.classList.add('mdocs-preview-svg')
  host.value.replaceChildren(svg)
}

onMounted(render)
watch(() => props.scene, render)
</script>

<template>
  <div ref="host" class="mdocs-preview-stage" :style="{ width: `${metrics.width}px`, height: `${metrics.height}px` }"></div>
</template>
