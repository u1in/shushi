/** SSR SVG renderer: serializes the shared SVG render tree without a DOM. */
import { createSvgRenderTree } from './svg-renderer-core'
import type { SvgRenderNode } from './svg-renderer-core'
import type { GridScene } from '@u1in/shushi-grid'

/** XML 转义同时覆盖属性值和文本节点，避免用户输入破坏 SVG 结构。 */
const escapeXml = (value: string | number): string =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
      })[character] ?? character,
  )

const serializeAttributes = (attributes: SvgRenderNode['attributes']): string =>
  Object.entries(attributes)
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => ` ${name}="${escapeXml(value as string | number)}"`)
    .join('')

const serializeNode = (node: SvgRenderNode): string => {
  const text = node.text === undefined ? '' : escapeXml(node.text)
  const children = node.children?.map(serializeNode).join('') ?? ''
  return `<${node.name}${serializeAttributes(node.attributes)}>${text}${children}</${node.name}>`
}

/** 在 Node.js、SSR 或构建脚本中生成完整 SVG 字符串，不读取 document 或其他浏览器 API。 */
export const renderSvgString = (scene: GridScene): string => serializeNode(createSvgRenderTree(scene))
