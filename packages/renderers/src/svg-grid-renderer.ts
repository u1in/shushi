/** SVG grid renderer: materializes the shared GridScene render tree in the DOM. */
import { createSvgRenderTree } from './svg-renderer-core'
import type { SvgRenderNode } from './svg-renderer-core'
import type { GridScene } from '@u1in/shushi-grid'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

const createSvgNode = (definition: SvgRenderNode): SVGElement => {
  const node = document.createElementNS(SVG_NAMESPACE, definition.name)
  Object.entries(definition.attributes).forEach(([property, value]) => {
    if (value !== undefined) node.setAttribute(property, String(value))
  })
  if (definition.text !== undefined) node.textContent = definition.text
  definition.children?.forEach((child) => node.appendChild(createSvgNode(child)))
  return node
}

/** 创建 SVG、绘制 GridScene 并返回该 SVG 元素。 */
export const renderSvgGrid = (scene: GridScene): SVGSVGElement =>
  createSvgNode(createSvgRenderTree(scene)) as SVGSVGElement
