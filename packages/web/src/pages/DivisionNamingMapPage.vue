<script setup lang="ts">
import { computeDivision } from '@u1in/shushi-calculators'
import { createDivisionGridScene } from '@u1in/shushi-layout'
import { galleryPageByOperation } from '@u1in/shushi-docs/gallery'
import NamingMapGrid from '../components/NamingMapGrid.vue'

const computation = computeDivision('25', '10230', { resultMode: 'decimal' })
const scene = createDivisionGridScene(computation, {
  cellWidth: 46,
  rowHeight: 60,
  fontSizeRatio: 0.82,
  bracketBend: 1,
  showGuideGrid: true,
  uniformSubtractionBars: false,
  showZeroQuotientSteps: false,
})

const gallery = galleryPageByOperation.get('division')!
const items = gallery.items
</script>

<template>
  <main class="mx-auto min-h-screen w-[min(1660px,calc(100%-40px))] py-16">
    <RouterLink to="/" class="text-sm font-bold text-blue-700 hover:underline">← 返回首页</RouterLink>
    <p class="eyebrow mt-8">{{ gallery.eyebrow }}</p>
    <h1>{{ gallery.title }}</h1>
    <p class="intro">{{ gallery.intro }}</p>

    <section class="mt-7">
      <NamingMapGrid :scene="scene" :items="items" />
    </section>
  </main>
</template>
