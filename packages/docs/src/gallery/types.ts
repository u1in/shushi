/** 图例文档的框架无关数据，供 VuePress 和 Web 演示共同消费。 */
export type GalleryOperation = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'short-division'

export interface GalleryItem {
  key: string
  name: string
  description: string
  token: string
  tone: string
  source: 'text' | 'rendered-text' | 'edge' | 'cell' | 'scene'
  rows?: boolean
  badgeClass?: string
}

export interface GalleryPage {
  operation: GalleryOperation
  title: string
  eyebrow: string
  intro: string
  sample: string
  items: GalleryItem[]
}
