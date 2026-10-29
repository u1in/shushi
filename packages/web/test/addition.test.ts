import { describe, expect, test } from 'vitest'

import { computeAddition } from '@vertical-arithmetic/calculators'
import { createAdditionGridScene } from '@vertical-arithmetic/layout'
import { resolveGridMetrics } from '@vertical-arithmetic/grid'

describe('computeAddition', () => {
  test('计算规则文档中的 356 + 278，并逐列记录进位', () => {
    const result = computeAddition('356', '278')
    expect(result.addendDigits).toEqual(['356', '278'])
    expect(result.sumDigits).toBe('634')
    expect(result.steps).toEqual([
      { columnFromRight: 0, addendDigits: ['6', '8'], carryIn: 0, total: 14, resultDigit: '4', carryOut: 1 },
      { columnFromRight: 1, addendDigits: ['5', '7'], carryIn: 1, total: 13, resultDigit: '3', carryOut: 1 },
      { columnFromRight: 2, addendDigits: ['3', '2'], carryIn: 1, total: 6, resultDigit: '6', carryOut: 0 },
    ])
  })

  test('保留最高位进位、规范化前导零，并支持连加', () => {
    expect(computeAddition('95', '15').sumDigits).toBe('110')
    expect(computeAddition('000', '0012')).toMatchObject({ addendDigits: ['0', '12'], sumDigits: '12' })
    const chained = computeAddition(['5', '8', '9'])
    expect(chained.sumDigits).toBe('22')
    expect(chained.steps[0]).toMatchObject({ addendDigits: ['5', '8', '9'], total: 22, carryOut: 2 })
  })

  test('拒绝不足两个加数和非法输入，并支持超长数字', () => {
    expect(() => computeAddition('12')).toThrow(/至少需要两个加数/)
    expect(() => computeAddition('12', ' 3')).toThrow(/第 2 个加数请输入非负整数/)
    const value = `9${'0'.repeat(120)}`
    expect(computeAddition(value, '1').sumDigits).toBe(`9${'0'.repeat(119)}1`)
  })
})

describe('createAdditionGridScene', () => {
  test('用通用网格表达右对齐加数、零高进位行和横线', () => {
    const scene = createAdditionGridScene(computeAddition('356', '278'), {
      cellWidth: 32, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: true,
      showCarrySteps: true,
    })
    expect(scene.rows[2]).toMatchObject({ id: 'carry-row', size: 0 })
    expect(scene.rows[3]).toMatchObject({ id: 'sum-bar-row', size: 0 })
    expect(scene.columns.filter(({ id }) => id.startsWith('carry-boundary'))).toHaveLength(2)
    expect(scene.cells.filter(({ content }) => content?.kind === 'text' && content.styleToken === 'addition.carry')).toHaveLength(2)
    expect(scene.cells.find(({ id }) => id === 'carry-0')?.position.row).toBe(2)
    expect(scene.cells.find(({ id }) => id === 'addition-sum-bar')).toMatchObject({ position: { column: 0, columnSpan: 6 } })
    expect(scene.cells.some(({ content }) => content?.kind === 'text' && content.styleToken === 'addition.sum' && content.text === '6')).toBe(true)
    expect(resolveGridMetrics(scene).height).toBeGreaterThan(0)
  })

  test('隐藏进位不改变零高轨道或网格尺寸，横线固定包括加号列', () => {
    const calculation = computeAddition('356', '278')
    const common = { cellWidth: 32, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false }
    const shown = createAdditionGridScene(calculation, { ...common, showCarrySteps: true })
    const hidden = createAdditionGridScene(calculation, { ...common, showCarrySteps: false })
    expect(hidden.rows[2]).toMatchObject({ id: 'carry-row', size: 0 })
    expect(hidden.cells.some(({ content }) => content?.kind === 'text' && content.styleToken === 'addition.carry')).toBe(false)
    expect(resolveGridMetrics(shown).height).toBe(resolveGridMetrics(hidden).height)
    expect(hidden.cells.find(({ id }) => id === 'addition-sum-bar')).toMatchObject({ position: { column: 0, columnSpan: 6 } })
  })
})
