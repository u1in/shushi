import { describe, expect, test } from 'vitest'
import { shushiCore } from '@u1in/shushi-core'
import { compileMacro, createMacroAstInspection, minifyMacro, minifyMacroForCopy } from '@u1in/shushi-macro'
import { arithmeticExamples } from '../src/components/macroPlaygroundExamples'
import { formatAutoColorThemeObject } from '../src/components/autoColorTheme'
import {
  createMacroAstInspectorSnippet,
  createShushiImplementationSnippet,
  implementationSnippets,
} from '../src/components/implementationSnippets'

const DEFAULT_GRID_SETTINGS = {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
}

/** 算式示例必须通过正式门户 API 生成宏源码，测试不维护任何宏文本。 */
const generateSource = (expression: string): string => {
  const normalized = expression.replace(/\s+/g, '').replace(/[xX*]/g, '×').replace(/÷/g, '/').replace(/−/g, '-')
  if (normalized.includes('/')) {
    const [dividend, divisor] = normalized.split('/')
    return minifyMacroForCopy(
      shushiCore({
        operation: 'division',
        divisor,
        dividend,
        calculation: { maxDecimalDigits: 24 },
        settings: {
          ...DEFAULT_GRID_SETTINGS,
          bracketBend: 1,
          uniformSubtractionBars: false,
          showZeroQuotientSteps: false,
        },
      }).source,
    )
  }
  return minifyMacroForCopy(
    shushiCore({
      operation: 'composite',
      expression: normalized,
      settings: {
        ...DEFAULT_GRID_SETTINGS,
        showCarrySteps: true,
        showBorrowSteps: false,
        uniformMultiplicationBars: false,
      },
    }).source,
  )
}

describe('首页宏调试示例', () => {
  test.each(arithmeticExamples)('$label 通过算式生成可编辑宏', ({ expression }) => {
    const source = generateSource(expression)
    expect(minifyMacro(source)).toBe(source)
    expect(source).not.toContain('ariaLabel')
    expect(source).not.toContain('KV(style')
    expect(compileMacro(source)).toEqual(createMacroAstInspection(source).scene)
  })

  test('只保留加减乘除算式示例，不再包含短除法和最大公约数', () => {
    expect(arithmeticExamples.map(({ expression }) => expression)).toEqual([
      '356 + 278',
      '502 - 137',
      '97 × 89',
      '10230 ÷ 25',
    ])
  })

  test('10230 ÷ 25 的最简宏利用右对齐省略行首空单元格', () => {
    expect(generateSource('10230 ÷ 25')).toBe(
      '4,0,[9,DOT],2;2,5,BRKT,1,0,2,3,[0,DOT],0;1,0,0,EMP,EMP,EMP;LN;2,3,0,EMP;2,2,5,EMP;LN;5,0;5,0;LN;0;',
    )
  })

  test('宏调试可通过编译 API 显示网格而不改写最简源码', () => {
    const inspection = createMacroAstInspection('5,6;', { showGuideGrid: true })

    expect(inspection.scene.showGuideGrid).toBe(true)
    expect(inspection.source).toBe('5,6;')
    expect(inspection.minifiedSource).toBe('5,6;')
  })

  test('全部算式示例都可以直接载入 AST 检查器', () => {
    arithmeticExamples.forEach(({ expression }) => {
      const inspection = createMacroAstInspection(generateSource(expression))

      expect(inspection.scene.elements.length).toBeGreaterThan(0)
      expect(Object.keys(inspection.references).length).toBeGreaterThan(0)
    })
  })

  test('宏源码示例包含编译后的 DOM 渲染和挂载流程', () => {
    const code = implementationSnippets.macroPlayground

    expect(code).toContain('renderDomGrid(scene)')
    expect(code).toContain("import '@u1in/shushi-core/renderer.css'")
    expect(code).not.toContain('fonts/stix-two-math.css')
    expect(code).not.toContain('fontFamily')
    expect(code).toContain("document.querySelector('#result')?.append(rendered)")
    expect(code).toContain('render(source)')
    expect(code).not.toContain('formatMacro')
  })

  test('AST 示例从宏源码创建 inspection，并由父调用方重新挂载修改后的场景', () => {
    const code = createMacroAstInspectorSnippet({
      source: 'GRID(ROW(MM(3), MM(5)))',
      elementId: 'grid-element-id',
      text: '9',
    })

    expect(code).toContain("import { createMacroAstInspection, renderDomGrid } from '@u1in/shushi-core'")
    expect(code).toContain("const macro = 'GRID(ROW(MM(3), MM(5)))'")
    expect(code).not.toContain('shushi(')
    expect(code).toContain('const inspection = createMacroAstInspection(macro)')
    expect(code).not.toContain('fontFamily')
    expect(code).toContain('const rendered = renderDomGrid(inspection.scene)')
    expect(code).toContain("document.querySelector('#result')?.replaceChildren(rendered)")
    expect(code).toContain('let currentInspection: MacroAstInspection')
    expect(code).toContain('let currentRendered: HTMLElement')
    expect(code).toContain('const handleMacroInput = (nextMacro: string) => {')
    expect(code).toContain('const { inspection, rendered } = render(nextMacro)')
    expect(code).toContain(
      "const handleElementTextInput = (\n  elementId: string = 'grid-element-id',\n  text: string = '9',\n) => {",
    )
    expect(code).toContain('const { inspection, rendered } = update(')
    expect(code).toContain('    currentInspection,')
    expect(code).toContain('    currentRendered,')
    expect(code).toContain('    elementId,')
    expect(code).toContain('    text,')
    expect(code).toContain('const update = (')
    expect(code).toContain('  inspection: MacroAstInspection,')
    expect(code).toContain('  rendered: HTMLElement,')
    expect(code).toContain('const updated = inspection.updateElementText(elementId, text)')
    expect(code).toContain('const updatedRendered = renderDomGrid(updated.scene)')
    expect(code).toContain('return { inspection: updated, rendered: updatedRendered }')

    const customFontCode = createMacroAstInspectorSnippet({
      source: 'GRID(ROW(MM(3)))',
      elementId: 'grid-element-id',
      text: '9',
      fontFamily: 'CMU Serif',
    })
    expect(customFontCode).toContain(
      "const inspection = createMacroAstInspection(macro, {\n    fontFamily: 'CMU Serif',\n  })",
    )
  })

  test('门户源码示例包含当前渲染挂载配置和完整返回值', () => {
    const code = createShushiImplementationSnippet({
      operation: 'addition',
      fields: [['values', ['123', '456']]],
      settings: [
        ['cellWidth', 42],
        ['showGuideGrid', true],
        ['visibleStepCount', 3],
      ],
    })

    expect(code).toContain("renderMode: 'div'")
    expect(code).toContain("el: document.querySelector('#result') ?? undefined")
    expect(code).toContain("shushi('123 + 456', {")
    expect(code).toContain('cellWidth: 42')
    expect(code).toContain('showGuideGrid: true')
    expect(code).toContain('visibleStepCount: 3')
    expect(code).not.toContain('fontFamily')
    expect(code).toContain(
      "const {\n  computation,\n  source,\n  scene,\n  rendered,\n  inspection,\n} = shushi('123 + 456', {",
    )
  })

  test('代码示例会跟随竖式预览字体切换逐字体 CSS', () => {
    const code = createShushiImplementationSnippet({
      operation: 'addition',
      fields: [['values', ['123', '456']]],
      settings: [],
      fontFamily: 'Noto Sans Math',
    })

    expect(code).toContain("import '@u1in/shushi-core/fonts/noto-sans-math.css'")
    expect(code).toContain("import '@u1in/shushi-core/renderer-without-font.css'")
    expect(code).not.toContain("import '@u1in/shushi-core/fonts/stix-two-math.css'")
    expect(code).toContain("fontFamily: 'Noto Sans Math'")
    expect(code).not.toContain('const fontFamily')
  })

  test('代码示例注入颜色方案，并可复制为 JS 对象', () => {
    const colorTheme = {
      text: '#111111',
      carry: '#222222',
      borrow: '#333333',
      operator: '#444444',
      decimal: '#555555',
      strike: '#5b21b6',
      rule: '#666666',
      bracketRule: '#777777',
    }
    const code = createShushiImplementationSnippet({
      operation: 'addition',
      fields: [['values', ['123', '456']]],
      settings: [],
      colorTheme,
    })
    const macroCode = createMacroAstInspectorSnippet({
      source: 'GRID(ROW(MM(3)))',
      elementId: 'grid-element-id',
      text: '9',
      colorTheme,
    })

    expect(code).toContain("  colorTheme: {\n    text: '#111111',")
    expect(macroCode).toContain("    colorTheme: {\n      text: '#111111',")
    expect(formatAutoColorThemeObject(colorTheme, { prefix: 'const colorTheme = ' })).toContain('const colorTheme = {')
    expect(formatAutoColorThemeObject(colorTheme)).toContain("rule: { color: '#666666', thickness: 2 },")
    expect(formatAutoColorThemeObject(colorTheme)).toContain("strike: '#5b21b6'")
  })
})
