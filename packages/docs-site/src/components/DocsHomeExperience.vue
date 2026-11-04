<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  compileMacro,
  renderDomGrid,
} from '@u1in/shushi-core'

const resultHost = ref<HTMLElement>()
const stageHost = ref<HTMLElement>()
const flowHost = ref<HTMLElement>()
const installCommand = 'npm install @u1in/shushi-core'
const skillInstallCommand = 'npx skills add https://github.com/u1in/shushi/tree/main/skills/u1in-shushi -a codex -y'
const agentInstallGuideUrl = 'https://u1in.github.io/shushi/doc/agent-installation.md'
const agentCapabilitiesGuideUrl = 'https://u1in.github.io/shushi/doc/agent-capabilities.md'
// 展示 Skill 安装后的最小使用方式，由 Skill 先询问运算式、渲染方式和相关配置。
const skillUsagePrompt = '$u1in-shushi 请开始交互式竖式实现。'
// 安装规则集中在公开 Markdown；这里的复制文案只保留任务目标，避免多处漂移。
const aiInstallPrompt = `请阅读并严格遵循 ${agentInstallGuideUrl}，按其中说明完成 @u1in/shushi-core 的安装与验证。`
// 先确认计算式和输出形态，避免 Agent 在缺少宿主上下文时直接修改代码。
const aiCapabilitiesPrompt = `请阅读并严格遵循 ${agentCapabilitiesGuideUrl}，按其中流程完成本次实现。`
type CopyState = 'idle' | 'copied' | 'failed'
type CopyTimer = { id?: number }

const copyState = ref<CopyState>('idle')
const skillInstallCopyState = ref<CopyState>('idle')
const aiInstallCopyState = ref<CopyState>('idle')
const aiCapabilitiesCopyState = ref<CopyState>('idle')
const skillUsageCopyState = ref<CopyState>('idle')
const codeCopyState = ref<CopyState>('idle')
let flowRenderCount = 0
let flowRenderRequest = 0
let themeObserver: MutationObserver | undefined
let stageResizeObserver: ResizeObserver | undefined
const installCopyTimer: CopyTimer = {}
const skillInstallCopyTimer: CopyTimer = {}
const aiInstallCopyTimer: CopyTimer = {}
const aiCapabilitiesCopyTimer: CopyTimer = {}
const skillUsageCopyTimer: CopyTimer = {}
const codeCopyTimer: CopyTimer = {}

/** Hero demo 唯一使用这一份输入源码；输入变化后直接复用同一宏编译入口更新竖式。 */
const heroMacroSource = ref('3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;')
const heroMacroError = ref('')
const exampleCode = `import { shushi } from '@u1in/shushi-core'
import '@u1in/shushi-core/style.css'

const { computation, source, rendered, inspection } = shushi({
  operation: 'addition',
  values: ['356', '278'],
  renderMode: 'div',
  el: document.querySelector('#result') ?? undefined,
})
console.log(computation, source, rendered, inspection)`

/** 复制文本；Clipboard API 不可用时回退到浏览器原生复制能力。 */
const copyText = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const copied = document.execCommand('copy')
      textarea.remove()
      if (!copied) throw new Error('Copy command failed')
    }
    return true
  } catch {
    return false
  }
}

const updateCopyState = (state: { value: CopyState }, timer: CopyTimer, copied: boolean): void => {
  state.value = copied ? 'copied' : 'failed'
  if (timer.id) window.clearTimeout(timer.id)
  timer.id = window.setTimeout(() => {
    state.value = 'idle'
  }, 1800)
}

const copyInstallCommand = async (): Promise<void> => {
  updateCopyState(copyState, installCopyTimer, await copyText(installCommand))
}

const copySkillInstallCommand = async (): Promise<void> => {
  updateCopyState(skillInstallCopyState, skillInstallCopyTimer, await copyText(skillInstallCommand))
}

const copyAiInstallPrompt = async (): Promise<void> => {
  updateCopyState(aiInstallCopyState, aiInstallCopyTimer, await copyText(aiInstallPrompt))
}

const copyAiCapabilitiesPrompt = async (): Promise<void> => {
  updateCopyState(aiCapabilitiesCopyState, aiCapabilitiesCopyTimer, await copyText(aiCapabilitiesPrompt))
}

const copySkillUsagePrompt = async (): Promise<void> => {
  updateCopyState(skillUsageCopyState, skillUsageCopyTimer, await copyText(skillUsagePrompt))
}

const copyExampleCode = async (): Promise<void> => {
  updateCopyState(codeCopyState, codeCopyTimer, await copyText(exampleCode))
}

const flowDefinition = `flowchart LR
  manual["人工录入<br/>宏源码"] --> compiler["宏编译器<br/>解析与校验"]
  input["数值输入"] --> calculator["计算器<br/>输出 Computation"]
  calculator --> layout["宏源码生成层<br/>填写公开宏命令"]
  layout --> source["计算器自动生成的<br/>宏源码"]
  source --> compiler
  compiler --> scene["GridScene<br/>统一场景契约"]
  scene --> dom["DOM/CSS<br/>渲染器"]
  scene --> svg["SVG<br/>渲染器"]
  dom --> page["可交互竖式页面"]
  svg --> page`

/** Mermaid 的颜色跟随 VuePress 根节点主题，切换深色模式时重新生成 SVG。 */
const renderFlow = async (): Promise<void> => {
  if (!flowHost.value) return
  const request = ++flowRenderRequest
  const { default: mermaid } = await import('mermaid')
  const dark = document.documentElement.dataset.theme === 'dark'
  const palette = dark
    ? {
        primaryColor: '#18243a',
        primaryTextColor: '#edf3ff',
        primaryBorderColor: '#8db4ff',
        lineColor: '#8db4ff',
        secondaryColor: '#17243a',
        tertiaryColor: '#20314d',
        clusterBkg: '#141f33',
        clusterBorder: '#30435f',
      }
    : {
        primaryColor: '#ffffff',
        primaryTextColor: '#172033',
        primaryBorderColor: '#4166b6',
        lineColor: '#4166b6',
        secondaryColor: '#eef3fb',
        tertiaryColor: '#f5f8fd',
        clusterBkg: '#f5f7fb',
        clusterBorder: '#d9e2f0',
      }

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    // 提高节点字号、内边距和层间距，让流程图在宽屏容器中保持清晰且有足够的视觉占比。
    themeVariables: { ...palette, fontFamily: 'inherit', fontSize: '24px' },
    flowchart: {
      htmlLabels: true,
      nodeSpacing: 210,
      rankSpacing: 54,
      padding: 30,
      useMaxWidth: false,
    },
  })

  const diagramId = `docs-home-flow-${flowRenderCount++}`
  const { svg, bindFunctions } = await mermaid.render(diagramId, flowDefinition)
  if (!flowHost.value || request !== flowRenderRequest) return
  flowHost.value.innerHTML = svg
  bindFunctions?.(flowHost.value)
}

/** 默认主题的 hero 不属于 Markdown 内容树，挂载后将 demo 节点移入 hero，避免依赖 Teleport 初始化时序。 */
const moveDemoToHero = (): void => {
  const host = resultHost.value
  const hero = document.querySelector<HTMLElement>('.vp-hero')
  if (!host || !hero || host.parentElement === hero) return
  hero.appendChild(host)
}

/** 只替换 demo 舞台内容；源码暂时不合法时保留上一次结果，避免输入过程中画布闪空。 */
const renderHeroDemo = (): void => {
  if (!stageHost.value) return

  try {
    const scene = compileMacro(heroMacroSource.value)
    const stage = renderDomGrid(scene)
    stage.classList.add('docs-home-grid-stage')
    const frame = document.createElement('div')
    frame.className = 'docs-home-grid-stage-frame'
    frame.append(stage)
    stageHost.value.replaceChildren(frame)
    resizeHeroDemo()
    heroMacroError.value = ''
  } catch (reason) {
    heroMacroError.value = reason instanceof Error ? reason.message : '宏源码无法编译。'
  }
}

/** 按容器可用宽度缩放舞台，并同步占位尺寸，确保缩放后没有横向滚动条。 */
const resizeHeroDemo = (): void => {
  const host = stageHost.value
  const frame = host?.querySelector<HTMLElement>('.docs-home-grid-stage-frame')
  const stage = frame?.querySelector<HTMLElement>('.docs-home-grid-stage')
  if (!host || !frame || !stage) return

  const hostStyle = getComputedStyle(host)
  const paddingWidth = Number.parseFloat(hostStyle.paddingLeft) + Number.parseFloat(hostStyle.paddingRight)
  const paddingHeight = Number.parseFloat(hostStyle.paddingTop) + Number.parseFloat(hostStyle.paddingBottom)
  const frameMarginTop = Number.parseFloat(getComputedStyle(frame).marginTop) || 0
  const availableWidth = Math.max(0, host.clientWidth - paddingWidth)
  const availableHeight = Math.max(0, host.clientHeight - paddingHeight - frameMarginTop)
  const naturalWidth = stage.offsetWidth
  const naturalHeight = stage.offsetHeight
  if (!availableWidth || !naturalWidth || !naturalHeight) return

  const widthScale = Math.min(1.3, availableWidth / naturalWidth)
  const widthScaledHeight = naturalHeight * widthScale
  /* 默认竖式只会轻微超高时收进可视区；明显过长的竖式保留纵向滚动查看。 */
  const scale = availableHeight > 0 && widthScaledHeight <= availableHeight * 1.25
    ? Math.min(widthScale, availableHeight / naturalHeight)
    : widthScale
  stage.style.transform = `scale(${scale})`
  stage.style.transformOrigin = 'top left'
  frame.style.width = `${naturalWidth * scale}px`
  frame.style.height = `${naturalHeight * scale}px`
}

watch(heroMacroSource, renderHeroDemo)

onMounted(() => {
  moveDemoToHero()
  renderHeroDemo()
  if (stageHost.value) {
    stageResizeObserver = new ResizeObserver(resizeHeroDemo)
    stageResizeObserver.observe(stageHost.value)
  }

  void renderFlow()
  themeObserver = new MutationObserver(() => void renderFlow())
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
})

onBeforeUnmount(() => {
  themeObserver?.disconnect()
  stageResizeObserver?.disconnect()
  if (installCopyTimer.id) window.clearTimeout(installCopyTimer.id)
  if (skillInstallCopyTimer.id) window.clearTimeout(skillInstallCopyTimer.id)
  if (aiInstallCopyTimer.id) window.clearTimeout(aiInstallCopyTimer.id)
  if (aiCapabilitiesCopyTimer.id) window.clearTimeout(aiCapabilitiesCopyTimer.id)
  if (skillUsageCopyTimer.id) window.clearTimeout(skillUsageCopyTimer.id)
  if (codeCopyTimer.id) window.clearTimeout(codeCopyTimer.id)
})
</script>

<template>
  <div class="docs-home-experience">
    <section class="docs-home-install" aria-labelledby="docs-home-install-title">
      <p class="docs-home-eyebrow">QUICK START</p>
      <h2 id="docs-home-install-title">先安装，再把竖式过程接入你的页面</h2>
      <div class="docs-home-install-method">
        <div class="docs-home-install-heading">
          <span>npm 安装</span>
          <small>在终端执行命令，安装 @u1in/shushi-core</small>
        </div>
        <div class="docs-home-install-command-row">
          <pre class="docs-home-install-command"><code>{{ installCommand }}</code></pre>
          <button
            class="docs-home-copy-button docs-home-icon-button"
            type="button"
            :aria-label="copyState === 'copied' ? '安装命令已复制' : copyState === 'failed' ? '复制安装命令失败' : '复制安装命令'"
            :title="copyState === 'copied' ? '安装命令已复制' : copyState === 'failed' ? '复制失败，请重试' : '复制安装命令'"
            @click="copyInstallCommand"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <rect x="8" y="8" width="11" height="11" rx="2" />
              <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
            </svg>
          </button>
        </div>
      </div>
      <div class="docs-home-install-method docs-home-install-method--ai">
        <div class="docs-home-install-heading">
          <span>AI 安装</span>
          <small>复制后粘贴到你的 Agent 对话框</small>
        </div>
        <div class="docs-home-install-command-row docs-home-ai-install-row">
          <pre class="docs-home-install-command docs-home-ai-install-prompt"><code>{{ aiInstallPrompt }}</code></pre>
          <button
            class="docs-home-copy-button docs-home-icon-button"
            type="button"
            :aria-label="aiInstallCopyState === 'copied' ? 'AI 安装指令已复制' : aiInstallCopyState === 'failed' ? '复制 AI 安装指令失败' : '复制 AI 安装指令'"
            :title="aiInstallCopyState === 'copied' ? 'AI 安装指令已复制' : aiInstallCopyState === 'failed' ? '复制失败，请重试' : '复制 AI 安装指令'"
            @click="copyAiInstallPrompt"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <rect x="8" y="8" width="11" height="11" rx="2" />
              <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
            </svg>
          </button>
        </div>
      </div>
      <div class="docs-home-install-method docs-home-install-method--skill">
        <div class="docs-home-install-heading">
          <span>Skill 安装</span>
          <small>在目标项目中执行，安装到当前 Agent 环境</small>
        </div>
        <div class="docs-home-install-command-row">
          <pre class="docs-home-install-command"><code>{{ skillInstallCommand }}</code></pre>
          <button
            class="docs-home-copy-button docs-home-icon-button"
            type="button"
            :aria-label="skillInstallCopyState === 'copied' ? 'Skill 安装命令已复制' : skillInstallCopyState === 'failed' ? '复制 Skill 安装命令失败' : '复制 Skill 安装命令'"
            :title="skillInstallCopyState === 'copied' ? 'Skill 安装命令已复制' : skillInstallCopyState === 'failed' ? '复制失败，请重试' : '复制 Skill 安装命令'"
            @click="copySkillInstallCommand"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <rect x="8" y="8" width="11" height="11" rx="2" />
              <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
            </svg>
          </button>
        </div>
      </div>
    </section>

    <section class="docs-home-demo" aria-labelledby="docs-home-demo-title">
      <div class="docs-home-section-heading">
        <div>
          <p class="docs-home-eyebrow">A SMALL, REAL EXAMPLE</p>
          <h2 id="docs-home-demo-title">几行代码，得到一个可渲染的竖式</h2>
        </div>
      </div>
      <div class="docs-home-demo-grid">
        <div class="docs-home-code-panel">
          <div class="docs-home-install-heading docs-home-code-heading">
            <span>源码实现</span>
            <small>展示从计算到渲染的最小完整链路</small>
          </div>
          <div class="docs-home-code-block">
            <pre class="docs-home-code"><code><span class="docs-code-keyword">import</span> { <span class="docs-code-function">shushi</span> } <span class="docs-code-keyword">from</span> <span class="docs-code-string">'@u1in/shushi-core'</span>
<span class="docs-code-keyword">import</span> <span class="docs-code-string">'@u1in/shushi-core/style.css'</span>

<span class="docs-code-keyword">const</span> { computation, source, rendered, inspection } = <span class="docs-code-function">shushi</span>({
  operation: <span class="docs-code-string">'addition'</span>,
  values: [<span class="docs-code-string">'356'</span>, <span class="docs-code-string">'278'</span>],
  renderMode: <span class="docs-code-string">'div'</span>,
  el: document.<span class="docs-code-function">querySelector</span>(<span class="docs-code-string">'#result'</span>) ?? <span class="docs-code-keyword">undefined</span>,
})
console.<span class="docs-code-function">log</span>(computation, source, rendered, inspection)</code></pre>
          <button
            class="docs-home-copy-button docs-home-icon-button docs-home-code-copy-button"
            type="button"
            :aria-label="codeCopyState === 'copied' ? '示例代码已复制' : codeCopyState === 'failed' ? '复制示例代码失败' : '复制示例代码'"
            :title="codeCopyState === 'copied' ? '示例代码已复制' : codeCopyState === 'failed' ? '复制失败，请重试' : '复制示例代码'"
            @click="copyExampleCode"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <rect x="8" y="8" width="11" height="11" rx="2" />
              <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
            </svg>
          </button>
          </div>
        </div>
      </div>
      <div class="docs-home-install-method docs-home-demo-ai-method docs-home-demo-ai-method--ai">
        <div class="docs-home-install-heading">
          <span>AI 实现</span>
          <small>复制后回答 Agent 的确认问题，再开始实现</small>
        </div>
        <div class="docs-home-install-command-row docs-home-ai-install-row">
          <pre class="docs-home-install-command docs-home-ai-install-prompt"><code>{{ aiCapabilitiesPrompt }}</code></pre>
          <button
            class="docs-home-copy-button docs-home-icon-button"
            type="button"
            :aria-label="aiCapabilitiesCopyState === 'copied' ? 'AI 实现指令已复制' : aiCapabilitiesCopyState === 'failed' ? '复制 AI 实现指令失败' : '复制 AI 实现指令'"
            :title="aiCapabilitiesCopyState === 'copied' ? 'AI 实现指令已复制' : aiCapabilitiesCopyState === 'failed' ? '复制失败，请重试' : '复制 AI 实现指令'"
            @click="copyAiCapabilitiesPrompt"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <rect x="8" y="8" width="11" height="11" rx="2" />
              <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
            </svg>
          </button>
        </div>
      </div>
      <div class="docs-home-install-method docs-home-demo-ai-method docs-home-demo-ai-method--skill">
        <div class="docs-home-install-heading">
          <span>Skill 实现</span>
          <small>安装完成后复制到你的 Agent 对话框</small>
        </div>
        <div class="docs-home-install-command-row">
          <pre class="docs-home-install-command"><code>{{ skillUsagePrompt }}</code></pre>
          <button
            class="docs-home-copy-button docs-home-icon-button"
            type="button"
            :aria-label="skillUsageCopyState === 'copied' ? 'Skill 实现指令已复制' : skillUsageCopyState === 'failed' ? '复制 Skill 实现指令失败' : '复制 Skill 实现指令'"
            :title="skillUsageCopyState === 'copied' ? 'Skill 实现指令已复制' : skillUsageCopyState === 'failed' ? '复制失败，请重试' : '复制 Skill 实现指令'"
            @click="copySkillUsagePrompt"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <rect x="8" y="8" width="11" height="11" rx="2" />
              <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
            </svg>
          </button>
        </div>
      </div>
    </section>

    <!-- VuePress 默认 hero 由主题渲染；挂载后将 demo 与宏输入一起移动到主标题右侧。 -->
    <div ref="resultHost" class="docs-home-result-host docs-home-result--hero">
      <div ref="stageHost" class="docs-home-result" aria-label="可编辑宏源码的竖式渲染结果"></div>
      <label class="docs-home-macro-input">
        <span class="docs-home-sr-only">最简宏源码，修改后即时更新竖式</span>
        <input
          v-model="heroMacroSource"
          type="text"
          spellcheck="false"
          autocomplete="off"
          aria-label="最简宏源码，修改后即时更新竖式"
        />
        <small v-if="heroMacroError" role="alert">{{ heroMacroError }}</small>
      </label>
    </div>

    <section class="docs-home-flow" aria-labelledby="docs-home-flow-title">
      <div class="docs-home-section-heading">
        <div>
          <p class="docs-home-eyebrow">FROM PROCESS TO PIXELS</p>
          <h2 id="docs-home-flow-title">同一条链路，连接计算与渲染</h2>
        </div>
        <span class="docs-home-flow-note">计算规则不进入渲染器</span>
      </div>
      <div ref="flowHost" class="docs-home-mermaid" aria-label="从计算器到渲染器的项目流程图"></div>
    </section>

    <section class="docs-home-overview" aria-labelledby="docs-home-overview-title">
      <p class="docs-home-eyebrow">PROJECT OVERVIEW</p>
      <h2 id="docs-home-overview-title">把“怎么算、怎么排、怎么画”拆成可验证的三层</h2>
      <p class="docs-home-lead">竖式·Shushi 面向教学、调试和前端集成：用户可以人工录入网格宏源码，也可以输入数值让计算器自动填写同一种源码；两者都由同一个宏编译器生成统一场景，DOM/CSS 与 SVG 最后消费同一份数据。</p>
      <div class="docs-home-feature-grid">
        <article class="docs-home-feature">
          <span class="docs-home-feature-index">01</span>
          <h3>多种运算过程</h3>
          <p>覆盖加法、减法、乘法、除法和短除法，并保留进位、借位、余数等教学过程。</p>
        </article>
        <article class="docs-home-feature">
          <span class="docs-home-feature-index">02</span>
          <h3>人工录入与宏编译</h3>
          <p>数值输入先生成 Calculation，再自动填写宏源码；人工源码与自动源码经过同一个编译器。</p>
        </article>
        <article class="docs-home-feature">
          <span class="docs-home-feature-index">03</span>
          <h3>统一 GridScene</h3>
          <p>轨道、单元格、文本、横线和语义 token 组成稳定契约；GridScene 只由宏编译器产生。</p>
        </article>
        <article class="docs-home-feature">
          <span class="docs-home-feature-index">04</span>
          <h3>双渲染器</h3>
          <p>同一份场景既可以输出绝对定位的 DOM/CSS，也可以输出 SVG，适应文档和应用页面。</p>
        </article>
      </div>
    </section>
  </div>
</template>

<style>
.docs-home-experience {
  display: grid;
  gap: 5rem;
  padding-bottom: 4rem;
}

.docs-home-install,
.docs-home-demo,
.docs-home-flow,
.docs-home-overview {
  scroll-margin-top: calc(var(--navbar-height) + 2rem);
}

.docs-home-install {
  display: grid;
  justify-items: start;
  gap: .65rem;
  text-align: left;
}

.docs-home-install-method {
  display: grid;
  gap: .45rem;
  width: min(100%, 72rem);
  margin-top: .35rem;
}

/* 安装方式按“npm → Skill → AI”排列，保持页面阅读顺序与使用流程一致。 */
.docs-home-install-method--skill { order: 1; }
.docs-home-install-method--ai { order: 2; }

.docs-home-demo-ai-method {
  margin-top: 1rem;
}

/* demo 下方的两个 Agent 入口按“Skill 实现 → AI 实现”排列。 */
.docs-home-demo { display: grid; }
.docs-home-demo-ai-method--skill { order: 1; }
.docs-home-demo-ai-method--ai { order: 2; }

.docs-home-install-heading {
  display: flex;
  align-items: baseline;
  gap: .65rem;
  color: var(--vp-c-text);
  font-size: .86rem;
  font-weight: 800;
}

.docs-home-install-heading small {
  color: var(--vp-c-text-mute);
  font-size: .76rem;
  font-weight: 500;
}

.docs-home-eyebrow {
  margin: 0;
  color: var(--vp-c-accent);
  font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
  font-size: .72rem;
  font-weight: 800;
  letter-spacing: .14em;
}

.docs-home-install h2,
.docs-home-section-heading h2,
.docs-home-overview h2 {
  margin: 0;
  /* 首页标题不是正文锚点，清除 VuePress 全局标题为 header-offset 预留的顶部空间。 */
  padding-top: 0 !important;
  color: var(--vp-c-text);
  font-size: clamp(1.55rem, 3vw, 2.25rem);
  letter-spacing: -.04em;
  line-height: 1.2;
}

.docs-home-install-command,
.docs-home-code {
  margin: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  color: var(--vp-c-text);
  background: var(--vp-c-bg-alt);
  font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
  line-height: 1.7;
  overflow-x: auto;
}

/* VuePress 会给正文内所有 code 添加内联背景；代码块内部只保留外层面板背景。 */
.vp-home [vp-content] .docs-home-install-command code,
.vp-home [vp-content] .docs-home-code code {
  padding: 0;
  border-radius: 0;
  color: inherit;
  background: transparent;
}

.docs-home-install-command-row {
  display: flex;
  align-items: stretch;
  gap: .65rem;
  width: fit-content;
  max-width: 100%;
}

.docs-home-install-command {
  min-width: 0;
  flex: 0 1 auto;
  width: max-content;
  max-width: 100%;
  padding: .7rem 1rem;
  font-size: .82rem;
  white-space: pre;
}

.docs-home-ai-install-row {
  position: relative;
  width: 100%;
}

.docs-home-ai-install-row .docs-home-install-command {
  width: 100%;
  max-width: none;
  box-sizing: border-box;
  padding-right: 4.25rem;
}

.docs-home-ai-install-row .docs-home-icon-button {
  position: absolute;
  top: .75rem;
  right: .75rem;
  z-index: 1;
}

.docs-home-ai-install-prompt {
  flex: 1 1 auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.docs-home-copy-button {
  flex: 0 0 auto;
  align-self: stretch;
  border: 1px solid var(--vp-c-accent);
  border-radius: 10px;
  padding: 0 1rem;
  color: var(--vp-c-bg);
  background: var(--vp-c-accent);
  cursor: pointer;
  font: inherit;
  font-size: .82rem;
  font-weight: 700;
  transition: background-color .2s, border-color .2s, transform .2s;
}

.docs-home-icon-button {
  display: grid;
  width: 2.35rem;
  min-width: 2.35rem;
  height: 2.35rem;
  align-self: center;
  place-items: center;
  box-sizing: border-box;
  padding: 0;
}

.docs-home-icon-button svg {
  width: 1.1rem;
  height: 1.1rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.docs-home-copy-button:hover {
  border-color: var(--vp-c-accent-hover);
  background: var(--vp-c-accent-hover);
}

.docs-home-copy-button:active {
  transform: translateY(1px);
}

.docs-home-copy-button:focus-visible {
  outline: 2px solid var(--vp-c-accent-hover);
  outline-offset: 3px;
}

.docs-home-section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.25rem;
}

.docs-home-demo-result,
.docs-home-flow-note {
  flex: 0 0 auto;
  border: 1px solid var(--vp-c-accent-soft);
  border-radius: 999px;
  padding: .4rem .7rem;
  color: var(--vp-c-accent-hover);
  background: var(--vp-c-accent-soft);
  font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
  font-size: .72rem;
  font-weight: 700;
}

.docs-home-demo-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
  align-items: stretch;
}

.docs-home-code-panel {
  display: grid;
  align-content: start;
  gap: .45rem;
  position: relative;
  min-width: 0;
}

.docs-home-code-block {
  position: relative;
  min-width: 0;
}

.docs-home-code {
  height: auto;
  box-sizing: border-box;
  min-height: 250px;
  padding: 1.2rem 1.35rem;
  padding-right: 4.25rem;
  font-size: .78rem;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  overflow-x: hidden;
}

.docs-home-code-copy-button {
  position: absolute;
  top: .75rem;
  right: .75rem;
  z-index: 1;
}

.docs-home-code .docs-code-keyword { color: #9b267d; font-weight: 700; }
.docs-home-code .docs-code-function { color: #1c63b7; }
.docs-home-code .docs-code-string { color: #27834d; }
.docs-home-code .docs-code-number { color: #b56700; }
.docs-home-code .docs-code-comment { color: #788497; }

html[data-theme='dark'] .docs-home-code .docs-code-keyword { color: #e7a4ff; }
html[data-theme='dark'] .docs-home-code .docs-code-function { color: #91bcff; }
html[data-theme='dark'] .docs-home-code .docs-code-string { color: #8ed6a8; }
html[data-theme='dark'] .docs-home-code .docs-code-number { color: #ffc57d; }
html[data-theme='dark'] .docs-home-code .docs-code-comment { color: #9aa9bf; }

.docs-home-result-host {
  --docs-home-demo-height: 228px;
  --docs-home-macro-input-height: 42px;
  display: grid;
  min-width: 0;
  gap: .55rem;
  align-content: start;
}

.docs-home-result {
  display: grid;
  height: var(--docs-home-demo-height);
  min-height: 0;
  align-content: start;
  justify-content: center;
  overflow: auto;
  overscroll-behavior: contain;
  /* 滚动条只在需要时出现，避免默认竖式被预留槽位挤窄。 */
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--vp-c-text-mute) 48%, transparent) transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  box-sizing: border-box;
  /* 采用顶部起始对齐，避免长竖式在缩放后因居中定位贴顶或被裁切。 */
  padding: 1rem;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--vp-c-accent) 8%, transparent) 1px, transparent 1px),
    linear-gradient(color-mix(in srgb, var(--vp-c-accent) 8%, transparent) 1px, transparent 1px),
    var(--vp-c-bg-elv);
  background-size: 28px 28px;
}

.docs-home-result::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.docs-home-result::-webkit-scrollbar-track,
.docs-home-result::-webkit-scrollbar-corner {
  background: transparent;
}

.docs-home-result::-webkit-scrollbar-button {
  display: none;
  width: 0;
  height: 0;
}

.docs-home-result::-webkit-scrollbar-thumb {
  border: 1px solid transparent;
  border-radius: 999px;
  background: color-mix(in srgb, var(--vp-c-text-mute) 48%, transparent);
  background-clip: padding-box;
}

.docs-home-result::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--vp-c-text-mute) 70%, transparent);
  background-clip: padding-box;
}

.docs-home-result .docs-home-grid-stage {
  flex: 0 0 auto;
  transform-origin: top left;
}

.docs-home-grid-stage-frame {
  flex: 0 0 auto;
  margin-inline: auto;
  margin-top: .45rem;
}

.docs-home-macro-input {
  display: grid;
  min-width: 0;
}

.docs-home-macro-input input {
  width: 100%;
  height: var(--docs-home-macro-input-height);
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: .55rem .75rem;
  color: var(--vp-c-text);
  background: var(--vp-c-bg-alt);
  font: 700 .76rem/1.2 ui-monospace, "Cascadia Code", Consolas, monospace;
}

.docs-home-macro-input input:focus {
  border-color: var(--vp-c-accent);
  outline: 2px solid var(--vp-c-accent-soft);
  outline-offset: 1px;
}

.docs-home-macro-input small {
  margin-top: .3rem;
  color: #d13c4b;
  font-size: .7rem;
  line-height: 1.35;
}

.docs-home-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 首页 demo 在挂载后进入默认主题 hero 的第二列；正文中的源码说明仍保持完整宽度。 */
.vp-home .vp-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 320px);
  grid-template-rows: auto auto auto;
  align-items: center;
  column-gap: 3rem;
  width: min(100%, var(--homepage-content-width));
  max-width: var(--homepage-content-width);
  margin-inline: auto;
  text-align: left;
}

.vp-home .vp-hero #main-title {
  margin-left: 0;
  margin-right: 0;
  text-align: left;
}

.vp-home .vp-hero #main-title,
.vp-home .vp-hero .vp-hero-description,
.vp-home .vp-hero .vp-hero-actions {
  grid-column: 1;
}

.vp-home .vp-hero .vp-hero-actions {
  gap: .55rem;
  justify-content: flex-start;
  margin-left: 0;
  margin-right: 0;
  margin-top: .85rem;
  margin-bottom: 1rem;
}

.vp-home .vp-hero .vp-hero-action-button {
  border-radius: 10px;
  padding: .55rem .9rem;
  font-size: .84rem;
}

/* “查看演示”是唯一的外部入口，使用暖色实心按钮与文档按钮区分。 */
.vp-home .vp-hero .vp-hero-action-button.demo {
  border-color: #ff4c55;
  color: #ffffff;
  background: #ff4c55;
  --external-link-c-icon: currentColor;
}

.vp-home .vp-hero .vp-hero-action-button.demo:hover {
  border-color: #e33c46;
  background: #e33c46;
}

.vp-home .vp-hero .docs-home-result--hero {
  grid-column: 2;
  grid-row: 1 / span 3;
  width: 100%;
  min-height: 0;
  /* Hero 左列按钮组保留了 1rem 的下方节奏，这里用同样的外边距对齐输入框底边。 */
  margin: 0 0 1rem;
  /* 让最简宏输入框的底边与左侧 Hero 按钮组的底边落在同一条线上。 */
  align-self: end;
}

.docs-home-result .grid-text {
  position: absolute;
  display: block;
  width: max-content;
  color: var(--vp-c-text);
  font-family: var(--site-font-family);
  font-size: var(--grid-font-size, 27px);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.docs-home-result .grid-edge,
.docs-home-result .grid-corner,
.docs-home-result .grid-guide-line { position: absolute; }
.docs-home-result .grid-edge { background: var(--vp-c-text); }
.docs-home-result .grid-corner {
  border-right: 3px solid var(--vp-c-text);
  border-bottom: 3px solid var(--vp-c-text);
  border-bottom-right-radius: var(--grid-corner-radius);
}
.docs-home-result .grid-text[data-style-token="addition.addend"] { color: #c43e49; }
.docs-home-result .grid-text[data-style-token="addition.operator"] { color: #7b3fa0; }
.docs-home-result .grid-text[data-style-token="addition.carry"] { color: #00a079; }
.docs-home-result .grid-text[data-style-token="addition.sum"] { color: #be4c00; }
.docs-home-result .grid-edge[data-style-token="addition.sum-bar"] { background: #4a5f78; }

.docs-home-mermaid {
  display: grid;
  min-height: 250px;
  place-items: center;
  overflow-x: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  padding: 1.3rem 1.5rem;
  background: var(--vp-c-bg-elv);
}

.docs-home-mermaid svg {
  display: block;
  width: min(100%, 1160px);
  height: auto;
  min-width: 760px;
}

.docs-home-lead {
  max-width: 55rem;
  margin: 1rem 0 0;
  color: var(--vp-c-text-mute);
  font-size: 1rem;
  line-height: 1.85;
}

.docs-home-feature-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: .85rem;
  margin-top: 1.6rem;
}

.docs-home-feature {
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  padding: 1.1rem;
  background: var(--vp-c-bg-elv);
}

.docs-home-feature-index {
  color: var(--vp-c-accent);
  font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
  font-size: .7rem;
  font-weight: 800;
}

.docs-home-feature h3 {
  margin: .6rem 0 .4rem;
  /* 首页概览卡片不需要 VuePress 为锚点标题预留的顶部偏移。 */
  padding-top: 0;
  color: var(--vp-c-text);
  font-size: 1rem;
}

.docs-home-feature p {
  margin: 0;
  color: var(--vp-c-text-mute);
  font-size: .84rem;
  line-height: 1.7;
}

@media (max-width: 800px) {
  .docs-home-section-heading { align-items: start; flex-direction: column; gap: .75rem; }
  .docs-home-demo-grid { grid-template-columns: 1fr; }
  .docs-home-feature-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 520px) {
  .docs-home-experience { gap: 3.5rem; }
  .docs-home-install-command-row { align-items: stretch; }
  .docs-home-install-heading { align-items: start; flex-direction: column; gap: .2rem; }
  .docs-home-copy-button { padding: 0; }
  .docs-home-feature-grid { grid-template-columns: 1fr; }
  .docs-home-mermaid svg { min-width: 620px; }
}

@media (max-width: 720px) {
  .vp-home .vp-hero {
    display: block;
  }

  .vp-home .vp-hero .docs-home-result--hero {
    width: min(100%, 320px);
    min-height: 0;
    margin: 2rem auto 0;
  }
}
</style>
