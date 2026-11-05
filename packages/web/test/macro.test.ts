import { describe, expect, test } from 'vitest'
import {
  AUTO_COLOR_THEME,
  compileMacro,
  completeMacro,
  createMacroAstInspection,
  formatMacro,
  minifyMacro,
  minifyMacroForCopy,
  minifyMacroForCopyAst,
  parseMacro,
  unformatMacro,
} from '@u1in/shushi-macro'

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

  test('方括号首项可直接使用完整定位宏，表示没有正文的同格标记', () => {
    const scene = compileMacro('[RB(1)];')

    expect(scene.elements).toEqual(expect.arrayContaining([
      expect.objectContaining({
        position: { kind: 'cell', column: 0, row: 0, columnSpan: 1 },
        content: expect.objectContaining({ kind: 'text', text: '1', horizontalAlign: 'right', verticalAlign: 'bottom' }),
      }),
    ]))
    expect(minifyMacro('CELL(RB(1));')).toBe('RB(1);')
  })

  test('方括号只允许首项省略 MM，后续文字与定位宏必须完整书写', () => {
    expect(() => compileMacro('[5,1];')).toThrow(/只有首项可以省略 MM/)
    expect(() => compileMacro('[5,RB];')).toThrow(/只有首项可以省略 MM/)
    expect(() => compileMacro('[RB(1),5];')).toThrow(/只有首项可以省略 MM/)
    expect(() => compileMacro('[];')).toThrow(/至少需要一个图元/)
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

  test('GRID 默认视觉参数与首页运算器一致', () => {
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

  test('DIV 在半格 GRID 中根据 VALUE 自动生成短除法阶梯与合并数字格', () => {
    const scene = compileMacro(`GRID(
  KV(trackUnit, half),
  KV(autoColor, false),
  ROW(MM(2), DIV, VALUE(60)),
  ROW(MM(2), DIV, VALUE(30)),
  ROW(MM(3), DIV, VALUE(15)),
  ROW(VALUE(5))
)`)
    const separators = scene.elements.filter(({ id }) => id.startsWith('macro-div-separator-'))
    const bars = scene.elements.filter(({ id }) => id.startsWith('macro-div-bar-'))
    const firstDigit = scene.elements.find(({ content }) => content.kind === 'text' && content.text === '6')

    expect(scene.columns).toHaveLength(8)
    expect(scene.columns.every(({ size }) => size === 0.5)).toBe(true)
    expect(separators.map(({ position }) => position)).toEqual([
      { kind: 'edge', column: 2, row: 0, edge: 'left' },
      { kind: 'edge', column: 3, row: 1, edge: 'left' },
      { kind: 'edge', column: 4, row: 2, edge: 'left' },
    ])
    expect(bars).toHaveLength(3)
    expect(firstDigit).toMatchObject({ position: { kind: 'cell', column: 4, row: 0, columnSpan: 2 } })
    expect(scene.elements.filter(({ content }) => content.kind === 'text' && content.text === '5' && content.styleToken === undefined).at(-1)).toMatchObject({
      position: { kind: 'cell', column: 6, row: 3, columnSpan: 2 },
    })
  })

  test('DIV 自动提升为半格模式，无需 trackUnit 声明', () => {
    const shorthand = compileMacro('2,DIV,VALUE(60);2,DIV,VALUE(30);3,DIV,VALUE(15);VALUE(5);')
    const explicitFull = compileMacro('GRID(KV(trackUnit, full), ROW(MM(2), DIV, VALUE(60)), ROW(VALUE(5)))')

    expect(shorthand.columns).toHaveLength(8)
    expect(shorthand.rows).toHaveLength(4)
    expect(shorthand.columns.every(({ size }) => size === 0.5)).toBe(true)
    expect(explicitFull.columns.every(({ size }) => size === 0.5)).toBe(true)
    expect(() => compileMacro('GRID(ROW(MM(2), DIV, VALUE(60)))')).toThrow(/最后一行/)
    expect(() => compileMacro('GRID(ROW(MM(2), DIV, VALUE(60)), ROW(VALUE(30), VALUE(42)))')).toThrow(/数量必须一致/)
  })

  test('最大公约数分号写法自动保留多 VALUE 组', () => {
    const scene = compileMacro('2,DIV,VALUE(60),VALUE(84);2,DIV,VALUE(30),VALUE(42);3,DIV,VALUE(15),VALUE(21);VALUE(5),VALUE(7);')

    expect(scene.columns).toHaveLength(13)
    expect(scene.rows).toHaveLength(4)
    expect(scene.columns.every(({ size }) => size === 0.5)).toBe(true)
  })

  test('多 VALUE 组自动保留半格空隙，适用于最大公约数短除法', () => {
    const scene = compileMacro('GRID(KV(trackUnit, half), KV(autoColor, false), ROW(MM(2), DIV, VALUE(60), VALUE(84)), ROW(VALUE(3), VALUE(7)))')
    const firstGroupLastDigit = scene.elements.find(({ content }) => content.kind === 'text' && content.text === '0')
    const secondGroupFirstDigit = scene.elements.find(({ content }) => content.kind === 'text' && content.text === '8')

    expect(firstGroupLastDigit).toMatchObject({ position: { kind: 'cell', column: 4, row: 0, columnSpan: 2 } })
    expect(secondGroupFirstDigit).toMatchObject({ position: { kind: 'cell', column: 7, row: 0, columnSpan: 2 } })
  })

  test('非单元格中心的文本默认使用进位教学字号，但不改写颜色 token', () => {
    const scene = compileMacro('GRID(ROW(MM(9), MT(·)))')
    const [middle, annotation] = scene.elements

    expect(middle.content).toMatchObject({ kind: 'text', text: '9' })
    expect((middle.content.kind === 'text' ? middle.content.fontSizeRatio : undefined)).toBeUndefined()
    expect(annotation.content).toMatchObject({ kind: 'text', text: '·', fontSizeRatio: 0.42 })
    expect(annotation.content.kind === 'text' && annotation.content.styleToken).toBeUndefined()
  })

  test('MTD 是 MT(·) 的零参数简写，并保持借位锚点、字号与配色', () => {
    const compact = compileMacro('GRID(ROW(CELL(MM(3), MTD), CELL(MM(5), MTD())))')
    const explicit = compileMacro('GRID(ROW(CELL(MM(3), MT(·)), CELL(MM(5), MT(·))))')
    const annotations = compact.elements.filter(({ content }) => content.kind === 'text' && content.text === '·')

    expect(annotations).toHaveLength(2)
    expect(annotations[0]).toMatchObject({
      position: { kind: 'cell', column: 0, row: 0, columnSpan: 1 },
      content: {
        horizontalAlign: 'center', verticalAlign: 'top', fontSizeRatio: 0.42,
        color: AUTO_COLOR_THEME.borrow[0],
      },
    })
    expect(compact.elements).toEqual(explicit.elements)
    expect(formatMacro('[3,MTD];')).toBe('[3, MTD];')
    expect(minifyMacro('[3, MTD];')).toBe('[3,MTD];')

    const shorthand = compileMacro('[3, MTD];')
    expect(shorthand.elements.find(({ content }) => content.kind === 'text' && content.text === '·')).toMatchObject({
      position: { kind: 'cell', column: 0, row: 0, columnSpan: 1 },
      content: { horizontalAlign: 'center', verticalAlign: 'top' },
    })
  })

  test('MTD 不接受文字参数，但可带 KV 配置', () => {
    expect(() => compileMacro('GRID(ROW(CELL(MM(3), MTD(·))))')).toThrow(/MTD.*零参数/)
    const scene = compileMacro('GRID(KV(autoColor, false), ROW(CELL(MM(3), MTD(KV(style, borrow.dot)), KV(columnSpan, 2))))')
    const annotation = scene.elements.find(({ content }) => content.kind === 'text' && content.text === '·')

    expect(annotation).toMatchObject({
      position: { kind: 'cell', column: 0, row: 0, columnSpan: 2 },
      content: { horizontalAlign: 'center', verticalAlign: 'top', styleToken: 'borrow.dot' },
    })
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

  test('VALUE 可保留语义样式，并允许末行使用空数值组占位', () => {
    const scene = compileMacro('GRID(KV(autoColor, false), ROW(MM(2), DIV, VALUE(13, KV(style, short-division.dividend)), VALUE(余), VALUE(1)), ROW(VALUE(6, KV(style, short-division.final)), VALUE(""), VALUE("")))')
    expect(scene.elements.some(({ content }) => content.kind === 'text' && content.styleToken === 'short-division.dividend')).toBe(true)
    expect(scene.elements.some(({ content }) => content.kind === 'text' && content.styleToken === 'short-division.final')).toBe(true)
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

  test('完整形式会展开 GRID、ROW、CELL 和定位宏名称', () => {
    const source = '5,[6,RB(1)];LN;'
    const complete = completeMacro(source)

    expect(complete).toContain('GRID(')
    expect(complete).toContain('ROW(')
    expect(complete).toContain('CELL(')
    expect(complete).toContain('MM(6)')
    expect(complete).toContain('LINE')
    expect(complete).not.toContain('[')
    expect(complete).not.toContain('LN')
    expect(compileMacro(complete)).toEqual(compileMacro(source))
  })

  test('去格式化只移除空白，不执行最简形式的语法糖和默认配置省略', () => {
    const source = [
      'GRID(',
      '  KV(showGrid, true),',
      '  ROW(CELL(MM(5), RB(1)), LINE())',
      ')',
    ].join('\n')

    expect(unformatMacro(source)).toBe('GRID(KV(showGrid,true),ROW(CELL(MM(5),RB(1)),LN))')
    expect(unformatMacro(source)).not.toContain('[')
    expect(unformatMacro(source)).toContain('KV(showGrid,true)')
  })

  test('格式化与去格式化会使用 MM 与 CELL 的安全简写', () => {
    expect(formatMacro('MM(5),[MM(6),RB(1)];')).toBe('5, [6, RB(1)];')
    expect(minifyMacro('MM(5), [MM(6), RB(1)];')).toBe('5,[6,RB(1)];')
  })

  test('最简化会省略单条全宽横线的 span，并降级为分号行和语法糖', () => {
    const source = ` GRID(
  ROW( MM(5), CELL( MM(6), MT(·) ) ),
  LINE(KV(span, full))
) `
    const compact = minifyMacro(source)
    expect(compact).toBe('5,[6,MT(·)];LN;')
    expect(compileMacro(compact)).toEqual(compileMacro(source))
  })

  test('最简化会把多条共同的全宽横线提升为 GRID 的 lineSpan', () => {
    const source = 'GRID(ROW(MM(5)),LINE(KV(span,full)),ROW(MM(6)),LINE(KV(span,full)),ROW(MM(7)))'
    const compact = minifyMacro(source)

    expect(compact).toBe('GRID(KV(lineSpan,full),ROW(MM(5)),LN,ROW(MM(6)),LN,ROW(MM(7)))')
    expect(compileMacro(compact)).toEqual(compileMacro(source))
  })

  test('最简化只为多条横线中跨度不同的横线保留 span', () => {
    const source = 'GRID(ROW(MM(5)),LINE(KV(span,full)),ROW(MM(6)),LINE(KV(span,previous)),ROW(MM(7)))'
    const compact = minifyMacro(source)

    expect(compact).toBe('5;LN(KV(span,full));6;LN;7;')
    expect(compileMacro(compact)).toEqual(compileMacro(source))
  })

  test('最简化保留单条横线中与全宽不同的 previous span', () => {
    const source = 'GRID(KV(columns,3),ROW(MM(5),MM(6)),LINE(KV(span,previous)))'
    const compact = minifyMacro(source)

    expect(compact).toBe('GRID(KV(columns,3),ROW(MM(5),MM(6)),LN(KV(span,previous)))')
    expect(compileMacro(compact)).toEqual(compileMacro(source))
  })

  test('最简化会去除只含一个图元的 CELL 外壳', () => {
    expect(minifyMacro('[1];')).toBe('1;')
    expect(minifyMacro('CELL(MM(1));')).toBe('1;')
    expect(minifyMacro('[RB(1)];')).toBe('RB(1);')
  })

  test('最简化带 GRID 配置的完整宏时保留必要的 GRID 根节点', () => {
    expect(minifyMacro(` GRID(
  KV(showGrid, true),
  ROW( MM(5), CELL( MM(6), MT(·) ) )
 ) `)).toBe('GRID(KV(showGrid,true),ROW(MM(5),[6,MT(·)]))')
  })

  test('最简化会把纯图元 CELL 缩为以图元开头的方括号', () => {
    const source = 'GRID(ROW(CELL(BRACKET, KV(style, division.bracket)), CELL(DOT, KV(style, division.decimal-separator))))'
    const compact = minifyMacro(source)

    expect(compact).toBe('[BK,KV(style,division.bracket)],[DOT,KV(style,division.decimal-separator)];')
    expect(compileMacro(compact)).toEqual(compileMacro(source))
  })

  test('最简化会省略 GRID、ROW、LINE、CELL 的默认和可推导 KV', () => {
    const source = `GRID(
  KV(columns, 2), KV(trackUnit, full), KV(unitWidth, 30), KV(unitHeight, 46),
  KV(paddingX, 20), KV(paddingY, 12), KV(fontSizeRatio, 1), KV(fontSize, 30),
  KV(showGrid, false), KV(autoColor, true), KV(ariaLabel, "宏公式预览"),
  ROW(MM(5), MM(6), KV(align, right)),
  LINE(KV(span, previous)),
  ROW(CELL(MM(7), KV(columnSpan, 1)))
)`
    const compact = minifyMacro(source)

    expect(compact).toBe('5,6;LN;7;')
    expect(compileMacro(compact)).toEqual(compileMacro(source))
  })

  test('复制导出 API 会移除计算器页面专属 aria 与 style，并保留自动配色后的可见结果', () => {
    const source = 'GRID(KV(columns,2),KV(autoColor,true),KV(ariaLabel,"加法 5 加 6"),ROW(MM(5,KV(style,addition.addend)),CELL(MM(6,KV(style,addition.addend)),RB(1,KV(style,addition.carry)))))'
    const compact = minifyMacroForCopy(source)

    expect(compact).toBe('5,[6,RB(1)];')
    expect(minifyMacroForCopyAst(parseMacro(source))).toBe(compact)
    expect(compact).not.toContain('KV(')
    const toVisibleElements = (value: string) => compileMacro(value).elements.map(({ position, content }) => ({
      position,
      content: content.kind === 'text' ? (({ styleToken: _, ...visibleContent }) => visibleContent)(content) : content,
    }))
    expect(toVisibleElements(compact)).toEqual(
      toVisibleElements(source),
    )
    expect(minifyMacroForCopy('GRID(KV(unitWidth,44),KV(ariaLabel,"演示"),ROW(MM(5,KV(style,addition.addend))))')).toBe(
      'GRID(KV(unitWidth,44),ROW(MM(5)))',
    )
  })

  test('最简化会保留非默认 GRID 配置和 ROW 左对齐', () => {
    const source = 'GRID(KV(columns, 3), KV(showGrid, true), ROW(MM(5), MM(6), KV(align, left)), LINE(KV(span, full)))'
    const compact = minifyMacro(source)

    expect(compact).toBe('GRID(KV(columns,3),KV(showGrid,true),ROW(MM(5),MM(6),KV(align,left)),LN)')
    expect(compileMacro(compact)).toEqual(compileMacro(source))
  })

  test('AST 检查器可从渲染元素回查文字节点，并只更新被点击的数据', () => {
    const inspection = createMacroAstInspection('GRID(ROW(MM(3), CELL(MM(5), RB(1))), LINE, ROW(MM(8)))')
    const textElement = inspection.scene.elements.find(({ content }) => content.kind === 'text' && content.text === '5')

    expect(textElement).toBeDefined()
    const reference = inspection.references[textElement!.id]
    expect(reference).toMatchObject({ node: { kind: 'call', name: 'MM' }, text: '5' })
    expect(reference.literalPath).toBeDefined()

    const updated = inspection.updateElementText(textElement!.id, '9')
    expect(updated.minifiedSource).toBe('3,[9,RB(1)];LN;8;')
    expect(updated.sourceStyle).toBe('formatted')
    expect(updated.source).toBe(formatMacro('GRID(ROW(MM(3), CELL(MM(9), RB(1))), LINE, ROW(MM(8)))'))
    expect(updated.scene.elements.some(({ content }) => content.kind === 'text' && content.text === '9')).toBe(true)
    expect(updated.scene.elements.some(({ content }) => content.kind === 'text' && content.text === '5')).toBe(false)
  })

  test('AST 检查器会沿用最简源码输入框风格回写', () => {
    const inspection = createMacroAstInspection('3,[5,RB(1)];LN;8;')
    const textElement = inspection.scene.elements.find(({ content }) => content.kind === 'text' && content.text === '5')

    const updated = inspection.updateElementText(textElement!.id, '9')
    expect(updated.sourceStyle).toBe('minified')
    expect(updated.source).toBe('3,[9,RB(1)];LN;8;')
  })

  test('AST 检查器会保留格式化最简源码的分号行形式', () => {
    const source = formatMacro('3,[5,RB(1)];LN;8;')
    const inspection = createMacroAstInspection(source)
    const textElement = inspection.scene.elements.find((element) => element.content.kind === 'text' && element.content.text === '5')

    expect(inspection.sourceStyle).toBe('formatted')
    expect(inspection.source).toBe(source)
    expect(textElement).toBeDefined()

    const updated = inspection.updateElementText(textElement!.id, '9')

    expect(updated.source).toBe(formatMacro('3,[9,RB(1)];LN;8;'))
    expect(updated.source).not.toContain('GRID(')
  })

  test('AST 检查器会保留无文字图元的反查信息，并拒绝修改其文字', () => {
    const inspection = createMacroAstInspection('GRID(ROW(MM(3)), LINE, ROW(MM(8)))')
    const lineElement = inspection.scene.elements.find(({ content }) => content.kind === 'line')

    expect(lineElement).toBeDefined()
    expect(inspection.references[lineElement!.id]?.node).toMatchObject({ kind: 'symbol', name: 'LINE' })
    expect(() => inspection.updateElementText(lineElement!.id, '9')).toThrow(/不包含可编辑文字/)
  })

})
