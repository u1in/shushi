<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import {
  getMacroDocPath,
  macroDocNavGroups,
  macroDocPageBySlug,
} from '../content'

/**
 * 单个文档入口的外壳：固定顶栏、可滚动侧边目录与内容区。
 * 宏语言参考与 API 文档分别使用自己的包装页面，传入固定的 area。
 */
const props = defineProps<{ area: 'macro' | 'technical' }>()
const route = useRoute()
const sidebarOpen = ref(false)
const sidebarRef = ref<HTMLElement>()

/** 入口由包装页面固定，slug 仍从 pathname 推导。 */
const currentArea = computed(() => props.area)
const currentSlug = computed(() => {
  const path = route.path.replace(/\/+$/, '')
  if (currentArea.value === 'technical') {
    if (path === '/macro-api') return 'shushi'
    const slug = path.startsWith('/macro-api/') ? path.slice('/macro-api/'.length) : ''
    const page = macroDocPageBySlug.get(slug)
    return page?.group === 'api' ? slug : 'shushi'
  }
  if (path === '/macro-rules') return 'intro'
  const slug = path.startsWith('/macro-rules/') ? path.slice('/macro-rules/'.length) : ''
  const page = macroDocPageBySlug.get(slug)
  return slug && page?.group !== 'technical' && page?.group !== 'api' ? slug : 'intro'
})
const currentPage = computed(() => macroDocPageBySlug.get(currentSlug.value))

/** 每个入口只显示自己的分组，编号在各入口内从 01 开始。 */
const visibleGroups = computed(() => macroDocNavGroups.filter(({ id }) => (
  currentArea.value === 'technical' ? id === 'api' : id !== 'api'
)))
const visiblePages = computed(() => visibleGroups.value.flatMap(({ pages }) => pages))
const pageNumbers = computed(() => new Map(
  visiblePages.value.map((page, index) => [page.slug, index + 1]),
))
const pageNumber = (slug: string): string => String(pageNumbers.value.get(slug) ?? 0).padStart(2, '0')
const brandPath = computed(() => (currentArea.value === 'technical' ? '/macro-api' : '/macro-rules'))

// 进入长目录靠后的页面时，把当前项滚动到可视区域内，避免用户自己寻找。
watch(currentSlug, async () => {
  await nextTick()
  const sidebar = sidebarRef.value
  const active = sidebar?.querySelector<HTMLElement>('.mdocs-nav-link.is-active')
  if (!sidebar || !active) return
  const sidebarRect = sidebar.getBoundingClientRect()
  const activeRect = active.getBoundingClientRect()
  if (activeRect.top < sidebarRect.top || activeRect.bottom > sidebarRect.bottom) {
    sidebar.scrollTop += activeRect.top - sidebarRect.top - 20
  }
}, { immediate: true, flush: 'post' })

watch(() => route.fullPath, async () => {
  sidebarOpen.value = false
  await nextTick()
  if (route.hash) {
    document.getElementById(route.hash.slice(1))?.scrollIntoView({ block: 'start' })
    return
  }
  window.scrollTo(0, 0)
}, { flush: 'post', immediate: true })

// 抽屉打开时锁住背景滚动，关闭或离开文档页时恢复。
watch(sidebarOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="mdocs-page">
    <header class="mdocs-topbar">
      <div class="mdocs-topbar-inner">
        <button
          class="mdocs-menu-button"
          type="button"
          aria-label="打开文档目录"
          aria-controls="mdocs-sidebar"
          :aria-expanded="sidebarOpen"
          @click="sidebarOpen = !sidebarOpen"
        >
          <span></span><span></span><span></span>
        </button>

        <RouterLink :to="brandPath" class="mdocs-brand">
          <span class="mdocs-brand-text">
            <strong>{{ currentArea === 'technical' ? '网格宏 API 文档' : '网格宏文档' }}</strong>
            <small>{{ currentArea === 'technical' ? 'GRID MACRO API' : 'GRID MACRO DOCS' }}</small>
          </span>
        </RouterLink>

        <nav class="mdocs-topbar-nav" aria-label="站点导航">
          <span class="mdocs-version">V1.10</span>
          <RouterLink to="/" class="mdocs-topbar-link">返回首页</RouterLink>
        </nav>
      </div>
    </header>

    <div class="mdocs-shell">
      <div
        v-if="sidebarOpen"
        class="mdocs-sidebar-backdrop"
        aria-hidden="true"
        @click="sidebarOpen = false"
      ></div>

      <aside id="mdocs-sidebar" ref="sidebarRef" class="mdocs-sidebar" :class="{ 'is-open': sidebarOpen }">
        <nav class="mdocs-sidebar-nav" aria-label="文档目录">
          <section v-for="group in visibleGroups" :key="group.id" class="mdocs-nav-group">
            <p class="mdocs-nav-group-title">{{ group.title }}</p>
            <p class="mdocs-nav-group-desc">{{ group.description }}</p>
            <RouterLink
              v-for="page in group.pages"
              :key="page.slug"
              :to="getMacroDocPath(page.slug)"
              class="mdocs-nav-link"
              :class="{ 'mdocs-nav-link--api': group.id === 'api', 'is-active': currentSlug === page.slug }"
              :aria-current="currentSlug === page.slug ? 'page' : 'false'"
            >
              <span class="mdocs-nav-index">{{ pageNumber(page.slug) }}</span>
              <span class="mdocs-nav-label">{{ page.navLabel ?? page.title }}</span>
            </RouterLink>
          </section>
        </nav>
        <p class="mdocs-sidebar-foot">
          当前：{{ currentPage?.navLabel ?? '网格宏文档' }}<br>
          语言版本 V1.10 · 内容与编译器同步
        </p>
      </aside>

      <main class="mdocs-main">
        <RouterView />
      </main>
    </div>
  </div>
</template>
