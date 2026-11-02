import { describe, expect, test } from 'vitest'
import { AUTO_COLOR_THEME, compileMacro, formatMacro, minifyMacro, parseMacro } from '@vertical-arithmetic/macro'

describe('网格宏编译器', () => {
  test('顶层分号将裸文字自动补成 MM，再包裹为 ROW 和隐式 GRID', () => {
    const scene = compileMacro('5,6;×,5,6;LN;')

    expect(scene.columns).toHaveLength(3)
    expect(scene.rows).toHaveLength(2)
    expect(scene.elements.some(({ content }) => content.kind === 'line')).toBe(true)
  })

  test('分号行简写保留 LINE，并允许末尾分号', () => {
    const scene = compileMacro('MM(5);LINE(KV(span,full));MM(6)')
    const line = scene.elements.find(({ content }) => content.kind === 'line')

    expect(line).toMatchObject({
      position: { kind: 'edge', column: 0, row: 0, columnSpan: 1, edge: 'bottom' },
    })
    expect(scene.rows).toHaveLength(2)
  })

  test('方括号首项可省略 MM，并降级为同格 CELL 图元', () => {
    const scene = compileMacro('5,[6,RB(1)];')
    const cellTexts = scene.elements.filter(({ content }) => content.kind === 'text')

    expect(scene.columns).toHaveLength(2)
    expect(cellTexts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        position: { kind: 'cell', column: 1, row: 0, columnSpan: 1 },
        content: expect.objectContaining({ kind: 'text', text: '6' }),
      }),
      expect.objectContaining({
        position: { kind: 'cell', column: 1, row: 0, columnSpan: 1 },
        content: expect.objectContaining({ kind: 'text', text: '1', horizontalAlign: 'right', verticalAlign: 'bottom' }),
      }),
    ]))
  })

  test('方括号只允许首项省略 MM，后续文字与定位宏必须完整书写', () => {
    expect(() => compileMacro('[5,1];')).toThrow(/只有首项可以省略 MM/)
    expect(() => compileMacro('[5,RB];')).toThrow(/只有首项可以省略 MM/)
    expect(() => compileMacro('[RB(1),5];')).toThrow(/首项必须是 MM/)
    expect(() => compileMacro('[];')).toThrow(/至少需要首项文字/)
  })

  test('EP、LN 与 BK 会在解析时还原为完整的结构宏', () => {
    const scene = compileMacro('5,EP,6;LN;BK,1;')

    expect(scene.rows).toHaveLength(2)
    expect(scene.elements.some(({ content }) => content.kind === 'line')).toBe(true)
    expect(scene.elements.some(({ content }) => content.kind === 'corner')).toBe(true)
    expect(minifyMacro('EMPTY, LINE, BRACKET')).toBe('EP,LN,BK')
  })

  test('顶层 ROW 和 LINE 会自动包裹为隐式 GRID', () => {
    const scene = compileMacro('ROW(MM(5), MM(6)), LINE, ROW(MM(1), MM(2))')

    expect(scene.columns).toHaveLength(2)
    expect(scene.rows).toHaveLength(2)
    expect(scene.elements.some(({ content }) => content.kind === 'line')).toBe(true)
  })

  test('位于源码末尾的裸 LINE 仍被识别为零参数宏', () => {
    const scene = compileMacro('ROW(MM(5)), LINE')
    const line = scene.elements.find(({ content }) => content.kind === 'line')

    expect(line).toMatchObject({
      position: { kind: 'edge', column: 0, row: 0, columnSpan: 1, edge: 'bottom' },
      content: { kind: 'line', color: AUTO_COLOR_THEME.rule.color, thickness: AUTO_COLOR_THEME.rule.thickness },
    })
  })

  test('最长 ROW 推导列数，并把裸定位宏归一化为独立单元格', () => {
    const scene = compileMacro('GRID(ROW(MM(5), MM(6)), ROW(MM(7)))')

    expect(scene.columns).toHaveLength(2)
    expect(scene.rows).toHaveLength(2)
    expect(scene.elements.filter(({ content }) => content.kind === 'text').map(({ position }) => position)).toEqual([
      { kind: 'cell', column: 0, row: 0, columnSpan: 1 },
      { kind: 'cell', column: 1, row: 0, columnSpan: 1 },
      { kind: 'cell', column: 1, row: 1, columnSpan: 1 },
    ])
  })

  test('GRID 默认视觉参数与首页四则运算器一致', () => {
    const scene = compileMacro('ROW(MM(5))')

    expect(scene.unitWidth).toBe(30)
    expect(scene.unitHeight).toBe(46)
    expect(scene.fontSize).toBe(30)
    expect(scene.padding).toEqual({ top: 12, right: 20, bottom: 12, left: 20 })
    expect(compileMacro('GRID(KV(unitWidth, 40), KV(fontSizeRatio, 1.25), ROW(MM(5)))').fontSize).toBe(50)
  })

  test('CELL 保持同格图元，DOT 降级到右边中点', () => {
    const scene = compileMacro('GRID(ROW(CELL(MM(7), DOT)))')

    expect(scene.elements).toHaveLength(2)
    expect(scene.elements[1]).toMatchObject({
      position: { kind: 'edgeMidpoint', column: 0, row: 0, edge: 'right' },
      content: { kind: 'text', text: '.' },
    })
  })

  test('BRACKET 独占半列宽轨道，并从右上角自动延伸厂字横', () => {
    const scene = compileMacro('GRID(ROW(MM(3), BRACKET, MM(1), MM(4)))')
    const bracket = scene.elements.find(({ content }) => content.kind === 'corner')
    const bracketHead = scene.elements.find(({ id }) => id.startsWith('macro-bracket-head-'))

    expect(scene.columns.map(({ size }) => size)).toEqual([1, 0.5, 1, 1])
    expect(bracket).toMatchObject({
      position: { kind: 'cell', column: 1, row: 0, columnSpan: 1 },
      content: { kind: 'corner', corner: 'bottomRight', radiusRatio: 1, thickness: 2 },
    })
    expect(bracketHead).toMatchObject({
      position: { kind: 'edge', column: 2, row: 0, columnSpan: 2, edge: 'top' },
      content: { kind: 'line', thickness: 2, color: AUTO_COLOR_THEME.bracketRule.color },
    })
  })

  test('非单元格中心的文本默认使用进位教学字号，但不改写颜色 token', () => {
    const scene = compileMacro('GRID(ROW(MM(9), MT(·)))')
    const [middle, annotation] = scene.elements

    expect(middle.content).toMatchObject({ kind: 'text', text: '9' })
    expect((middle.content.kind === 'text' ? middle.content.fontSizeRatio : undefined)).toBeUndefined()
    expect(annotation.content).toMatchObject({ kind: 'text', text: '·', fontSizeRatio: 0.42 })
    expect(annotation.content.kind === 'text' && annotation.content.styleToken).toBeUndefined()
  })

  test('RB 可与 MM 同置于单元格，用作右下角进位标记', () => {
    const scene = compileMacro(`ROW(MM(3), MM(5), MM(6)),
ROW(MM(+), CELL(MM(2), RB(1)), CELL(MM(7), RB(1)), MM(8)),
LINE,
ROW(MM(6), MM(3), MM(4))`)
    const carries = scene.elements.filter(({ content }) => content.kind === 'text' && content.text === '1')

    expect(carries).toHaveLength(2)
    expect(carries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        position: { kind: 'cell', column: 1, row: 1, columnSpan: 1 },
        content: expect.objectContaining({ horizontalAlign: 'right', verticalAlign: 'bottom', fontSizeRatio: 0.42 }),
      }),
      expect.objectContaining({
        position: { kind: 'cell', column: 2, row: 1, columnSpan: 1 },
        content: expect.objectContaining({ horizontalAlign: 'right', verticalAlign: 'bottom', fontSizeRatio: 0.42 }),
      }),
    ]))
  })

  test('LINE 使用受限 STYLE 声明和上一行有效跨度', () => {
    const scene = compileMacro('GRID(KV(autoColor, false), KV(columns, 4), ROW(MM(5), MM(6)), LINE(STYLE(KV(color, "#999"), KV(thickness, 2)), KV(span, previous), KV(style, macro.rule)))')
    const line = scene.elements.find(({ content }) => content.kind === 'line')

    expect(line).toMatchObject({
      position: { kind: 'edge', column: 2, row: 0, columnSpan: 2, edge: 'bottom' },
      content: { kind: 'line', color: '#999', thickness: 2 },
      styleToken: 'macro.rule',
    })
  })

  test('零参数宏可省略括号，显式关闭 autoColor 时 LINE 使用默认黑色基线', () => {
    const scene = compileMacro('GRID(KV(autoColor, false), ROW(MM(5), MM(6)), LINE)')
    const line = scene.elements.find(({ content }) => content.kind === 'line')

    expect(line).toMatchObject({
      position: { kind: 'edge', column: 0, row: 0, columnSpan: 2, edge: 'bottom' },
      content: { kind: 'line', thickness: 2 },
    })
    expect(line?.content.kind === 'line' && line.content.color).toBeUndefined()
    expect(scene.defaultTextStyleToken).toBeUndefined()
    expect(scene.showGuideGrid).toBe(false)
    expect(compileMacro('GRID(KV(showGrid, true), ROW(MM(5)))').showGuideGrid).toBe(true)
  })

  test('单元格边框宏默认复用 LINE 样式，且可独立覆盖', () => {
    const scene = compileMacro('GRID(KV(autoColor, false), ROW(CELL(MM(8), BBD, TBD(STYLE(KV(thickness, 3))))))')
    const border = scene.elements.find(({ content }) => content.kind === 'line')
    const customBorder = scene.elements.filter(({ content }) => content.kind === 'line')[1]

    expect(border).toMatchObject({
      position: { kind: 'edge', column: 0, row: 0, columnSpan: 1, edge: 'bottom' },
      content: { kind: 'line', thickness: 2 },
    })
    expect(customBorder).toMatchObject({
      position: { kind: 'edge', column: 0, row: 0, columnSpan: 1, edge: 'top' },
      content: { kind: 'line', thickness: 3 },
    })
  })

  test('autoColor 默认开启，为运算符、文字行、进位、借位、小数点及所有线段分配固定主题色', () => {
    const scene = compileMacro('GRID(ROW(CELL(MM(5), RB(1)), MM(+), CELL(MM(9), DOT), CELL(MM(7), MT(·)), BRACKET, MM(8)), LINE)')
    const textByValue = (text: string) => scene.elements.find(({ content }) => content.kind === 'text' && content.text === text)
    const lines = scene.elements.filter(({ content }) => content.kind === 'line')
    const bracket = scene.elements.find(({ content }) => content.kind === 'corner')

    expect(textByValue('5')?.content).toMatchObject({ color: AUTO_COLOR_THEME.rowText[0] })
    expect(textByValue('+')?.content).toMatchObject({ color: AUTO_COLOR_THEME.operators['+'] })
    expect(textByValue('.')?.content).toMatchObject({ color: AUTO_COLOR_THEME.decimal })
    expect(textByValue('·')?.content).toMatchObject({ color: AUTO_COLOR_THEME.borrow[0] })
    expect(scene.elements.filter(({ content }) => content.kind === 'text' && content.text === '1')[0]?.content).toMatchObject({ color: AUTO_COLOR_THEME.carry[0] })
    const bracketHead = lines.find(({ id }) => id.startsWith('macro-bracket-head-'))
    const ordinaryLine = lines.find(({ id }) => id.startsWith('macro-line-'))
    expect(lines).toHaveLength(2)
    expect(ordinaryLine?.content).toMatchObject({ color: AUTO_COLOR_THEME.rule.color, thickness: AUTO_COLOR_THEME.rule.thickness })
    expect(bracketHead?.content).toMatchObject({ color: AUTO_COLOR_THEME.bracketRule.color, thickness: AUTO_COLOR_THEME.bracketRule.thickness })
    expect(bracket?.content).toMatchObject({ color: AUTO_COLOR_THEME.bracketRule.color, thickness: AUTO_COLOR_THEME.bracketRule.thickness })
  })

  test('相邻普通文本行使用色轮跳跃后的不同颜色', () => {
    const scene = compileMacro('ROW(MM(1)), ROW(MM(2)), ROW(MM(3))')
    const colors = scene.elements
      .filter(({ content }) => content.kind === 'text')
      .map(({ content }) => content.kind === 'text' ? content.color : undefined)

    expect(colors).toEqual([AUTO_COLOR_THEME.rowText[0], AUTO_COLOR_THEME.rowText[1], AUTO_COLOR_THEME.rowText[2]])
    expect(new Set(colors).size).toBe(3)
  })

  test('显式列数不足会报错，字符串和括号也有清晰诊断', () => {
    expect(() => compileMacro('GRID(KV(columns, 1), ROW(MM(5), MM(6)))')).toThrow(/小于最长 ROW/)
    expect(() => parseMacro('GRID(ROW(MM(5))')).toThrow(/缺少结束括号/)
  })

  test('格式化宏源码时保留隐式 GRID，并为嵌套函数增加缩进', () => {
    expect(formatMacro('ROW(CELL(MM(5),MT(·)),MM(2)),LINE,ROW(MM(3))')).toBe(`ROW(
  CELL(
    MM(5),
    MT(·)
  ),
  MM(2)
),
LN,
ROW(
  MM(3)
)`)
  })

  test('格式化与去格式化保留分号行简写，不重新写出 ROW', () => {
    expect(formatMacro('MM(5),MM(6);LINE;CELL(MM(7),DOT);')).toBe(`5, 6;
LN;
CELL(
  MM(7),
  DOT
);`)
    expect(minifyMacro(' MM(5), MM(6); LINE; MM(7) ')).toBe('5,6;LN;7;')
  })

  test('格式化与去格式化会使用 MM 与 CELL 的安全简写', () => {
    expect(formatMacro('MM(5),[MM(6),RB(1)];')).toBe('5, [6, RB(1)];')
    expect(minifyMacro('MM(5), [MM(6), RB(1)];')).toBe('5,[6,RB(1)];')
  })

  test('去格式化会移除换行和多余空格，同时保持显式 GRID', () => {
    expect(minifyMacro(` GRID(
  ROW( MM(5), CELL( MM(6), MT(·) ) ),
  LINE(KV(span, full))
) `)).toBe('GRID(ROW(MM(5),CELL(MM(6),MT(·))),LN(KV(span,full)))')
  })
})
