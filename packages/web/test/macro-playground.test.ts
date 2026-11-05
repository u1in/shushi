import { describe, expect, test } from 'vitest'
import { shushiCore } from '@u1in/shushi-core'
import { compileMacro, createMacroAstInspection, minifyMacro, minifyMacroForCopy } from '@u1in/shushi-macro'
import { arithmeticExamples } from '../src/components/macroPlaygroundExamples'
import { createShushiImplementationSnippet, implementationSnippets } from '../src/components/implementationSnippets'

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
    return minifyMacroForCopy(shushiCore({
      operation: 'division',
      divisor,
      dividend,
      calculation: { resultMode: 'decimal' },
      settings: { ...DEFAULT_GRID_SETTINGS, bracketBend: 1, uniformSubtractionBars: false, showZeroQuotientSteps: false },
    }).source)
  }
  return minifyMacroForCopy(shushiCore({
    operation: 'composite',
    expression: normalized,
    settings: { ...DEFAULT_GRID_SETTINGS, showCarrySteps: true, showBorrowSteps: false, uniformMultiplicationBars: false },
  }).source)
}

describe('首页宏实验算式示例', () => {
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
    expect(code).toContain("document.querySelector('#result')?.append(rendered)")
    expect(code).toContain('render(source)')
    expect(code).not.toContain('formatMacro')
  })

  test('AST 示例从宏源码创建 inspection，并由父调用方重新挂载修改后的场景', () => {
    const code = implementationSnippets.macroAstInspector

    expect(code).toContain("import { createMacroAstInspection, renderDomGrid } from '@u1in/shushi-core'")
    expect(code).toContain('const inspection = createMacroAstInspection(source)')
    expect(code).toContain('const rendered = renderDomGrid(inspection.scene)')
    expect(code).toContain("document.querySelector('#result')?.append(rendered)")
    expect(code).toContain('const { inspection, rendered } = render(source)')
    expect(code).toContain('const update = (')
    expect(code).toContain('  inspection: MacroAstInspection,')
    expect(code).toContain('  rendered: HTMLElement,')
    expect(code).toContain('const updated = inspection.updateElementText(elementId, text)')
    expect(code).toContain('const updatedRendered = renderDomGrid(updated.scene)')
    expect(code).toContain("update(inspection, rendered, 'grid-element-id', '9')")
    expect(code).toContain('return { inspection: updated, rendered: updatedRendered }')
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
    expect(code).toContain('const {\n  computation,\n  source,\n  scene,\n  rendered,\n  inspection,\n} = shushi(\'123 + 456\', {')
  })
})
