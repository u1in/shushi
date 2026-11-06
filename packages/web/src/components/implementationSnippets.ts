import {
  DEFAULT_RENDERER_FONT,
  getRendererFontCssPath,
  getRendererStyleCssPath,
  type RendererFontFamily,
} from './rendererFonts'
import { formatAutoColorThemeObject, type AutoColorThemeColorValues } from './autoColorTheme'

/** 首页第三列展示的核心调用链，保持与各演示组件实际使用的公开 API 对齐。 */
export const implementationSnippets = {
  macroPlayground: [
    "import { compileMacro, renderDomGrid } from '@u1in/shushi-core'",
    "import '@u1in/shushi-core/renderer.css'",
    '',
    'const render = (source: string) => {',
    '  const scene = compileMacro(source)',
    '  const rendered = renderDomGrid(scene)',
    "  document.querySelector('#result')?.append(rendered)",
    '}',
    '',
    'render(source)',
  ].join('\n'),
} as const

type SnippetProperty = [name: string, value: unknown]

/** 默认 STIX 随 renderer.css 提供；切换其他内置字体才额外导入字体 CSS。 */
const createRendererStyleImports = (fontFamily: RendererFontFamily): string[] => {
  const fontCssPath = getRendererFontCssPath(fontFamily)
  return [
    `import '${getRendererStyleCssPath(fontFamily)}'`,
    ...(fontCssPath ? [`import '${fontCssPath}'`] : []),
  ]
}

/** 默认 STIX 已由 renderer.css 和公开 API 共同提供，无需在示例中重复声明。 */
const usesCustomRendererFont = (fontFamily: RendererFontFamily): boolean => fontFamily !== DEFAULT_RENDERER_FONT

export type ShushiImplementationSnippetOptions = {
  operation: string
  fields: SnippetProperty[]
  calculation?: SnippetProperty[]
  settings: SnippetProperty[]
  fontFamily?: RendererFontFamily
  colorTheme?: AutoColorThemeColorValues
}

export type MacroAstInspectorSnippetOptions = {
  source: string
  elementId: string
  text: string
  fontFamily?: RendererFontFamily
  colorTheme?: AutoColorThemeColorValues
}

/** 首页表达式演示优先展示统一字符串入口；需要精确指定运算类型时再生成结构化入口。 */
const createExpression = (operation: string, fields: SnippetProperty[]): string | undefined => {
  const values = Object.fromEntries(fields) as Record<string, unknown>
  if (operation === 'addition') return `${(values.values as unknown[])[0]} + ${(values.values as unknown[])[1]}`
  if (operation === 'subtraction') return `${(values.operands as unknown[])[0]} - ${(values.operands as unknown[])[1]}`
  if (operation === 'multiplication') return `${(values.operands as unknown[])[0]} × ${(values.operands as unknown[])[1]}`
  if (operation === 'division') return `${values.dividend} ÷ ${values.divisor}`
  if (operation === 'composite' || operation === 'expression') return String(values.expression)
  if (operation === 'shortDivision') {
    const inputValues = values.values as unknown[]
    if (values.mode === 'factorization') return `|${inputValues[0]}`
    if (values.mode === 'commonFactor') return `|${inputValues.join(' ')}`
    return `(${inputValues[0]})${values.targetBase}`
  }
  return undefined
}

/** 把当前演示控件的值写成可直接复制的 TypeScript 字面量。 */
const formatSnippetValue = (value: unknown): string => {
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') {
    return "'" + value
      .replaceAll('\\', '\\\\')
      .replaceAll('\r', '\\r')
      .replaceAll('\n', '\\n')
      .replaceAll('\t', '\\t')
      .replaceAll("'", "\\'") + "'"
  }
  if (Array.isArray(value)) return '[' + value.map(formatSnippetValue).join(', ') + ']'
  return String(value)
}

const formatSnippetProperties = (properties: SnippetProperty[], indent: string): string[] => (
  properties.map(([name, value]) => indent + name + ': ' + formatSnippetValue(value) + ',')
)

/** 宏调试示例展示真实链路：宏源码生成 inspection 和 DOM，再通过 inspection 局部更新文字。 */
export const createMacroAstInspectorSnippet = ({
  source,
  elementId,
  text,
  fontFamily = DEFAULT_RENDERER_FONT,
  colorTheme,
}: MacroAstInspectorSnippetOptions): string => [
  "import { createMacroAstInspection, renderDomGrid } from '@u1in/shushi-core'",
  "import type { MacroAstInspection } from '@u1in/shushi-core'",
  ...createRendererStyleImports(fontFamily),
  '',
  'const macro = ' + formatSnippetValue(source),
  '',
  'const render = (macro: string) => {',
  ...(colorTheme || usesCustomRendererFont(fontFamily)
    ? [
      '  const inspection = createMacroAstInspection(macro, {',
      ...(colorTheme ? formatAutoColorThemeObject(colorTheme, { indent: '    ', prefix: 'colorTheme: ', trailingComma: true }).split('\n') : []),
      ...(usesCustomRendererFont(fontFamily) ? ['    fontFamily: ' + formatSnippetValue(fontFamily) + ','] : []),
      '  })',
    ]
    : ['  const inspection = createMacroAstInspection(macro)']),
  '  const rendered = renderDomGrid(inspection.scene)',
  "  document.querySelector('#result')?.replaceChildren(rendered)",
  '  return { inspection, rendered }',
  '}',
  '',
  'const update = (',
  '  inspection: MacroAstInspection,',
  '  rendered: HTMLElement,',
  '  elementId: string,',
  '  text: string,',
  ') => {',
  '  const updated = inspection.updateElementText(elementId, text)',
  '  const updatedRendered = renderDomGrid(updated.scene)',
  '  rendered.replaceWith(updatedRendered)',
  '  return { inspection: updated, rendered: updatedRendered }',
  '}',
  '',
  'let currentInspection: MacroAstInspection',
  'let currentRendered: HTMLElement',
  '',
  'const handleMacroInput = (nextMacro: string) => {',
  '  const { inspection, rendered } = render(nextMacro)',
  '  currentInspection = inspection',
  '  currentRendered = rendered',
  '}',
  '',
  'const handleElementTextInput = (',
  '  elementId: string = ' + formatSnippetValue(elementId) + ',',
  '  text: string = ' + formatSnippetValue(text) + ',',
  ') => {',
  '  const { inspection, rendered } = update(',
  '    currentInspection,',
  '    currentRendered,',
  '    elementId,',
  '    text,',
  '  )',
  '  currentInspection = inspection',
  '  currentRendered = rendered',
  '}',
  '',
].join('\n')

/** 统一生成门户 API 示例，确保每个运算示例都展示渲染模式、挂载点和完整返回值。 */
export const createShushiImplementationSnippet = ({
  operation,
  fields,
  calculation,
  settings,
  fontFamily = DEFAULT_RENDERER_FONT,
  colorTheme,
}: ShushiImplementationSnippetOptions): string => {
  const expression = createExpression(operation, fields)
  const useExpressionApi = expression !== undefined
  return [
    `import { ${useExpressionApi ? 'shushi' : 'shushiCore'} } from '@u1in/shushi-core'`,
    ...createRendererStyleImports(fontFamily),
  '',
    'const {',
    '  computation,',
    '  source,',
    '  scene,',
    '  rendered,',
    '  inspection,',
    '} = ' + (useExpressionApi
      ? 'shushi(' + formatSnippetValue(expression) + ', {'
      : 'shushiCore({'),
    ...(useExpressionApi ? [] : ['  operation: ' + formatSnippetValue(operation) + ',', ...formatSnippetProperties(fields, '  ')]),
  ...(calculation && calculation.length > 0
    ? ['  calculation: {', ...formatSnippetProperties(calculation, '    '), '  },']
    : []),
  '  settings: {',
  ...formatSnippetProperties(settings, '    '),
  '  },',
  ...(colorTheme ? formatAutoColorThemeObject(colorTheme, { indent: '  ', prefix: 'colorTheme: ', trailingComma: true }).split('\n') : []),
  ...(usesCustomRendererFont(fontFamily) ? ['  fontFamily: ' + formatSnippetValue(fontFamily) + ','] : []),
  "  renderMode: 'div',",
  "  el: document.querySelector('#result') ?? undefined,",
    '})',
  ].join('\n')
}
