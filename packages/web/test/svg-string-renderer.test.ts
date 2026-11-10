import { describe, expect, it } from 'vitest'
import { compileMacro, renderSvgString, shushi } from '@u1in/shushi-core'
import type { GridScene } from '@u1in/shushi-grid'

describe('renderSvgString', () => {
  it('在没有 document 的 Node.js 环境中输出完整 SVG', () => {
    const scene = compileMacro('3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;')
    const svg = renderSvgString(scene)

    expect(typeof document).toBe('undefined')
    expect(svg).toContain('<svg ')
    expect(svg).toContain('viewBox="0 0 ')
    expect(svg).toContain('<g class="grid-line-layer"')
    expect(svg).toContain('<text ')
    expect(svg).toContain('>3</text>')
  })

  it('将 DOT 大小的借位点按场景上区锚点序列化', () => {
    const scene = compileMacro('GRID(ROW(CELL(MM(5), MTD)))')
    const svg = renderSvgString(scene)
    const borrow = scene.elements.find(({ content }) => content.kind === 'text' && content.text === '·')

    // SVG 与 DIV 渲染器都只读取此图元的完整字号和上区对齐方式。
    expect(borrow?.content).toMatchObject({ kind: 'text', horizontalAlign: 'center', verticalAlign: 'top' })
    expect(borrow?.content.kind === 'text' ? borrow.content.fontSizeRatio : undefined).toBeUndefined()
    expect(svg).toContain(`y="${scene.padding.top + (scene.unitHeight * 0.25) / 2}"`)
    expect(svg).toContain('text-anchor:middle')
    expect(svg).toContain('dominant-baseline:middle')
  })

  it('转义 XML 文本、属性和样式值', () => {
    const scene: GridScene = {
      columns: [{ id: 'column', size: 1 }],
      rows: [{ id: 'row', size: 1 }],
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      unitWidth: 20,
      unitHeight: 20,
      fontSize: 16,
      textHorizontalAlign: 'center',
      textVerticalAlign: 'center',
      elements: [
        {
          id: 'text&"',
          position: { kind: 'cell', column: 0, row: 0 },
          content: { kind: 'text', text: '<&"', color: 'red&blue' },
        },
      ],
      showGuideGrid: false,
      ariaLabel: '网格 <&"',
    }

    const svg = renderSvgString(scene)

    expect(svg).toContain('aria-label="网格 &lt;&amp;&quot;"')
    expect(svg).toContain('data-grid-element-id="text&amp;&quot;"')
    expect(svg).toContain('style="fill:red&amp;blue')
    expect(svg).toContain('&lt;&amp;&quot;</text>')
  })

  it('从场景读取默认字体及元素级字体覆盖', () => {
    const scene: GridScene = {
      columns: [{ id: 'column', size: 1 }],
      rows: [{ id: 'row', size: 1 }],
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      unitWidth: 30,
      unitHeight: 40,
      fontSize: 27,
      fontFamily: 'STIX Two Math',
      textHorizontalAlign: 'center',
      textVerticalAlign: 'center',
      elements: [
        {
          id: 'text',
          position: { kind: 'cell', column: 0, row: 0 },
          content: { kind: 'text', text: '5', fontFamily: 'Noto Sans Math' },
        },
      ],
      showGuideGrid: false,
      ariaLabel: '字体场景',
    }

    const svg = renderSvgString(scene)

    expect(svg).toContain('--grid-font-family:STIX Two Math')
    expect(svg).toContain('font-family:Noto Sans Math')
  })

  it('按选项把场景使用的内置字体嵌入 SVG', () => {
    const scene = compileMacro('GRID(ROW(MM(5)))')
    const plainSvg = renderSvgString(scene)
    const embeddedSvg = renderSvgString(scene, { embedFont: true })

    expect(plainSvg).not.toContain('<style>')
    expect(embeddedSvg).toContain('<style>@font-face{font-family:"STIX Two Math"')
    expect(embeddedSvg).toContain('data:font/woff2;base64,')
  })

  it('门户的 svg-string 模式透传字体嵌入开关', () => {
    const plainResult = shushi('5+0', { renderMode: 'svg-string' })
    const embeddedResult = shushi('5+0', { renderMode: 'svg-string', embedFont: true })

    expect(plainResult.rendered).not.toContain('<style>')
    expect(embeddedResult.rendered).toContain('data:font/woff2;base64,')
  })

  it('把独立 img 所需的最终 SVG 视觉属性写入图元', () => {
    const scene: GridScene = {
      columns: [{ id: 'column', size: 1 }],
      rows: [{ id: 'row', size: 1 }],
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      unitWidth: 30,
      unitHeight: 40,
      fontSize: 27,
      textHorizontalAlign: 'center',
      textVerticalAlign: 'center',
      elements: [
        {
          id: 'text',
          position: { kind: 'cell', column: 0, row: 0 },
          content: { kind: 'text', text: '5', styleToken: 'division.quotient' },
        },
        {
          id: 'line',
          position: { kind: 'edge', column: 0, row: 0, edge: 'bottom' },
          content: { kind: 'line' },
        },
      ],
      showGuideGrid: true,
      ariaLabel: '独立 SVG 样式场景',
    }

    const svg = renderSvgString(scene)

    expect(svg).toContain('fill:#be4c00;font-family:')
    expect(svg).toContain('font-size:27px;font-variant-numeric:tabular-nums;font-weight:800')
    expect(svg).toContain('font-synthesis:none')
    expect(svg).toContain('fill:none;stroke:#4a5f78;stroke-linecap:butt;stroke-width:2px')
    expect(svg).toContain('stroke:#a7bbdd;stroke-dasharray:2 5;stroke-linecap:butt;stroke-width:1px;opacity:0.68')
  })

  it('把独立删除线作为跨渲染器图元输出', () => {
    const scene = compileMacro('GRID(ROW(CELL(MM(5), STRIKE(KV(x1, 0.2), KV(x2, 0.8)))))')
    const svg = renderSvgString(scene)

    expect(scene.elements).toContainEqual(
      expect.objectContaining({
        content: expect.objectContaining({ kind: 'strike', x1Ratio: 0.2, x2Ratio: 0.8 }),
      }),
    )
    expect(svg).toContain('<line class="grid-strike"')
  })
})
