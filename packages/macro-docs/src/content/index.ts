import type { DocGroup, MacroDocNavGroup, MacroDocPage } from './types'
import { guidePages } from './guide'
import { installPage } from './install'
import { quickStartPage } from './quickstart'
import { apiOverviewPage } from './api-overview'
import { macroApiPage } from './api-macro'
import { renderApiPage } from './api-render'
import { gridApiPage } from './api-grid'
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
  { id: 'guide', title: '宏语言参考', description: '宏语言的目标、基础语法与阅读路线。' },
  { id: 'technical', title: '入门', description: '安装与快速使用；先跑通从源码到画面的链路。' },
  { id: 'api', title: 'API 参考', description: '按宏编译、渲染、网格与文本行分类的函数说明。' },
  { id: 'basic', title: '基础宏命令', description: '结构、配置与短除法；每个宏一页。' },
  { id: 'orientation', title: '方位宏命令', description: '九宫格文本定位与右边界文字；每个宏一页。' },
  { id: 'symbol', title: '符号与边框宏命令', description: '小数点、厂字弯与单元格边框；每个宏一页。' },
  { id: 'sugar', title: '语法糖', description: '只改变源码写法的压缩规则；每个语法糖一页。' },
  { id: 'practice', title: '实践与排错', description: '完整版与语法糖版对照，以及注意事项。' },
]

const pagesByGroup: Record<DocGroup['id'], MacroDocPage[]> = {
  guide: guidePages,
  technical: [installPage, quickStartPage],
  api: [apiOverviewPage, macroApiPage, renderApiPage, gridApiPage],
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

/** 技术文档包含“入门”与“API 参考”两组；其余分组属于宏语言参考。 */
const isTechnicalGroup = (group: DocGroup['id']): boolean => group === 'technical' || group === 'api'

/** 技术文档使用 /macro-api，宏语言参考使用 /macro-rules；两个入口互不共享页面。 */
export const getMacroDocPath = (slug: string): string => {
  const page = macroDocPageBySlug.get(slug)
  if (page && isTechnicalGroup(page.group)) return slug === 'install' ? '/macro-api' : `/macro-api/${slug}`
  return slug === 'intro' ? '/macro-rules' : `/macro-rules/${slug}`
}

/** 页尾翻页只在同一入口内进行，不跨越技术文档与宏语言参考。 */
export const getMacroDocNeighbors = (slug: string): { previous?: MacroDocPage, next?: MacroDocPage } => {
  const page = macroDocPageBySlug.get(slug)
  if (!page) return {}
  const isTechnical = isTechnicalGroup(page.group)
  const areaPages = macroDocPages.filter((candidate) => isTechnicalGroup(candidate.group) === isTechnical)
  const index = areaPages.findIndex((candidate) => candidate.slug === slug)
  if (index < 0) return {}
  return {
    previous: areaPages[index - 1],
    next: areaPages[index + 1],
  }
}
