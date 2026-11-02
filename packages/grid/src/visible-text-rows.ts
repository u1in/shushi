/**
 * OCR 对照输出：将最终网格中实际可绘制的文本按视觉行扁平化。
 *
 * 该模块只读取 GridScene，不识别加法进位、减法借位等运算语义。单元格
 * 文本以所在行中心归组；锚定在横向边界或交点的文本以其边界高度归组，
 * 因而进位、借位等注记会形成独立的一行，方便与手写 OCR 的行结果比对。
 */
import { getGridElementRect, getGridTextAnchor, resolveGridMetrics } from './geometry'
import type { GridMetrics } from './geometry'
import type { GridElement, GridScene, GridTextContent } from './types'

interface VisibleTextItem {
  text: string
  horizontalPosition: number
  verticalPosition: number
  sourceIndex: number
}

/** 与渲染器共用锚点规则，保证 RB、MT 等宏定位会落到实际可见的注记行。 */
const getTextAnchor = (
  element: GridElement,
  content: GridTextContent,
  scene: GridScene,
  metrics: GridMetrics,
): Pick<VisibleTextItem, 'horizontalPosition' | 'verticalPosition'> => {
  const rect = getGridElementRect(element, metrics)
  const anchor = getGridTextAnchor(
    rect,
    content.horizontalAlign ?? scene.textHorizontalAlign,
    content.verticalAlign ?? scene.textVerticalAlign,
  )
  return {
    horizontalPosition: anchor.x,
    verticalPosition: anchor.y,
  }
}

/**
 * Extracts all non-empty visible text from a scene as OCR-comparable strings.
 *
 * Rows without a text element are omitted. Elements sharing a rendered height
 * are concatenated from left to right; an identical anchor keeps GridScene's
 * declaration order, matching renderer paint order.
 */
export const extractVisibleTextRows = (scene: GridScene): string[] => {
  // 先统一解析轨道，以便无效 GridScene 与两个渲染器保持相同的校验行为。
  const metrics = resolveGridMetrics(scene)
  const items: VisibleTextItem[] = scene.elements.flatMap((element, sourceIndex) => {
    if (element.content.kind !== 'text' || element.content.text.length === 0) return []

    return [{
      text: element.content.text,
      sourceIndex,
      ...getTextAnchor(element, element.content, scene, metrics),
    }]
  })
  const rows = new Map<number, VisibleTextItem[]>()

  items.forEach((item) => {
    const row = rows.get(item.verticalPosition) ?? []
    row.push(item)
    rows.set(item.verticalPosition, row)
  })

  return [...rows.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, row]) => row
      .sort((left, right) => left.horizontalPosition - right.horizontalPosition || left.sourceIndex - right.sourceIndex)
      .map(({ text }) => text)
      .join(''))
}
