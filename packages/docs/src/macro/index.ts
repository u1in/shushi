import type { ApiTierId, DocGroup, MacroDocApiNavGroup, MacroDocNavGroup, MacroDocPage } from './types'
import { guidePages } from './guide'
import { installPage } from './install'
import { quickStartPage } from './quickstart'
import { macroApiPages } from './api-macro'
import { renderApiPages } from './api-render'
import { gridApiPages } from './api-grid'
import { layoutApiPages } from './api-layout'
import { calculatorApiPages } from './api-calculators'
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
  { id: 'api', title: '宏 API', description: '按常用 API 与高级 API 两个使用层级组织具体 API 页面。' },
  { id: 'basic', title: '基础宏命令', description: '结构、配置与短除法；每个宏一页。' },
  { id: 'orientation', title: '方位宏命令', description: '九宫格文本定位、借位点简写与右边界文字；每个宏一页。' },
  { id: 'symbol', title: '符号与边框宏命令', description: '小数点、厂字弯与单元格边框；每个宏一页。' },
  { id: 'sugar', title: '语法糖', description: '只改变源码写法的压缩规则；每个语法糖一页。' },
  { id: 'practice', title: '实践与排错', description: '完整版与语法糖版对照，以及注意事项。' },
]

/** 用户手册不再发布可编辑练习；保留旧数据文件只为兼容历史链接与测试素材。 */
const removePracticeSections = (pages: MacroDocPage[]): MacroDocPage[] => pages.map((page) => ({
  ...page,
  sections: page.sections.filter(({ id }) => id !== 'practice'),
}))

/** 按调用频率和使用门槛维护 API 页面顺序，顺序同时用于目录和页尾翻页。 */
const apiTierOrder: Record<ApiTierId, string[]> = {
  common: [
    'shushi', 'compileMacro', 'parseMacro', 'formatMacro', 'completeMacro', 'unformatMacro', 'minifyMacro', 'minifyMacroForCopy', 'createMacroAstInspection',
    'renderDomGrid', 'renderSvgGrid', 'renderSvgString', 'GridScene', 'extractVisibleTextRows',
  ],
  advanced: [
    'compileMacroAst', 'minifyMacroAst', 'minifyMacroForCopyAst',
    'computeAddition', 'computeSubtraction', 'computeMultiplication', 'computeDivision', 'computeShortDivision', 'computeCompositeArithmetic',
    'createAdditionMacroSource', 'createSubtractionMacroSource', 'createMultiplicationMacroSource', 'createDivisionMacroSource', 'createShortDivisionMacroSource', 'createCompositeArithmeticMacroSource',
    'createAdditionGridScene', 'createSubtractionGridScene', 'createMultiplicationGridScene', 'createDivisionGridScene', 'createShortDivisionGridScene',
    'compileCalculatorMacro',
    'resolveGridMetrics', 'getGridPositionRect', 'getGridElementRect', 'getGridTextAnchor',
    'getMultiplicationStepCount', 'getDivisionPlaybackStepCount', 'getCompositeArithmeticStepCount',
  ],
}

const pagesByGroup: Record<DocGroup['id'], MacroDocPage[]> = {
  guide: removePracticeSections(guidePages),
  technical: removePracticeSections([installPage, quickStartPage]),
  // API 页面在 technical/api 目录平铺；apiTier 负责可见分层、顺序和覆盖检查。
  api: removePracticeSections([
    ...macroApiPages,
    ...renderApiPages,
    ...gridApiPages,
    ...layoutApiPages,
    ...calculatorApiPages,
  ]),
  basic: removePracticeSections([...basicPagesPartOne, ...basicPagesPartTwo, ...basicPagesPartThree]),
  orientation: removePracticeSections(orientationPages),
  symbol: removePracticeSections(symbolPages),
  sugar: removePracticeSections(sugarSyntaxPages),
  practice: removePracticeSections(practicePages),
}

const apiPagesBySlug = new Map(pagesByGroup.api.map((page) => [page.slug, page]))
const orderedApiPages = (Object.values(apiTierOrder).flat()).map((slug) => apiPagesBySlug.get(slug)).filter((page): page is MacroDocPage => Boolean(page))
const orderedPagesByGroup: Record<DocGroup['id'], MacroDocPage[]> = { ...pagesByGroup, api: orderedApiPages }

/** 按导航顺序展开的全部页面。 */
export const macroDocPages: MacroDocPage[] = macroDocGroups.flatMap(({ id }) => orderedPagesByGroup[id])

/** 侧边栏使用的分组页面清单。 */
export const macroDocNavGroups: MacroDocNavGroup[] = macroDocGroups.map((group) => ({
  ...group,
  pages: orderedPagesByGroup[group.id],
}))

const apiTierMeta: Record<ApiTierId, Omit<MacroDocApiNavGroup, 'pages'>> = {
  common: { id: 'common', title: '常用 API', description: '大多数应用从这里开始：门户调用、宏源码处理、AST 交互和直接渲染。' },
  advanced: { id: 'advanced', title: '高级 API', description: '面向定制渲染、逐层调试和框架内部扩展；普通调用通常不需要直接使用。' },
}

const getOrderedApiPages = (tier: ApiTierId): MacroDocPage[] => apiTierOrder[tier]
  .map((slug) => apiPagesBySlug.get(slug))
  .filter((page): page is MacroDocPage => Boolean(page?.apiTier === tier))

/** API 可见分层清单；每组内部已按预估使用频率从高到低排列。 */
export const macroDocApiNavGroups: MacroDocApiNavGroup[] = (Object.keys(apiTierMeta) as ApiTierId[]).map((id) => ({
  ...apiTierMeta[id],
  pages: getOrderedApiPages(id),
}))

export const macroDocPageBySlug = new Map(macroDocPages.map((page) => [page.slug, page]))

/** 技术文档包含“入门”与“宏 API”两组；其余分组属于宏语言参考。 */
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
