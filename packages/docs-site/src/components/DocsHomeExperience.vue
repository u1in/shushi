<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { shushi } from '@u1in/shushi-core'

const resultHost = ref<HTMLElement>()
const stageHost = ref<HTMLElement>()
const flowHost = ref<HTMLElement>()
const agentInstallGuideUrl = 'https://u1in.github.io/shushi/doc/agent-installation.md'
const agentCapabilitiesGuideUrl = 'https://u1in.github.io/shushi/doc/agent-capabilities.md'
type InstallMethod = 'npm' | 'skill' | 'agent'
type CopySection = 'install' | 'usage'
type InstallCopyState = CopySection | 'failed' | null
type CopyTimer = { id?: number }
type InstallGuide = {
  label: string
  install: string
  usage: string
  installHint: string
  usageHint: string
}

const activeInstallMethod = ref<InstallMethod>('npm')
const copiedInstallSection = ref<InstallCopyState>(null)
let flowRenderCount = 0
let flowRenderRequest = 0
let themeObserver: MutationObserver | undefined
let stageResizeObserver: ResizeObserver | undefined
const copiedInstallTimer: CopyTimer = {}

const installGuides: Record<InstallMethod, InstallGuide> = {
  npm: {
    label: 'Npm',
    install: 'npm install @u1in/shushi-core',
    usage: `import { shushi } from '@u1in/shushi-core'
import '@u1in/shushi-core/style.css'

shushi('356 + 278', {
  renderMode: 'div',
  el: document.querySelector('#result'),
})`,
    installHint: '在前端项目中安装公开入口 @u1in/shushi-core。',
    usageHint: '从表达式入口开始；需要细粒度控制时再切换到 shushiCore。',
  },
  skill: {
    label: 'Skill',
    install: 'npx skills add https://github.com/u1in/shushi/tree/main/skills/u1in-shushi -a codex -y',
    usage: '$u1in-shushi 请开始交互式竖式实现。',
    installHint: '把竖式实现流程安装到当前 Agent 环境。',
    usageHint: '在 Agent 对话中调用 Skill，按提示确认运算与输出方式。',
  },
  agent: {
    label: 'Agent',
    install: `请阅读安装指南：
${agentInstallGuideUrl}
完成 @u1in/shushi-core 的安装与验证。`,
    usage: `请阅读能力说明：
${agentCapabilitiesGuideUrl}
按其中流程完成本次竖式实现。`,
    installHint: '把安装指南交给你的编码 Agent 执行。',
    usageHint: '让 Agent 按项目约定确认输入、渲染方式和验证范围。',
  },
}

const activeInstallGuide = computed(() => installGuides[activeInstallMethod.value])

/** Hero demo 唯一使用这一份表达式；输入变化后直接调用 shushi 更新竖式。 */
const heroExpression = ref('356 + 278')
const heroExpressionError = ref('')

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

const copyInstallGuide = async (section: CopySection): Promise<void> => {
  const copied = await copyText(activeInstallGuide.value[section])
  // 安装 Tab 只有一个共享提示状态，切换方式时不会留下错误的成功提示。
  copiedInstallSection.value = copied ? section : 'failed'
  if (copiedInstallTimer.id) window.clearTimeout(copiedInstallTimer.id)
  copiedInstallTimer.id = window.setTimeout(() => {
    copiedInstallSection.value = null
  }, 1800)
}

const flowDefinition = `flowchart TB
  subgraph inputs["入口层 · 多种输入方式"]
    direction LR
    expression["表达式 API<br/>shushi(expression, options)"] --> expressionParser["表达式解析器<br/>ShushiRequest"]
    request["结构化请求<br/>shushiCore(request)"]
    compute["分层计算器 API<br/>compute*"]
    macro["宏源码输入<br/>人工编辑或外部生成"]
  end
  subgraph calculation["计算与布局层 · 产生可编辑宏源码"]
    direction LR
    portal["shushiCore<br/>统一门户编排"] --> computation["Computation<br/>运算过程数据"]
    computation --> layout["布局器<br/>create*MacroSource"] --> source["计算器生成的<br/>宏源码"]
  end
  subgraph macroPipeline["宏解析与 AST 层 · 统一编译入口"]
    direction LR
    compiler["源码编译入口<br/>compileMacro"] --> macroParser["宏解析器<br/>parseMacro → Macro AST"] --> astCompiler["AST 编译器<br/>compileMacroAst"] --> scene["GridScene<br/>统一场景契约"]
    inspection["AST 检查与回溯<br/>createMacroAstInspection"]
  end
  subgraph rendering["场景与渲染层 · 同一份 GridScene"]
    direction LR
    dom["DOM/CSS<br/>renderDomGrid"] --> page["网页交互与播放"]
    svg["SVG DOM<br/>renderSvgGrid"] --> page
    svgString["SVG 字符串<br/>renderSvgString"] --> output["SSR、导出与截图"]
  end
  expressionParser --> portal
  request --> portal
  compute --> computation
  source --> compiler
  macro --> compiler
  macroParser -.-> inspection
  inspection -.-> scene
  scene --> dom
  scene --> svg
  scene --> svgString`

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
    // 采用纵向分阶段布局，避免横向主链被压缩；节点字号和阶段间距保持可读。
    themeVariables: { ...palette, fontFamily: 'inherit', fontSize: '22px' },
    flowchart: {
      htmlLabels: true,
      nodeSpacing: 72,
      rankSpacing: 86,
      padding: 24,
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

/** 只替换 demo 舞台内容；表达式暂时不合法时保留上一次结果，避免输入过程中画布闪空。 */
const renderHeroDemo = (): void => {
  if (!stageHost.value) return

  try {
    const frame = document.createElement('div')
    frame.className = 'docs-home-grid-stage-frame'
    // 直接让 shushi 负责计算、布局、编译和 DOM 渲染，首页不再维护第二套宏输入链路。
    const { rendered: stage } = shushi(heroExpression.value, {
      renderMode: 'div',
      el: frame,
    })
    stage.classList.add('docs-home-grid-stage')
    stageHost.value.replaceChildren(frame)
    resizeHeroDemo()
    heroExpressionError.value = ''
  } catch (reason) {
    heroExpressionError.value = reason instanceof Error ? reason.message : '算式无法渲染。'
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

watch(heroExpression, renderHeroDemo)

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
  if (copiedInstallTimer.id) window.clearTimeout(copiedInstallTimer.id)
})
</script>

<template>
  <div class="docs-home-experience">
    <section class="docs-home-install" aria-labelledby="docs-home-install-title">
      <p class="docs-home-eyebrow">QUICK START</p>
      <h2 id="docs-home-install-title">先安装，再把竖式过程接入你的页面</h2>
      <div class="docs-home-install-tabs" role="tablist" aria-label="接入方式">
        <button
          v-for="(guide, method) in installGuides"
          :id="`docs-home-install-tab-${method}`"
          :key="method"
          class="docs-home-install-tab"
          :class="{ 'docs-home-install-tab--active': activeInstallMethod === method }"
          type="button"
          role="tab"
          :aria-selected="activeInstallMethod === method"
          aria-controls="docs-home-install-panel"
          @click="activeInstallMethod = method"
        >
          {{ guide.label }}
        </button>
      </div>
      <div
        id="docs-home-install-panel"
        class="docs-home-install-panel"
        role="tabpanel"
        :aria-labelledby="`docs-home-install-tab-${activeInstallMethod}`"
      >
        <div class="docs-home-install-method">
          <div class="docs-home-install-heading">
            <span>安装</span>
            <small>{{ activeInstallGuide.installHint }}</small>
          </div>
          <div class="docs-home-install-command-row docs-home-agent-install-row">
            <pre class="docs-home-install-command docs-home-agent-install-prompt"><code>{{ activeInstallGuide.install }}</code></pre>
            <button
              class="docs-home-copy-button docs-home-icon-button"
              type="button"
              :aria-label="copiedInstallSection === 'install' ? '安装内容已复制' : copiedInstallSection === 'failed' ? '复制安装内容失败' : '复制安装内容'"
              :title="copiedInstallSection === 'install' ? '已复制' : copiedInstallSection === 'failed' ? '复制失败，请重试' : '复制'"
              @click="copyInstallGuide('install')"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <rect x="8" y="8" width="11" height="11" rx="2" />
                <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
              </svg>
            </button>
          </div>
        </div>
        <div class="docs-home-install-method docs-home-install-method--usage">
          <div class="docs-home-install-heading">
            <span>最小使用</span>
            <small>{{ activeInstallGuide.usageHint }}</small>
          </div>
          <div class="docs-home-install-command-row docs-home-agent-install-row">
            <pre class="docs-home-install-command docs-home-agent-install-prompt"><code>{{ activeInstallGuide.usage }}</code></pre>
            <button
              class="docs-home-copy-button docs-home-icon-button"
              type="button"
              :aria-label="copiedInstallSection === 'usage' ? '使用示例已复制' : copiedInstallSection === 'failed' ? '复制使用示例失败' : '复制使用示例'"
              :title="copiedInstallSection === 'usage' ? '已复制' : copiedInstallSection === 'failed' ? '复制失败，请重试' : '复制'"
              @click="copyInstallGuide('usage')"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <rect x="8" y="8" width="11" height="11" rx="2" />
                <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- VuePress 默认 hero 由主题渲染；挂载后将 demo 与表达式输入一起移动到主标题右侧。 -->
    <div ref="resultHost" class="docs-home-result-host docs-home-result--hero">
      <div ref="stageHost" class="docs-home-result" aria-label="shushi 表达式的竖式渲染结果"></div>
      <label class="docs-home-expression-input">
        <span class="docs-home-sr-only">shushi 表达式，修改后即时更新竖式</span>
        <input
          v-model="heroExpression"
          type="text"
          spellcheck="false"
          autocomplete="off"
          aria-label="shushi 表达式，修改后即时更新竖式"
        />
        <small v-if="heroExpressionError" role="alert">{{ heroExpressionError }}</small>
      </label>
    </div>

    <section class="docs-home-overview" aria-labelledby="docs-home-overview-title">
      <p class="docs-home-eyebrow">PROJECT OVERVIEW</p>
      <h2 id="docs-home-overview-title">不只算出答案，也把每一步变成可编辑、可回溯的界面</h2>
      <p class="docs-home-lead">竖式·Shushi 把“怎么算、怎么排、怎么画”拆成可以单独验证的层：计算器产出过程数据，排版引擎生成可读宏源码，宏编译器建立 AST 和 GridScene，DOM/CSS、SVG 与字符串输出再消费同一份场景。</p>
    </section>

    <section id="docs-home-feature-input" class="docs-home-feature-section" aria-labelledby="docs-home-feature-input-title">
      <div class="docs-home-section-heading">
        <div>
          <p class="docs-home-eyebrow">INPUT &amp; API</p>
          <h2 id="docs-home-feature-input-title">从一句算式，到可控的完整竖式过程</h2>
          <p class="docs-home-section-lead">入口层把“快速使用”和“精细控制”分开，同时让表达式和结构化请求进入同一条计算、布局、编译和渲染链路。</p>
        </div>
      </div>
      <div class="docs-home-deep-feature">
          <div class="docs-home-feature-body">
            <div>
              <h4>什么时候用哪个入口？</h4>
              <ul class="docs-home-feature-list">
                <li><code>shushi(expression)</code> 适合输入连续四则表达式、长除法或短除法语法。</li>
                <li><code>shushiCore(request)</code> 适合指定运算类型、短除法模式、步骤显示和渲染方式。</li>
                <li>两者都返回 <code>computation</code>、<code>source</code>、<code>scene</code>、<code>rendered</code> 和 <code>inspection</code>。</li>
              </ul>
            </div>
          </div>
      </div>
    </section>

    <section id="docs-home-feature-calculator" class="docs-home-feature-section" aria-labelledby="docs-home-feature-calculator-title">
      <div class="docs-home-section-heading">
        <div>
          <p class="docs-home-eyebrow">CALCULATION ENGINE</p>
          <h2 id="docs-home-feature-calculator-title">不只算出答案，把每一列的过程留下来</h2>
          <p class="docs-home-section-lead">计算器输出的是可以被布局器、教学界面和调试工具继续消费的过程对象，而不是一个孤立的最终数字。</p>
        </div>
      </div>
      <div class="docs-home-deep-feature">
          <div class="docs-home-feature-body">
            <div>
              <h4>过程数据保留什么？</h4>
              <p>加法记录每列的进位和结果位；减法记录借位；乘法记录每一行部分积；长除法记录部分被除数、商位、乘积和余数；短除法记录每轮试除。</p>
              <p>因此同一份计算结果既能生成完整竖式，也能生成“只显示到第几步”的教学画面。</p>
            </div>
          </div>
        </div>
    </section>

    <section id="docs-home-feature-dsl" class="docs-home-feature-section" aria-labelledby="docs-home-feature-dsl-title">
      <div class="docs-home-section-heading">
        <div>
          <p class="docs-home-eyebrow">CUSTOM DSL</p>
          <h2 id="docs-home-feature-dsl-title">用几行宏源码，排出你想要的竖式</h2>
          <p class="docs-home-section-lead">网格宏语言是面向人的排版输入层：用接近竖式草稿的文本表达行、列、同格图元、定位、边框和样式。</p>
        </div>
      </div>
      <div class="docs-home-deep-feature">
          <div class="docs-home-feature-body">
            <div>
              <h4>从显式写法到语法糖</h4>
              <p>完整宏适合调试，顶层分号行、方括号 CELL 简写和零参数别名适合复制与生成。解析后都会归一化为同一种 AST，不会让渲染器承担语法差异。</p>
              <p>你可以直接编辑宏源码，也可以让自己的程序生成宏源码。</p>
            </div>
          </div>
        </div>
    </section>

    <section id="docs-home-feature-ast" class="docs-home-feature-section" aria-labelledby="docs-home-feature-ast-title">
      <div class="docs-home-section-heading">
        <div>
          <p class="docs-home-eyebrow">AST INSPECTION</p>
          <h2 id="docs-home-feature-ast-title">从一个图元，回到它的宏源码位置</h2>
          <p class="docs-home-section-lead">宏源码不是一次性字符串：解析器把它变成可检查的树，检查器再把场景元素和 AST 路径连接起来。</p>
        </div>
      </div>
      <div class="docs-home-deep-feature">
          <div class="docs-home-feature-body">
            <div>
              <h4>适合做什么？</h4>
              <ul class="docs-home-feature-list">
                <li>点击一个场景图元，定位到它来自哪一个宏调用和参数路径。</li>
                <li>编辑图元文字后，生成新的 AST 和新的 GridScene。</li>
                <li>在宏编辑器中做格式化、补全、压缩，并保持语义一致。</li>
              </ul>
            </div>
          </div>
        </div>
    </section>

    <section id="docs-home-feature-layout" class="docs-home-feature-section" aria-labelledby="docs-home-feature-layout-title">
      <div class="docs-home-section-heading">
        <div>
          <p class="docs-home-eyebrow">LAYOUT ENGINE</p>
          <h2 id="docs-home-feature-layout-title">把计算过程，排成可编辑的教学竖式</h2>
          <p class="docs-home-section-lead">排版引擎负责把计算过程翻译成竖式的视觉结构：行列、对齐、横线、符号、补零和语义样式都在这里决定。</p>
        </div>
      </div>
      <div class="docs-home-deep-feature">
          <div class="docs-home-feature-body">
            <div>
              <h4>运算规则和视觉规则分离</h4>
              <p>计算器只回答“每一步算出了什么”，布局器回答“这一步应该出现在哪一格”。它先生成可复制、可编辑的宏源码，再经过统一宏编译链路得到场景。</p>
              <p>因此新增 DOM 或 SVG 渲染方式，不需要复制一套加减乘除坐标逻辑。</p>
            </div>
          </div>
        </div>
    </section>

    <section id="docs-home-feature-playback" class="docs-home-feature-section" aria-labelledby="docs-home-feature-playback-title">
      <div class="docs-home-section-heading">
        <div>
          <p class="docs-home-eyebrow">STEP PLAYBACK</p>
          <h2 id="docs-home-feature-playback-title">让每一步计算，都可以暂停、播放和回到现场</h2>
          <p class="docs-home-section-lead">步骤不是只存在于 JSON 里；布局器可以根据可见步数重建当前场景，让每一帧都来自真实的计算过程。</p>
        </div>
      </div>
      <div class="docs-home-deep-feature">
          <div class="docs-home-feature-body">
            <div>
              <h4>教学和调试的共同基础</h4>
              <p>用 <code>visibleStepCount</code> 显示从开头到当前步骤的内容；用播放步数查询 API 计算总帧数，再接入滑块、逐步按钮或自动播放。</p>
              <p>除法还可以选择是否显示商为 0 的中间步骤，组合运算则按子运算阶段推进。</p>
            </div>
          </div>
        </div>
    </section>

    <section id="docs-home-feature-scene" class="docs-home-feature-section" aria-labelledby="docs-home-feature-scene-title">
      <div class="docs-home-section-heading">
        <div>
          <p class="docs-home-eyebrow">UNIFIED SCENE</p>
          <h2 id="docs-home-feature-scene-title">一份 GridScene，承接所有排版与渲染</h2>
          <p class="docs-home-section-lead">GridScene 是计算、宏、布局和渲染之间的公共边界：它描述轨道、单元格、图元、几何和语义 token，但不绑定某个框架。</p>
        </div>
      </div>
      <div class="docs-home-deep-feature">
          <div class="docs-home-feature-body">
            <div>
              <h4>渲染器只消费场景</h4>
              <p>文本单元格可以覆盖场景级对齐，未覆盖时继承默认值；图元通过样式 token 表达“加数、进位、商、余数”等语义。</p>
              <p>这让 DOM/CSS、SVG 和后续的其他渲染器共享同一份结构化数据。</p>
            </div>
          </div>
        </div>
    </section>

    <section id="docs-home-feature-output" class="docs-home-feature-section" aria-labelledby="docs-home-feature-output-title">
      <div class="docs-home-section-heading">
        <div>
          <p class="docs-home-eyebrow">MULTI-FORMAT OUTPUT</p>
          <h2 id="docs-home-feature-output-title">同一份场景，交付网页、SVG 和服务端输出</h2>
          <p class="docs-home-section-lead">同一份 GridScene 可以按宿主场景选择不同输出：需要交互时用 DOM，需要导出或服务端生成时用 SVG。</p>
        </div>
      </div>
      <div class="docs-home-deep-feature">
          <div class="docs-home-feature-body">
            <div>
              <h4>一份场景，多种交付形态</h4>
              <ul class="docs-home-feature-list">
                <li><code>renderDomGrid</code>：适合网页交互、选中和播放。</li>
                <li><code>renderSvgGrid</code>：返回可插入页面的 SVG DOM。</li>
                <li><code>renderSvgString</code>：适合 SSR、导出、截图和缓存。</li>
              </ul>
            </div>
          </div>
        </div>
    </section>

    <section class="docs-home-flow" aria-labelledby="docs-home-flow-title">
      <div class="docs-home-section-heading">
        <div>
          <p class="docs-home-eyebrow">FROM PROCESS TO PIXELS</p>
          <h2 id="docs-home-flow-title">同一条链路，连接计算与渲染</h2>
        </div>
      </div>
      <div ref="flowHost" class="docs-home-mermaid" aria-label="从输入入口经解析和编译到渲染器的项目流程图"></div>
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

.docs-home-install-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  width: min(100%, 72rem);
  margin-top: .55rem;
  padding: 4px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 13px;
  background: var(--vp-c-bg-alt);
}

.docs-home-install-tab {
  border: 0;
  border-radius: 9px;
  padding: .65rem .8rem;
  color: var(--vp-c-text-mute);
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: .78rem;
  font-weight: 800;
  transition: background-color .2s, color .2s, box-shadow .2s;
}

.docs-home-install-tab:hover {
  color: var(--vp-c-accent-hover);
  background: var(--vp-c-accent-soft);
}

.docs-home-install-tab--active,
.docs-home-install-tab--active:hover {
  color: var(--vp-c-bg);
  background: var(--vp-c-accent);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--vp-c-accent) 28%, transparent);
}

.docs-home-install-tab:focus-visible {
  outline: 2px solid var(--vp-c-accent-hover);
  outline-offset: 2px;
}

.docs-home-install-panel {
  display: grid;
  gap: .55rem;
  width: min(100%, 72rem);
  padding: .85rem 1rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--vp-c-bg-elv);
}

.docs-home-install-method--usage {
  margin-top: .6rem;
}

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

.docs-home-install-command {
  margin: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  color: var(--vp-c-text);
  background: var(--vp-c-bg-alt);
  font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
  line-height: 1.7;
  overflow-x: auto;
}

/* VuePress 会给正文内所有 code 添加内联背景；安装命令内部只保留外层面板背景。 */
.vp-home [vp-content] .docs-home-install-command code {
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

.docs-home-agent-install-row {
  position: relative;
  width: 100%;
}

.docs-home-agent-install-row .docs-home-install-command {
  width: 100%;
  max-width: none;
  box-sizing: border-box;
  padding-right: 4.25rem;
}

.docs-home-agent-install-row .docs-home-icon-button {
  position: absolute;
  top: .75rem;
  right: .75rem;
  z-index: 1;
}

.docs-home-agent-install-prompt {
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

.docs-home-result-host {
  --docs-home-demo-height: 228px;
  --docs-home-expression-input-height: 42px;
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

.docs-home-expression-input {
  position: relative;
  display: grid;
  min-width: 0;
}

.docs-home-expression-input input {
  width: 100%;
  height: var(--docs-home-expression-input-height);
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: .55rem .75rem;
  color: var(--vp-c-text);
  background: var(--vp-c-bg-alt);
  font: 700 .76rem/1.2 ui-monospace, "Cascadia Code", Consolas, monospace;
}

.docs-home-expression-input input:focus {
  border-color: var(--vp-c-accent);
  outline: 2px solid var(--vp-c-accent-soft);
  outline-offset: 1px;
}

.docs-home-expression-input small {
  position: absolute;
  top: calc(100% + .3rem);
  left: 0;
  width: 100%;
  box-sizing: border-box;
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
  min-height: 520px;
  place-items: center;
  overflow: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  padding: 1.3rem 1.5rem;
  background: var(--vp-c-bg-elv);
}

.docs-home-mermaid svg {
  display: block;
  width: min(100%, 1080px);
  height: auto;
  min-width: 0;
}

.docs-home-lead {
  max-width: 55rem;
  margin: 1rem 0 0;
  color: var(--vp-c-text-mute);
  font-size: 1rem;
  line-height: 1.85;
}

.docs-home-feature-section {
  scroll-margin-top: calc(var(--navbar-height) + 2rem);
  display: grid;
  gap: .75rem;
  padding-top: 1.7rem;
}

.docs-home-feature-section .docs-home-section-heading {
  width: 100%;
  margin-bottom: 0;
}

.docs-home-feature-section .docs-home-section-heading > div {
  width: 100%;
}

.docs-home-feature-section .docs-home-section-heading h2 {
  width: 100%;
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: .85rem !important;
}

.vp-home [vp-content] .docs-home-section-lead {
  max-width: 58rem;
  margin: .65rem 0 0 !important;
  color: var(--vp-c-text-mute);
  font-size: .94rem;
  line-height: 1.7;
}

.docs-home-deep-feature {
  min-width: 0;
}

.vp-home [vp-content] .docs-home-feature-section h4 {
  margin-top: 0 !important;
  padding-top: 0 !important;
  line-height: 1.35;
}

.docs-home-feature-body {
  display: grid;
  max-width: 58rem;
}

.vp-home [vp-content] .docs-home-feature-body h4 {
  margin: 0 0 .3rem !important;
  padding-top: 0 !important;
  color: var(--vp-c-text);
  font-size: .9rem;
}

.vp-home [vp-content] .docs-home-feature-body p {
  margin: 0 0 .7rem !important;
  color: var(--vp-c-text-mute);
  font-size: .84rem;
  line-height: 1.8;
}

.vp-home [vp-content] .docs-home-feature-body p:last-child {
  margin-bottom: 0 !important;
}

.docs-home-feature-list {
  display: grid;
  gap: .5rem;
  margin: 0;
  padding-left: 1.15rem;
  color: var(--vp-c-text-mute);
  font-size: .84rem;
  line-height: 1.75;
}

@media (max-width: 800px) {
  .docs-home-section-heading { align-items: start; flex-direction: column; gap: .75rem; }
}

@media (max-width: 520px) {
  .docs-home-experience { gap: 3.5rem; }
  .docs-home-install-command-row { align-items: stretch; }
  .docs-home-install-heading { align-items: start; flex-direction: column; gap: .2rem; }
  .docs-home-copy-button { padding: 0; }
  .docs-home-mermaid svg { width: 920px; max-width: none; }
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
