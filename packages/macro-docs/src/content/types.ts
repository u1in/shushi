/**
 * 网格宏文档的内容模型。
 * 文档正文与 Vue 组件分离：页面只描述“讲什么”，由通用块渲染器决定“怎么显示”。
 * 这样新增一个宏页面只需要补充数据，不必复制一套模板。
 */

/** 文档分组：决定左侧导航的章节顺序，也用于面包屑。 */
export type DocGroupId = 'guide' | 'technical' | 'api' | 'basic' | 'orientation' | 'symbol' | 'sugar' | 'practice'

export interface DocGroup {
  id: DocGroupId
  title: string
  /** 分组在侧边栏中的一句说明，帮助读者判断是否需要进入。 */
  description: string
}

/** 参数、配置项或错误对照表。单元格文本支持反引号行内代码。 */
export interface DocTableBlock {
  type: 'table'
  columns: string[]
  rows: string[][]
  caption?: string
}

export type DocBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | DocTableBlock
  | { type: 'code'; code: string; title?: string }
  | { type: 'example'; title: string; code: string; note?: string }
  | { type: 'callout'; tone: 'info' | 'tip' | 'warn' | 'danger'; title: string; text: string }
  | { type: 'sandbox'; title: string; task: string; starter: string; answer: string; hint?: string; mode?: 'scene' | 'source' }
  | { type: 'compare'; leftTitle: string; leftCode: string; rightTitle: string; rightCode: string; note?: string; equivalent?: boolean }
  | { type: 'steps'; items: Array<{ title: string, text: string }> }
  | { type: 'cards'; items: Array<{ title: string, text: string, to?: string }> }
  | { type: 'position-board'; active: string; note?: string }
  | { type: 'border-board'; macro: 'TBD' | 'RBD' | 'BBD' | 'LBD'; edge: 'top' | 'right' | 'bottom' | 'left'; note?: string }
  | { type: 'edge-text-board'; note?: string }
  | { type: 'bracket-board'; note?: string }

export interface DocSection {
  /** 页内锚点；同一页内必须唯一。 */
  id: string
  title: string
  blocks: DocBlock[]
}

export interface MacroDocPage {
  /** 路由参数，最终地址为 /macro-rules/<slug>；前言使用空 slug 对应的根路由。 */
  slug: string
  title: string
  /** 左侧导航中的短标题；省略时使用 title。 */
  navLabel?: string
  kicker: string
  group: DocGroupId
  summary: string
  sections: DocSection[]
}

/** 供页尾“上一步 / 下一步”和侧边栏使用的一份有序页面清单。 */
export interface MacroDocNavGroup extends DocGroup {
  pages: MacroDocPage[]
}
