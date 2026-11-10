/** Shared DOM-free SVG render tree used by the DOM and SSR renderers. */
import { getGridElementRect, getGridTextAnchor, resolveGridMetrics } from '@u1in/shushi-grid'
import type { GridElement, GridMetrics, GridScene } from '@u1in/shushi-grid'

export interface SvgRenderNode {
  name: string
  attributes: Record<string, string | number | undefined>
  text?: string
  children?: SvgRenderNode[]
}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

const createNode = (
  name: string,
  attributes: Record<string, string | number | undefined>,
  children?: SvgRenderNode[],
  text?: string,
): SvgRenderNode => ({ name, attributes, children, text })

/** 把有限的渲染样式写成 SVG inline style，DOM 与字符串输出共享同一份属性。 */
const serializeStyle = (entries: Array<[string, string | number | undefined]>): string | undefined => {
  const values = entries.filter(([, value]) => value !== undefined).map(([name, value]) => `${name}:${String(value)}`)
  return values.length > 0 ? values.join(';') : undefined
}

const styleToken = (value: string | undefined): Record<string, string | undefined> => ({
  'data-style-token': value,
})

const elementId = (element: GridElement): Record<string, string> => ({
  'data-grid-element-id': element.id,
})

const SVG_DEFAULT_TEXT = '#172033'
const SVG_DEFAULT_RULE = '#4a5f78'
const SVG_DEFAULT_GUIDE = '#a7bbdd'
const SVG_DEFAULT_BRACKET = '#4a5f78'
export const SVG_DEFAULT_FONT_FAMILY =
  "'STIX Two Math', 'CMU Serif', 'Computer Modern', 'Latin Modern Roman', 'Cambria Math', math, 'Times New Roman', 'Noto Serif SC', serif"

type SvgTextStyle = {
  color: string
  fontWeight: 400
}

/** 竖式字体统一使用常规字重；颜色仍由语义 token 区分。 */
const svgTextStyle = (color: string): SvgTextStyle => ({ color, fontWeight: 400 })

/** 与 renderer.css 中内置语义 token 对齐，确保 SVG 作为 img 时不依赖外部选择器。 */
const SVG_TEXT_STYLES: Record<string, SvgTextStyle> = {
  'macro.default-text': svgTextStyle(SVG_DEFAULT_TEXT),
  'macro.decimal': svgTextStyle('#c2185b'),
  'division.divisor': svgTextStyle('#c43e49'),
  'division.quotient': svgTextStyle('#be4c00'),
  'division.dividend': svgTextStyle('#b2468a'),
  'division.appended-zero': svgTextStyle('#c9a3bd'),
  'division.partial-minuend': svgTextStyle('#4f9b3e'),
  'division.remainder': svgTextStyle('#4f9b3e'),
  'division.partial-subtrahend': svgTextStyle('#9752b4'),
  'division.decimal-separator': svgTextStyle('#c2185b'),
  'division.dividend-decimal-separator': svgTextStyle('#c2185b'),
  'multiplication.multiplicand': svgTextStyle('#c43e49'),
  'addition.addend': svgTextStyle('#c43e49'),
  'subtraction.minuend': svgTextStyle('#c43e49'),
  'multiplication.multiplier': svgTextStyle('#0096c9'),
  'multiplication.operator': svgTextStyle('#0096c9'),
  'multiplication.carry': svgTextStyle('#00a079'),
  'addition.carry': svgTextStyle('#00a079'),
  'subtraction.borrow': svgTextStyle('#00a079'),
  'multiplication.addition-carry': svgTextStyle('#9752b4'),
  'multiplication.partial-product': svgTextStyle('#4f9b3e'),
  'multiplication.product': svgTextStyle('#be4c00'),
  'addition.sum': svgTextStyle('#be4c00'),
  'subtraction.difference': svgTextStyle('#be4c00'),
  'addition.operator': svgTextStyle('#7b3fa0'),
  'subtraction.operator': svgTextStyle('#7b3fa0'),
  'subtraction.negative-sign': svgTextStyle('#7b3fa0'),
  'subtraction.subtrahend': svgTextStyle('#0096c9'),
  'short-division.divisor': svgTextStyle('#c43e49'),
  'short-division.remainder-label': svgTextStyle('#c43e49'),
  'short-division.dividend': svgTextStyle('#b2468a'),
  'short-division.remainder': svgTextStyle('#4f9b3e'),
  'short-division.final': svgTextStyle('#be4c00'),
}

type SvgLineStyle = {
  color: string
  lineCap: 'butt' | 'round'
  strokeWidth?: number
}

/** 线条 token 的默认值与 renderer.css 保持一致；内容级 color/thickness 会覆盖它们。 */
const SVG_LINE_STYLES: Record<string, SvgLineStyle> = {
  'division.bracket': { color: SVG_DEFAULT_BRACKET, lineCap: 'butt', strokeWidth: 2 },
  'division.bracket-top-line': { color: SVG_DEFAULT_BRACKET, lineCap: 'butt' },
  'division.subtraction-bar': { color: SVG_DEFAULT_RULE, lineCap: 'butt' },
  'multiplication.input-bar': { color: SVG_DEFAULT_RULE, lineCap: 'butt' },
  'multiplication.sum-bar': { color: SVG_DEFAULT_RULE, lineCap: 'butt' },
  'addition.sum-bar': { color: SVG_DEFAULT_RULE, lineCap: 'butt' },
  'subtraction.difference-bar': { color: SVG_DEFAULT_RULE, lineCap: 'butt' },
  'short-division.bar': { color: SVG_DEFAULT_RULE, lineCap: 'butt', strokeWidth: 2 },
  'short-division.separator': { color: '#3986e4', lineCap: 'butt', strokeWidth: 2 },
}

export const getTextStyle = (element: GridElement, scene: GridScene): SvgTextStyle => {
  if (element.content.kind !== 'text') return svgTextStyle(SVG_DEFAULT_TEXT)
  const token = element.content.styleToken ?? scene.defaultTextStyleToken
  return SVG_TEXT_STYLES[token ?? ''] ?? svgTextStyle(SVG_DEFAULT_TEXT)
}

export const getLineStyle = (element: GridElement): SvgLineStyle => {
  const token = element.styleToken
  return SVG_LINE_STYLES[token ?? ''] ?? { color: SVG_DEFAULT_RULE, lineCap: 'round' }
}

const createElementNode = (element: GridElement, scene: GridScene, metrics: GridMetrics): SvgRenderNode => {
  const rect = getGridElementRect(element, metrics)
  if (element.content.kind === 'line') {
    if (element.position.kind !== 'edge') {
      throw new Error(`线元素 ${element.id} 必须定位在单元格边上。`)
    }
    const tokenStyle = getLineStyle(element)
    const isHorizontalEdge = element.position.edge === 'top' || element.position.edge === 'bottom'
    return createNode('line', {
      class: `grid-edge grid-edge--${element.position.edge}`,
      x1: rect.left,
      y1: rect.top,
      x2: rect.left + rect.width,
      y2: rect.top + rect.height,
      ...styleToken(element.styleToken),
      ...elementId(element),
      style: serializeStyle([
        ['fill', 'none'],
        ['stroke', element.content.color ?? tokenStyle.color],
        ['stroke-linecap', isHorizontalEdge ? 'butt' : tokenStyle.lineCap],
        ['stroke-width', `${element.content.thickness ?? tokenStyle.strokeWidth ?? (isHorizontalEdge ? 2 : 3)}px`],
      ]),
    })
  }

  if (element.content.kind === 'text') {
    const horizontalAlign = element.content.horizontalAlign ?? scene.textHorizontalAlign
    const verticalAlign = element.content.verticalAlign ?? scene.textVerticalAlign
    const anchor = getGridTextAnchor(rect, horizontalAlign, verticalAlign)
    const textStyle = getTextStyle(element, scene)
    const fontSize = scene.fontSize * (element.content.fontSizeRatio ?? 1)
    return createNode(
      'text',
      {
        class: 'grid-text',
        x: anchor.x,
        y: anchor.y,
        ...styleToken(element.content.styleToken ?? scene.defaultTextStyleToken),
        ...elementId(element),
        style: serializeStyle([
          ['fill', element.content.color ?? textStyle.color],
          // 每个文字图元显式继承场景字体，确保脱离宿主 CSS 的 SVG 也能稳定切换字体。
          ['font-family', element.content.fontFamily ?? scene.fontFamily ?? SVG_DEFAULT_FONT_FAMILY],
          ['font-size', `${fontSize}px`],
          ['font-variant-numeric', 'tabular-nums'],
          ['font-weight', textStyle.fontWeight],
          ['line-height', 1],
          [
            'text-anchor',
            anchor.horizontalAlign === 'left' ? 'start' : anchor.horizontalAlign === 'right' ? 'end' : 'middle',
          ],
          [
            'dominant-baseline',
            anchor.verticalAlign === 'top'
              ? 'hanging'
              : anchor.verticalAlign === 'bottom'
                ? 'text-after-edge'
                : 'middle',
          ],
        ]),
      },
      undefined,
      element.content.text,
    )
  }

  if (element.content.kind === 'strike') {
    if (element.position.kind !== 'cell') {
      throw new Error(`删除线元素 ${element.id} 必须定位在单元格区域。`)
    }
    return createNode('line', {
      class: 'grid-strike',
      x1: rect.left + rect.width * element.content.x1Ratio,
      y1: rect.top + rect.height * element.content.y1Ratio,
      x2: rect.left + rect.width * element.content.x2Ratio,
      y2: rect.top + rect.height * element.content.y2Ratio,
      ...styleToken(element.styleToken),
      ...elementId(element),
      style: serializeStyle([
        ['fill', 'none'],
        ['stroke', element.content.color ?? SVG_DEFAULT_RULE],
        ['stroke-linecap', 'round'],
        ['stroke-width', `${element.content.thickness ?? 2}px`],
      ]),
    })
  }

  if (element.position.kind !== 'cell') {
    throw new Error(`圆角元素 ${element.id} 必须定位在单元格区域。`)
  }
  const right = rect.left + rect.width
  const bottom = rect.top + rect.height
  const radius = Math.min(rect.width, rect.height) * element.content.radiusRatio
  const tokenStyle = getLineStyle(element)
  return createNode('path', {
    class: `grid-corner grid-corner--${element.content.corner}`,
    d: `M ${rect.left} ${bottom} H ${right - radius} Q ${right} ${bottom} ${right} ${bottom - radius} V ${rect.top}`,
    ...styleToken(element.styleToken),
    ...elementId(element),
    style: serializeStyle([
      ['fill', 'none'],
      ['stroke', element.content.color ?? tokenStyle.color],
      ['stroke-linecap', tokenStyle.lineCap],
      ['stroke-width', `${element.content.thickness ?? tokenStyle.strokeWidth ?? 3}px`],
    ]),
  })
}

const createGuideGridNodes = (scene: GridScene, metrics: GridMetrics): SvgRenderNode[] => {
  if (!scene.showGuideGrid) return []
  const columnOffsets = metrics.columnOffsets
  const rowOffsets = metrics.rowOffsets
  const top = rowOffsets[0]
  const bottom = rowOffsets[rowOffsets.length - 1]
  const left = columnOffsets[0]
  const right = columnOffsets[columnOffsets.length - 1]
  return [
    ...columnOffsets.map((x) =>
      createNode('line', {
        class: 'grid-guide-line grid-guide-line--vertical',
        x1: x,
        y1: top,
        x2: x,
        y2: bottom,
        style: serializeStyle([
          ['fill', 'none'],
          ['stroke', SVG_DEFAULT_GUIDE],
          ['stroke-dasharray', '2 5'],
          ['stroke-linecap', 'butt'],
          ['stroke-width', '1px'],
          ['opacity', 0.68],
        ]),
      }),
    ),
    ...rowOffsets.map((y) =>
      createNode('line', {
        class: 'grid-guide-line grid-guide-line--horizontal',
        x1: left,
        y1: y,
        x2: right,
        y2: y,
        style: serializeStyle([
          ['fill', 'none'],
          ['stroke', SVG_DEFAULT_GUIDE],
          ['stroke-dasharray', '2 5'],
          ['stroke-linecap', 'butt'],
          ['stroke-width', '1px'],
          ['opacity', 0.68],
        ]),
      }),
    ),
  ]
}

/** 生成不依赖 document 的 SVG 节点描述，供不同输出适配层复用。 */
export const createSvgRenderTree = (scene: GridScene): SvgRenderNode => {
  const metrics = resolveGridMetrics(scene)
  const lineNodes = scene.elements
    .filter(({ content }) => content.kind === 'line' || content.kind === 'corner' || content.kind === 'strike')
    .map((element) => createElementNode(element, scene, metrics))
  const textNodes = scene.elements
    .filter(({ content }) => content.kind === 'text')
    .map((element) => createElementNode(element, scene, metrics))

  return createNode(
    'svg',
    {
      class: 'grid-svg',
      role: 'img',
      xmlns: SVG_NAMESPACE,
      style: serializeStyle([
        ['display', 'block'],
        ['--grid-font-size', `${scene.fontSize}px`],
        ['--grid-font-family', scene.fontFamily],
        // SVG 字符串可脱离公共 CSS 单独嵌入，直接写入属性以保留场景字体继承。
        ['font-family', scene.fontFamily ?? SVG_DEFAULT_FONT_FAMILY],
        // 页面全局会关闭浏览器的合成加粗；独立 SVG 也必须固化该规则，避免嵌入字体后字重变粗。
        ['font-synthesis', 'none'],
      ]),
      viewBox: `0 0 ${metrics.width} ${metrics.height}`,
      width: metrics.width,
      height: metrics.height,
      'aria-label': scene.ariaLabel,
    },
    [
      createNode(
        'g',
        {
          class: 'grid-line-layer',
          'aria-hidden': 'true',
        },
        [...createGuideGridNodes(scene, metrics), ...lineNodes],
      ),
      createNode(
        'g',
        {
          class: 'grid-content-layer',
        },
        textNodes,
      ),
    ],
  )
}
