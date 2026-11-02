<script setup lang="ts">
import { computeShortDivision } from '@vertical-arithmetic/calculators'
import { createShortDivisionGridScene } from '@vertical-arithmetic/layout'
import { galleryPageByOperation } from '@vertical-arithmetic/docs/gallery'
import NamingMapGrid from '../components/NamingMapGrid.vue'

const computation = computeShortDivision({ mode: 'baseConversion', values: ['13'], targetBase: 2 })
const scene = createShortDivisionGridScene(computation, {
  cellWidth: 46,
  rowHeight: 60,
  fontSizeRatio: 0.82,
  showGuideGrid: true,
  showRemainders: true,
})

const gallery = galleryPageByOperation.get('short-division')!
const items = gallery.items
</script>

<template>
  <main class="mx-auto min-h-screen w-[min(1660px,calc(100%-40px))] py-16">
    <RouterLink to="/" class="text-sm font-bold text-blue-700 hover:underline">← 返回首页</RouterLink>
    <p class="eyebrow mt-8">{{ gallery.eyebrow }}</p>
    <h1>{{ gallery.title }}</h1>
    <p class="intro">{{ gallery.intro }}</p>
    <section class="mt-7"><NamingMapGrid :scene="scene" :items="items" /></section>
  </main>
</template>
