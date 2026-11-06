import { describe, expect, it } from 'vitest'
import { compileMacro, renderSvgString } from '@u1in/shushi-core'
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
})
