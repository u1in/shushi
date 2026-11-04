/** 首页第三列展示的核心调用链，保持与各演示组件实际使用的公开 API 对齐。 */
export const implementationSnippets = {
  macroPlayground: [
    "import { compileMacro, formatMacro } from '@u1in/shushi-core'",
    '',
    'const render = (source: string) => {',
    '  const scene = compileMacro(source)',
    '  const formattedSource = formatMacro(source)',
    '  return { scene, formattedSource }',
    '}',
  ].join('\n'),
  macroAstInspector: [
    "import { createMacroAstInspection } from '@u1in/shushi-core'",
    '',
    'const render = (source: string, elementId: string, text: string) => {',
    '  const inspection = createMacroAstInspection(source)',
    '  const updated = inspection.updateElementText(elementId, text)',
    '  return { scene: updated.scene, source: updated.source }',
    '}',
  ].join('\n'),
} as const

type SnippetProperty = [name: string, value: unknown]

export type ShushiImplementationSnippetOptions = {
  operation: string
  fields: SnippetProperty[]
  calculation?: SnippetProperty[]
  settings: SnippetProperty[]
}

/** 把当前演示控件的值写成可直接复制的 TypeScript 字面量。 */
const formatSnippetValue = (value: unknown): string => {
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') {
    return "'" + value.replaceAll('\\', '\\\\').replaceAll("'", "\\'") + "'"
  }
  if (Array.isArray(value)) return '[' + value.map(formatSnippetValue).join(', ') + ']'
  return String(value)
}

const formatSnippetProperties = (properties: SnippetProperty[], indent: string): string[] => (
  properties.map(([name, value]) => indent + name + ': ' + formatSnippetValue(value) + ',')
)

/** 统一生成门户 API 示例，确保每个运算示例都展示渲染模式、挂载点和完整返回值。 */
export const createShushiImplementationSnippet = ({
  operation,
  fields,
  calculation,
  settings,
}: ShushiImplementationSnippetOptions): string => [
  "import { shushi } from '@u1in/shushi-core'",
  "import '@u1in/shushi-core/style.css'",
  '',
  'const { computation, source, scene, rendered, inspection } = shushi({',
  '  operation: ' + formatSnippetValue(operation) + ',',
  ...formatSnippetProperties(fields, '  '),
  ...(calculation && calculation.length > 0
    ? ['  calculation: {', ...formatSnippetProperties(calculation, '    '), '  },']
    : []),
  '  settings: {',
  ...formatSnippetProperties(settings, '    '),
  '  },',
  "  renderMode: 'div',",
  "  el: document.querySelector('#result') ?? undefined,",
  '})',
].join('\n')
