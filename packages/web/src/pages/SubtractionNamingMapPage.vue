<script setup lang="ts">
import { computeSubtraction } from '@vertical-arithmetic/calculators'
import { createSubtractionGridScene } from '@vertical-arithmetic/layout'
import { galleryPageByOperation } from '@vertical-arithmetic/docs/gallery'
import NamingMapGrid from '../components/NamingMapGrid.vue'

const computation = computeSubtraction('502', '137')
const scene = createSubtractionGridScene(computation, { cellWidth: 64, rowHeight: 72, fontSizeRatio: 0.8, showGuideGrid: true, showBorrowSteps: true })
const gallery = galleryPageByOperation.get('subtraction')!
const items = gallery.items
</script>

<template>
  <main class="mx-auto min-h-screen w-[min(1660px,calc(100%-40px))] py-16">
    <RouterLink to="/" class="text-sm font-bold text-blue-700 hover:underline">← 返回首页</RouterLink>
    <p class="eyebrow mt-8">{{ gallery.eyebrow }}</p><h1>{{ gallery.title }}</h1>
    <p class="intro">{{ gallery.intro }}</p>
    <section class="mt-7"><NamingMapGrid :scene="scene" :items="items" /></section>
  </main>
</template>
