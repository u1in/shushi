import type { DocGroup, MacroDocNavGroup, MacroDocPage } from './types'
import { guidePages } from './guide'
import { basicPagesPartOne } from './basic1'
import { basicPagesPartTwo } from './basic2'
import { basicPagesPartThree } from './basic3'
import { sugarSyntaxPages } from './sugar-syntax'
import { orientationPages } from './orientation'
import { symbolPages } from './symbols'
import { practicePages } from './practice'

export type * from './types'

/**
 * 文档的唯一有序来源。
 * 侧边栏、页尾翻页和路由表都从这里读取，避免新增页面时漏改其中一处。
 */
export const macroDocGroups: DocGroup[] = [
  { id: 'guide', title: '开始', description: '先理解宏语言的目标、编译链路与通用语法。' },
  { id: 'basic', title: '基础宏命令', description: '结构、配置与短除法；每个宏一页。' },
  { id: 'orientation', title: '方位宏命令', description: '九宫格文本定位与右边界文字；每个宏一页。' },
  { id: 'symbol', title: '符号与边框宏命令', description: '小数点、厂字弯与单元格边框；每个宏一页。' },
  { id: 'sugar', title: '语法糖', description: '只改变源码写法的压缩规则；每个语法糖一页。' },
  { id: 'practice', title: '实践与排错', description: '完整版与语法糖版对照，以及注意事项。' },
]

const pagesByGroup: Record<DocGroup['id'], MacroDocPage[]> = {
  guide: guidePages,
  basic: [...basicPagesPartOne, ...basicPagesPartTwo, ...basicPagesPartThree],
  orientation: orientationPages,
  symbol: symbolPages,
  sugar: sugarSyntaxPages,
  practice: practicePages,
}

/** 按导航顺序展开的全部页面。 */
export const macroDocPages: MacroDocPage[] = macroDocGroups.flatMap(({ id }) => pagesByGroup[id])

/** 侧边栏使用的分组页面清单。 */
export const macroDocNavGroups: MacroDocNavGroup[] = macroDocGroups.map((group) => ({
  ...group,
  pages: pagesByGroup[group.id],
}))

export const macroDocPageBySlug = new Map(macroDocPages.map((page) => [page.slug, page]))

/** 前言使用 /macro-rules 根地址，其余页面使用 /macro-rules/<slug>。 */
export const getMacroDocPath = (slug: string): string => (slug === 'intro' ? '/macro-rules' : `/macro-rules/${slug}`)

/** 页尾“上一步 / 下一步”按侧边栏顺序取相邻页面。 */
export const getMacroDocNeighbors = (slug: string): { previous?: MacroDocPage, next?: MacroDocPage } => {
  const index = macroDocPages.findIndex((page) => page.slug === slug)
  if (index < 0) return {}
  return {
    previous: macroDocPages[index - 1],
    next: macroDocPages[index + 1],
  }
}
