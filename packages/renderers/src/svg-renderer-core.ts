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

const createElementNode = (element: GridElement, scene: GridScene, metrics: GridMetrics): SvgRenderNode => {
  const rect = getGridElementRect(element, metrics)
  if (element.content.kind === 'line') {
    if (element.position.kind !== 'edge') {
      throw new Error(`线元素 ${element.id} 必须定位在单元格边上。`)
    }
    return createNode('line', {
      class: `grid-edge grid-edge--${element.position.edge}`,
      x1: rect.left,
      y1: rect.top,
      x2: rect.left + rect.width,
      y2: rect.top + rect.height,
      ...styleToken(element.styleToken),
      ...elementId(element),
      style: serializeStyle([
        ['stroke', element.content.color],
        ['stroke-width', element.content.thickness === undefined ? undefined : `${element.content.thickness}px`],
      ]),
    })
  }

  if (element.content.kind === 'text') {
    const horizontalAlign = element.content.horizontalAlign ?? scene.textHorizontalAlign
    const verticalAlign = element.content.verticalAlign ?? scene.textVerticalAlign
    const anchor = getGridTextAnchor(rect, horizontalAlign, verticalAlign)
    return createNode(
      'text',
      {
        class: 'grid-text',
        x: anchor.x,
        y: anchor.y,
        ...styleToken(element.content.styleToken ?? scene.defaultTextStyleToken),
        ...elementId(element),
        style: serializeStyle([
          ['fill', element.content.color],
          // 每个文字图元显式继承场景字体，确保脱离宿主 CSS 的 SVG 也能稳定切换字体。
          ['font-family', element.content.fontFamily ?? scene.fontFamily],
          [
            'font-size',
            element.content.fontSizeRatio === undefined
              ? undefined
              : `${scene.fontSize * element.content.fontSizeRatio}px`,
          ],
          ['text-anchor', horizontalAlign === 'left' ? 'start' : horizontalAlign === 'right' ? 'end' : 'middle'],
          [
            'dominant-baseline',
            verticalAlign === 'top' ? 'hanging' : verticalAlign === 'bottom' ? 'text-after-edge' : 'middle',
          ],
        ]),
      },
      undefined,
      element.content.text,
    )
  }

  if (element.position.kind !== 'cell') {
    throw new Error(`圆角元素 ${element.id} 必须定位在单元格区域。`)
  }
  const right = rect.left + rect.width
  const bottom = rect.top + rect.height
  const radius = Math.min(rect.width, rect.height) * element.content.radiusRatio
  return createNode('path', {
    class: `grid-corner grid-corner--${element.content.corner}`,
    d: `M ${rect.left} ${bottom} H ${right - radius} Q ${right} ${bottom} ${right} ${bottom - radius} V ${rect.top}`,
    ...styleToken(element.styleToken),
    ...elementId(element),
    style: serializeStyle([
      ['stroke', element.content.color],
      ['stroke-width', element.content.thickness === undefined ? undefined : `${element.content.thickness}px`],
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
      }),
    ),
    ...rowOffsets.map((y) =>
      createNode('line', {
        class: 'grid-guide-line grid-guide-line--horizontal',
        x1: left,
        y1: y,
        x2: right,
        y2: y,
      }),
    ),
  ]
}

/** 生成不依赖 document 的 SVG 节点描述，供不同输出适配层复用。 */
export const createSvgRenderTree = (scene: GridScene): SvgRenderNode => {
  const metrics = resolveGridMetrics(scene)
  const lineNodes = scene.elements
    .filter(({ content }) => content.kind === 'line' || content.kind === 'corner')
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
        ['font-family', scene.fontFamily],
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
