<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import { RouterLink } from 'vue-router'
import {
  getMacroDocNeighbors,
  getMacroDocPath,
  macroDocGroups,
  macroDocPageBySlug,
} from '../content'
import DocText from '../components/DocText.vue'
import MacroDocBlocks from '../components/MacroDocBlocks.vue'

/**
 * 单篇文档页。
 * 内容来自 slug 对应的数据页；本组件只负责页头、页内目录、锚点滚动高亮与翻页。
 */
const props = defineProps<{ slug: string }>()

const page = computed(() => macroDocPageBySlug.get(props.slug))
const group = computed(() => macroDocGroups.find(({ id }) => id === page.value?.group))
const neighbors = computed(() => getMacroDocNeighbors(props.slug))

/** 用户手册不再渲染旧版“动手练习”章节，只保留说明、示例和结果对照。 */
const visibleSections = computed(() => page.value?.sections.filter(({ id }) => id !== 'practice') ?? [])

/** 以正文字符量粗略估算阅读时间，给读者一个进入长页面前的预期。 */
const readingMinutes = computed(() => {
  if (!page.value) return 0
  return Math.max(2, Math.ceil(JSON.stringify(visibleSections.value).length / 520))
})

const article = ref<HTMLElement>()
const activeSection = ref('')
let scrollFrame = 0

/** 以距视口顶部 150px 为判定线，找出最后一篇已经进入阅读区的章节。 */
const updateActiveSection = (): void => {
  scrollFrame = 0
  const sections = article.value?.querySelectorAll<HTMLElement>('.mdocs-section')
  if (!sections || sections.length === 0) return
  let current = sections[0].id
  sections.forEach((section) => {
    if (section.getBoundingClientRect().top <= 150) current = section.id
  })
  activeSection.value = current
}

const handleScroll = (): void => {
  if (scrollFrame) return
  scrollFrame = window.requestAnimationFrame(updateActiveSection)
}

onMounted(() => {
  activeSection.value = visibleSections.value[0]?.id ?? ''
  updateActiveSection()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  if (scrollFrame) window.cancelAnimationFrame(scrollFrame)
  document.title = '@u1in/shushi'
})

watch(() => props.slug, async () => {
  activeSection.value = visibleSections.value[0]?.id ?? ''
  await nextTick()
  updateActiveSection()
})

// 文档页使用独立标题，方便标签页与浏览器历史辨认。
watchEffect(() => {
  document.title = page.value
    ? `${page.value.navLabel ?? page.value.title} · 网格宏文档`
    : '网格宏文档'
})
</script>

<template>
  <article v-if="page" id="top" ref="article" class="mdocs-article">
    <div class="mdocs-article-main">
      <nav class="mdocs-breadcrumb" aria-label="面包屑">
        <RouterLink to="/macro-rules">网格宏文档</RouterLink>
        <span>/</span>
        <span>{{ group?.title }}</span>
        <span>/</span>
        <span>{{ page.navLabel ?? page.title }}</span>
      </nav>

      <header class="mdocs-hero">
        <p class="mdocs-kicker">{{ page.kicker }}</p>
        <h1>{{ page.title }}</h1>
        <p class="mdocs-summary"><DocText :text="page.summary" /></p>
        <div class="mdocs-hero-meta">
          <span>{{ group?.title }}</span>
          <span>{{ page.sections.length }} 个章节</span>
          <span>约 {{ readingMinutes }} 分钟</span>
          <span>宏语言 V1.10</span>
        </div>
      </header>

      <section
        v-for="section in visibleSections"
        :id="section.id"
        :key="section.id"
        class="mdocs-section"
      >
        <div class="mdocs-section-heading">
          <h2>{{ section.title }}</h2>
          <a class="mdocs-anchor" :href="`#${section.id}`" :aria-label="`链接到「${section.title}」`">#</a>
        </div>
        <MacroDocBlocks :blocks="section.blocks" />
      </section>

      <nav v-if="neighbors.previous || neighbors.next" class="mdocs-pager" aria-label="文档翻页">
        <RouterLink
          v-if="neighbors.previous"
          class="mdocs-pager-link mdocs-pager-link--previous"
          :to="getMacroDocPath(neighbors.previous.slug)"
        >
          <span>← 上一步</span>
          <strong>{{ neighbors.previous.navLabel ?? neighbors.previous.title }}</strong>
        </RouterLink>
        <span v-else class="mdocs-pager-spacer"></span>

        <RouterLink
          v-if="neighbors.next"
          class="mdocs-pager-link mdocs-pager-link--next"
          :to="getMacroDocPath(neighbors.next.slug)"
        >
          <span>下一步 →</span>
          <strong>{{ neighbors.next.navLabel ?? neighbors.next.title }}</strong>
        </RouterLink>
        <span v-else class="mdocs-pager-spacer"></span>
      </nav>
    </div>

    <aside class="mdocs-toc" aria-label="本页目录">
      <p class="mdocs-toc-title">本页内容</p>
      <ol>
        <li v-for="section in visibleSections" :key="section.id">
          <a
            :href="`#${section.id}`"
            :class="{ 'is-active': activeSection === section.id }"
          >{{ section.title }}</a>
        </li>
      </ol>
      <a class="mdocs-toc-top" href="#top">回到顶部 ↑</a>
    </aside>
  </article>

  <div v-else class="mdocs-not-found">
    <p class="mdocs-kicker">DOCUMENT NOT FOUND</p>
    <h1>没有找到这篇文档</h1>
    <p>页面可能已经移动。返回文档首页，从左侧目录重新进入。</p>
    <RouterLink to="/macro-rules" class="mdocs-primary-link">返回文档首页</RouterLink>
  </div>
</template>
