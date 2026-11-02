<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import {
  compileMacro,
  computeAddition,
  createAdditionMacroSource,
  renderDomGrid,
} from '@vertical-arithmetic/core'

const resultHost = ref<HTMLElement>()
const flowHost = ref<HTMLElement>()
const installCommand = 'npm install @vertical-arithmetic/core'
type CopyState = 'idle' | 'copied' | 'failed'
type CopyTimer = { id?: number }

const copyState = ref<CopyState>('idle')
const codeCopyState = ref<CopyState>('idle')
let flowRenderCount = 0
let flowRenderRequest = 0
let themeObserver: MutationObserver | undefined
const installCopyTimer: CopyTimer = {}
const codeCopyTimer: CopyTimer = {}

/** 首页示例复用“计算过程 → 宏源码 → 同一宏编译器”的真实链路。 */
const computation = computeAddition('356', '278')
const macroSource = createAdditionMacroSource(computation)
const scene = compileMacro(macroSource)
const exampleCode = `import {
  computeAddition,
  createAdditionMacroSource,
  compileMacro,
  renderDomGrid,
} from '@vertical-arithmetic/core'

// 计算层：只生成与渲染无关的逐列过程
const computation = computeAddition('356', '278')
// 布局层：把计算过程填写为可编辑的宏源码
const source = createAdditionMacroSource(computation)
// 宏编译层：统一生成渲染器消费的 GridScene
const scene = compileMacro(source)
// 渲染层：把同一份 GridScene 转为 DOM 舞台
const stage = renderDomGrid(scene)
// 挂载到页面
document.querySelector('#result')?.append(stage)`

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

onMounted(() => {
  if (resultHost.value) {
    const stage = renderDomGrid(scene)
    stage.classList.add('docs-home-grid-stage')
    resultHost.value.replaceChildren(stage)
  }

  void renderFlow()
  themeObserver = new MutationObserver(() => void renderFlow())
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
})

onBeforeUnmount(() => {
  themeObserver?.disconnect()
  if (installCopyTimer.id) window.clearTimeout(installCopyTimer.id)
  if (codeCopyTimer.id) window.clearTimeout(codeCopyTimer.id)
})
</script>

<template>
  <div class="docs-home-experience">
    <section class="docs-home-install" aria-labelledby="docs-home-install-title">
      <p class="docs-home-eyebrow">QUICK START</p>
      <h2 id="docs-home-install-title">先安装，再把竖式过程接入你的页面</h2>
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
    </section>

    <section class="docs-home-demo" aria-labelledby="docs-home-demo-title">
      <div class="docs-home-section-heading">
        <div>
          <p class="docs-home-eyebrow">A SMALL, REAL EXAMPLE</p>
          <h2 id="docs-home-demo-title">几行代码，得到一个可渲染的竖式</h2>
        </div>
        <span class="docs-home-demo-result">356 + 278 = 634</span>
      </div>
      <div class="docs-home-demo-grid">
        <div class="docs-home-code-panel">
          <pre class="docs-home-code"><code><span class="docs-code-keyword">import</span> {
  <span class="docs-code-function">computeAddition</span>,
  <span class="docs-code-function">createAdditionMacroSource</span>,
  <span class="docs-code-function">compileMacro</span>,
  <span class="docs-code-function">renderDomGrid</span>,
} <span class="docs-code-keyword">from</span> <span class="docs-code-string">'@vertical-arithmetic/core'</span>

<span class="docs-code-comment">// 计算层：只生成与渲染无关的逐列过程</span>
<span class="docs-code-keyword">const</span> computation = <span class="docs-code-function">computeAddition</span>(<span class="docs-code-string">'356'</span>, <span class="docs-code-string">'278'</span>)
<span class="docs-code-comment">// 布局层：把计算过程填写为可编辑的宏源码</span>
<span class="docs-code-keyword">const</span> source = <span class="docs-code-function">createAdditionMacroSource</span>(computation)
<span class="docs-code-comment">// 宏编译层：统一生成渲染器消费的 GridScene</span>
<span class="docs-code-keyword">const</span> scene = <span class="docs-code-function">compileMacro</span>(source)
<span class="docs-code-comment">// 渲染层：把同一份 GridScene 转为 DOM 舞台</span>
<span class="docs-code-keyword">const</span> stage = <span class="docs-code-function">renderDomGrid</span>(scene)
<span class="docs-code-comment">// 挂载到页面</span>
document.<span class="docs-code-function">querySelector</span>(<span class="docs-code-string">'#result'</span>)?.<span class="docs-code-function">append</span>(stage)</code></pre>
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
        <div ref="resultHost" class="docs-home-result" aria-label="356 加 278 的竖式渲染结果"></div>
      </div>
    </section>

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
      <p class="docs-home-lead">四则运算竖式项目面向教学、调试和前端集成：用户可以人工录入网格宏源码，也可以输入数值让计算器自动填写同一种源码；两者都由同一个宏编译器生成统一场景，DOM/CSS 与 SVG 最后消费同一份数据。</p>
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
  grid-template-columns: minmax(0, 1.18fr) minmax(260px, .82fr);
  gap: 1rem;
  align-items: stretch;
}

.docs-home-code-panel {
  position: relative;
  min-width: 0;
}

.docs-home-code {
  height: 100%;
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

.docs-home-result {
  display: grid;
  min-height: 250px;
  place-items: center;
  overflow: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 1rem;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--vp-c-accent) 8%, transparent) 1px, transparent 1px),
    linear-gradient(color-mix(in srgb, var(--vp-c-accent) 8%, transparent) 1px, transparent 1px),
    var(--vp-c-bg-elv);
  background-size: 28px 28px;
}

.docs-home-result .docs-home-grid-stage {
  flex: 0 0 auto;
  transform: scale(.92);
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
  .docs-home-copy-button { padding: 0; }
  .docs-home-feature-grid { grid-template-columns: 1fr; }
  .docs-home-mermaid svg { min-width: 620px; }
}
</style>
