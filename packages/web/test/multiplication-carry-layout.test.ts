import { describe, expect, it } from 'vitest'
import { computeMultiplication } from '@u1in/shushi-calculators'
import { createMultiplicationGridScene, createMultiplicationMacroSource } from '@u1in/shushi-layout'
import type { GridElement, GridTextContent } from '@u1in/shushi-grid'

/** 乘法进位的跨横线锚点规则，防止 RB 再次落到横线后的下一行。 */
describe('乘法进位布局', () => {
  it('第 0 步只显示操作数和乘法横线，不显示任何部分积', () => {
    const multiplication = computeMultiplication('97', '89')
    const settings = {
      cellWidth: 30,
      rowHeight: 46,
      fontSizeRatio: 1,
      showGuideGrid: false,
      uniformMultiplicationBars: false,
      showCarrySteps: true,
      visibleStepCount: 0,
    }
    const scene = createMultiplicationGridScene(multiplication, settings)

    expect(scene.elements.some(({ styleToken }) => styleToken === 'multiplication.partial-product')).toBe(false)
    expect(scene.elements.some(({ styleToken }) => styleToken === 'multiplication.product')).toBe(false)
    expect(scene.elements.some(({ styleToken }) => styleToken === 'multiplication.input-bar')).toBe(true)
    expect(scene.elements.some(({ styleToken }) => styleToken === 'multiplication.sum-bar')).toBe(false)
  })

  it('常规进位使用 RT，横线后的首行和最终积进位使用上行 RB', () => {
    const multiplication = computeMultiplication('97', '89')
    const settings = {
      cellWidth: 30,
      rowHeight: 46,
      fontSizeRatio: 1,
      showGuideGrid: false,
      uniformMultiplicationBars: false,
      showCarrySteps: true,
    }
    const source = createMultiplicationMacroSource(multiplication, settings)
    const scene = createMultiplicationGridScene(multiplication, settings)
    const carries = scene.elements.filter(
      (element): element is GridElement & { content: GridTextContent } =>
        element.content.kind === 'text' &&
        (element.content.styleToken === 'multiplication.carry' ||
          element.content.styleToken === 'multiplication.addition-carry'),
    )

    expect(source).toContain('RT(')
    expect(source).toContain('RB(')
    expect(carries).toHaveLength(4)
    carries.forEach(({ position, content }) => {
      expect(position.kind).toBe('cell')
      expect(content.fontSizeRatio).toBe(0.42)
    })
    expect(carries.filter(({ content }) => content.verticalAlign === 'top')).toHaveLength(1)
    expect(carries.filter(({ content }) => content.verticalAlign === 'bottom')).toHaveLength(3)
  })
})
