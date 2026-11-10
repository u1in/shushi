<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import CompositeArithmeticCalculator from '../components/CompositeArithmeticCalculator.vue'
import BrandLogo from '../components/BrandLogo.vue'
import MacroAstInspector from '../components/MacroAstInspector.vue'
import ThemeControl from '../components/ThemeControl.vue'

const showBackToTop = ref(false)
type InstallMethod = 'npm' | 'skill' | 'agent'

type InstallGuide = {
  label: string
  install: string
  usage: string
  installHint: string
  usageHint: string
}

const activeInstallMethod = ref<InstallMethod>('npm')
const copiedGuide = ref<'install' | 'usage' | null>(null)
let copiedGuideTimer: number | undefined
const currentYear = new Date().getFullYear()
const agentInstallGuideUrl = 'https://u1in.github.io/shushi/doc/agent-installation.md'
const agentCapabilitiesGuideUrl = 'https://u1in.github.io/shushi/doc/agent-capabilities.md'

const installGuides: Record<InstallMethod, InstallGuide> = {
  npm: {
    label: 'Npm',
    install: 'npm install @u1in/shushi-core',
    usage: `import { shushi } from '@u1in/shushi-core'

const { rendered: svg } = shushi('356 + 278', {
  renderMode: 'svg-string',
  embedFont: true,
})

// svg 可直接保存为 .svg，或编码后放入 <img src="data:image/svg+xml;base64,...">`,
    installHint: '在你的前端项目中安装`@u1in/shushi-core`。',
    usageHint: '导入后用算式字符串调用 shushi；复杂的结构化请求可使用 shushiCore。',
  },
  skill: {
    label: 'Skill',
    install: 'npx skills add https://github.com/u1in/shushi/tree/main/skills/u1in-shushi -a codex -y',
    usage: '$u1in-shushi 请开始交互式竖式实现。',
    installHint: '将竖式实现流程安装到当前 Agent 环境。',
    usageHint: '在 Agent 对话中调用 Skill，按提示确认运算与输出方式。',
  },
  agent: {
    label: 'Agent',
    install: `请阅读安装指南：\n${agentInstallGuideUrl}\n完成 @u1in/shushi-core 的安装与验证。`,
    usage: `请阅读能力说明：\n${agentCapabilitiesGuideUrl}\n按其中流程完成本次竖式实现。`,
    installHint: '把安装指南交给你的编码 Agent 执行。',
    usageHint: '通过能力说明让 Agent 按项目约定完成实现。',
  },
}

const activeInstallGuide = computed(() => installGuides[activeInstallMethod.value])
// 使用相对路径兼容本地根路径与 GitHub Pages 的 /shushi/ 仓库路径。
const docsUrl = './doc/'
const githubUrl = 'https://github.com/u1in/shushi'
const npmUrl = 'https://www.npmjs.com/package/@u1in/shushi-core'
const bugReportUrl = 'https://github.com/u1in/shushi/issues/new'
const authorEmail = 'u1in@qq.com'

// 仅在页面滚动到主要内容区后显示入口，避免首屏增加无用的固定控件。
const updateBackToTopVisibility = (): void => {
  showBackToTop.value = window.scrollY > 480
}

const scrollToTop = (): void => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 安装面板中的命令和提示都可一键复制，Clipboard API 不可用时保留原文供手动复制。
const copyGuide = async (section: 'install' | 'usage'): Promise<void> => {
  try {
    const text = activeInstallGuide.value[section]
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.append(textarea)
      textarea.select()
      const copied = document.execCommand('copy')
      textarea.remove()
      if (!copied) throw new Error('Copy command failed')
    }
    copiedGuide.value = section
    if (copiedGuideTimer) window.clearTimeout(copiedGuideTimer)
    copiedGuideTimer = window.setTimeout(() => {
      copiedGuide.value = null
    }, 1800)
  } catch {
    copiedGuide.value = null
  }
}

onMounted(() => {
  updateBackToTopVisibility()
  window.addEventListener('scroll', updateBackToTopVisibility, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateBackToTopVisibility)
  if (copiedGuideTimer) window.clearTimeout(copiedGuideTimer)
})
</script>

<template>
  <header class="site-header">
    <a class="site-header__brand" href="#top" aria-label="返回首页顶部">
      <BrandLogo class="site-header__logo" aria-hidden="true" />
      <span>竖式<span class="site-header__brand-dot">·</span>Shushi</span>
    </a>
    <nav class="site-header__nav" aria-label="演示板块导航">
      <a href="#composite-arithmetic">表达式</a>
      <a href="#macro-ast-inspector">宏调试</a>
    </nav>
    <a
      class="site-header__github"
      :href="githubUrl"
      target="_blank"
      rel="noreferrer"
      aria-label="在 GitHub 查看竖式·Shushi"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.21-3.37-1.21-.46-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.15-4.56-5.1 0-1.13.39-2.05 1.03-2.77-.1-.26-.45-1.32.1-2.75 0 0 .84-.28 2.75 1.06A9.28 9.28 0 0 1 12 6.1c.85 0 1.71.12 2.51.35 1.91-1.34 2.75-1.06 2.75-1.06.55 1.43.2 2.49.1 2.75.64.72 1.03 1.64 1.03 2.77 0 3.96-2.34 4.83-4.57 5.09.36.32.68.93.68 1.88 0 1.36-.01 2.45-.01 2.79 0 .27.18.59.69.49A10.24 10.24 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z"
        />
      </svg>
      <span>GitHub</span>
    </a>
    <ThemeControl />
  </header>

  <main id="top" class="page-shell">
    <section class="hero">
      <div class="hero__brand">
        <h1>竖式·Shushi</h1>
        <p class="eyebrow">VERTICAL ARITHMETIC · OPEN SOURCE</p>
        <p class="intro">
          让竖式计算在你的页面上清晰呈现。输入算式，即可生成完整的计算步骤；也可以用宏命令自由编辑和展示。
        </p>
        <nav class="hero-actions" aria-label="相关入口">
          <a class="hero-action-button" href="#composite-arithmetic">开始试用</a>
          <a class="hero-text-link" :href="docsUrl">阅读文档</a>
        </nav>
      </div>
      <aside class="install-guide" aria-label="安装和使用指南">
        <p class="install-guide__eyebrow">START HERE</p>
        <div class="install-guide__tabs" role="tablist" aria-label="接入方式">
          <button
            v-for="method in ['npm', 'skill', 'agent'] as InstallMethod[]"
            :key="method"
            class="install-guide__tab"
            :class="{ 'install-guide__tab--active': activeInstallMethod === method }"
            type="button"
            role="tab"
            :aria-selected="activeInstallMethod === method"
            @click="activeInstallMethod = method"
          >
            {{ installGuides[method].label }}
          </button>
        </div>
        <div class="install-guide__cards">
          <section class="install-guide__card" aria-label="安装">
            <div class="install-guide__card-heading">
              <span>01</span>
              <strong>安装</strong>
            </div>
            <p>{{ activeInstallGuide.installHint }}</p>
            <div class="install-guide__code-row">
              <div class="code-panel__source install-guide__code" aria-label="安装命令">
                {{ activeInstallGuide.install }}
              </div>
              <button
                type="button"
                :aria-label="copiedGuide === 'install' ? '安装内容已复制' : '复制安装内容'"
                :title="copiedGuide === 'install' ? '已复制' : '复制'"
                @click="copyGuide('install')"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <rect x="8" y="8" width="11" height="11" rx="2" />
                  <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                </svg>
              </button>
            </div>
          </section>
          <section class="install-guide__card" aria-label="使用">
            <div class="install-guide__card-heading">
              <span>02</span>
              <strong>使用</strong>
            </div>
            <p>{{ activeInstallGuide.usageHint }}</p>
            <div class="install-guide__code-row">
              <div class="code-panel__source install-guide__code" aria-label="使用示例">
                {{ activeInstallGuide.usage }}
              </div>
              <button
                type="button"
                :aria-label="copiedGuide === 'usage' ? '使用内容已复制' : '复制使用内容'"
                :title="copiedGuide === 'usage' ? '已复制' : '复制'"
                @click="copyGuide('usage')"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <rect x="8" y="8" width="11" height="11" rx="2" />
                  <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                </svg>
              </button>
            </div>
          </section>
        </div>
      </aside>
    </section>

    <CompositeArithmeticCalculator id="composite-arithmetic" />
    <MacroAstInspector id="macro-ast-inspector" />

    <button v-if="showBackToTop" class="back-to-top" type="button" aria-label="返回页面顶部" @click="scrollToTop">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 17V7M7 12l5-5 5 5" />
      </svg>
    </button>
  </main>

  <footer class="site-footer">
    <div class="site-footer__inner">
      <nav class="site-footer__links" aria-label="相关链接">
        <a :href="docsUrl">文档</a>
        <a :href="githubUrl" target="_blank" rel="noreferrer">GitHub</a>
        <a :href="npmUrl" target="_blank" rel="noreferrer">Npm</a>
        <a :href="bugReportUrl" target="_blank" rel="noreferrer">反馈问题</a>
        <a :href="`mailto:${authorEmail}`">联系作者</a>
      </nav>
      <p class="site-footer__copyright">© {{ currentYear }} u1in. Released under the MIT License.</p>
    </div>
  </footer>
</template>
