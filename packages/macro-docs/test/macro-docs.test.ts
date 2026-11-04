import { describe, expect, test } from 'vitest'
import { compileMacro } from '@u1in/shushi-macro'
import type { DocBlock } from '@u1in/shushi-macro-docs'
import {
  getMacroDocNeighbors,
  getMacroDocPath,
  macroDocApiNavGroups,
  macroDocNavGroups,
  macroDocPageBySlug,
  macroDocPages,
} from '@u1in/shushi-macro-docs'

/**
 * 文档即代码：页内所有示例与对照都必须可编译。
 * 这组测试防止改宏语法后文档里留下过期源码。
 */
const requiredSlugs = [
  'intro', 'install', 'quickstart', 'compileMacro', 'compileMacroAst', 'parseMacro', 'formatMacro', 'completeMacro', 'unformatMacro', 'minifyMacro', 'minifyMacroAst', 'minifyMacroForCopy', 'minifyMacroForCopyAst', 'createMacroAstInspection',
  'renderSvgGrid', 'renderSvgString', 'renderDomGrid', 'GridScene', 'resolveGridMetrics', 'getGridPositionRect', 'getGridElementRect',
  'getGridTextAnchor', 'extractVisibleTextRows',
  'createAdditionMacroSource', 'createAdditionGridScene', 'createSubtractionMacroSource', 'createSubtractionGridScene',
  'getDivisionPlaybackStepCount', 'createDivisionMacroSource', 'createDivisionGridScene',
  'getMultiplicationStepCount', 'createMultiplicationMacroSource', 'createMultiplicationGridScene',
  'createShortDivisionMacroSource', 'createShortDivisionGridScene', 'compileCalculatorMacro',
  'createCompositeArithmeticMacroSource', 'getCompositeArithmeticStepCount',
  'computeAddition', 'computeSubtraction', 'computeDivision', 'computeMultiplication', 'computeCompositeArithmetic', 'computeShortDivision',
  'syntax',
  'grid', 'row', 'cell', 'empty', 'line', 'div', 'value', 'style', 'kv',
  'row-shorthand', 'cell-shorthand', 'zero-argument',
  'lt', 'mt', 'mtd', 'rt', 'ml', 'mm', 'mr', 'lb', 'mb', 'rb', 'rbl',
  'dot', 'bracket', 'tbd', 'rbd', 'bbd', 'lbd',
  'examples', 'cautions',
]

interface Snippet {
  page: string
  section: string
  label: string
  code: string
}

const collectSnippets = (block: DocBlock, page: string, section: string): Snippet[] => {
  if (block.type === 'example') {
    return [{ page, section, label: block.title, code: block.code }]
  }
  if (block.type === 'compare') {
    return [
      { page, section, label: block.leftTitle, code: block.leftCode },
      { page, section, label: block.rightTitle, code: block.rightCode },
    ]
  }
  return []
}

const snippets = macroDocPages.flatMap((page) => page.sections.flatMap((section) => (
  section.blocks.flatMap((block) => collectSnippets(block, page.slug, section.id))
)))


/** 只读取单元格正文，忽略 MT/RB/LT 等小号教学标注，按行还原数字。 */
const readNumberRows = (source: string): string[] => {
  const scene = compileMacro(source)
  const rows = new Map<number, Array<{ column: number, text: string }>>()
  for (const element of scene.elements) {
    if (element.content.kind !== 'text') continue
    const position = element.position
    // 小数点定位在右边框中点，不是普通 cell；其余边中点文字不参与数字行还原。
    if (position.kind !== 'cell' && position.kind !== 'edgeMidpoint') continue
    if (position.kind === 'edgeMidpoint' && element.content.text !== '.') continue
    if ((element.content.fontSizeRatio ?? 1) < 0.6) continue
    const cells = rows.get(position.row) ?? []
    cells.push({ column: position.column, text: element.content.text })
    rows.set(position.row, cells)
  }
  return [...rows.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, cells]) => cells.sort((left, right) => left.column - right.column).map(({ text }) => text).join(''))
}

const findCompareCode = (slug: string, sectionTitle: string): string => {
  const section = macroDocPageBySlug.get(slug)?.sections.find(({ title }) => title === sectionTitle)
  const block = section?.blocks.find(
    (item): item is Extract<DocBlock, { type: 'compare' }> => item.type === 'compare',
  )
  if (!block) throw new Error(`未找到对照：${slug} / ${sectionTitle}`)
  return block.leftCode
}

const findExampleCode = (slug: string, title: string): string => {
  const page = macroDocPageBySlug.get(slug)
  const block = page?.sections.flatMap(({ blocks }) => blocks).find(
    (item): item is Extract<DocBlock, { type: 'example' }> => item.type === 'example' && item.title === title,
  )
  if (!block) throw new Error(`未找到示例：${slug} / ${title}`)
  return block.code
}

describe('网格宏文档', () => {
  test('覆盖所有要求的宏、方位宏、符号宏与语法糖页面', () => {
    const missing = requiredSlugs.filter((slug) => !macroDocPageBySlug.has(slug))
    expect(missing).toEqual([])
  })

  test('方位宏、符号宏与纯语法糖分组正确', () => {
    const pagesOf = (groupId: string): string[] => (
      macroDocNavGroups.find(({ id }) => id === groupId)?.pages.map(({ slug }) => slug) ?? []
    )

    expect(pagesOf('technical')).toEqual(['install', 'quickstart'])
    expect(pagesOf('api')).toEqual([
      'shushi', 'compileMacro', 'parseMacro', 'formatMacro', 'completeMacro', 'unformatMacro', 'minifyMacro', 'minifyMacroForCopy', 'createMacroAstInspection',
      'renderDomGrid', 'renderSvgGrid', 'renderSvgString', 'GridScene', 'extractVisibleTextRows',
      'compileMacroAst', 'minifyMacroAst', 'minifyMacroForCopyAst',
      'computeAddition', 'computeSubtraction', 'computeMultiplication', 'computeDivision', 'computeShortDivision', 'computeCompositeArithmetic',
      'createAdditionMacroSource', 'createSubtractionMacroSource', 'createMultiplicationMacroSource', 'createDivisionMacroSource', 'createShortDivisionMacroSource', 'createCompositeArithmeticMacroSource',
      'createAdditionGridScene', 'createSubtractionGridScene', 'createMultiplicationGridScene', 'createDivisionGridScene', 'createShortDivisionGridScene',
      'compileCalculatorMacro', 'resolveGridMetrics', 'getGridPositionRect', 'getGridElementRect', 'getGridTextAnchor',
      'getMultiplicationStepCount', 'getDivisionPlaybackStepCount', 'getCompositeArithmeticStepCount',
    ])
    expect(macroDocApiNavGroups.map(({ title, pages }) => [title, pages.map(({ slug }) => slug)])).toEqual([
      ['常用 API', [
        'shushi', 'compileMacro', 'parseMacro', 'formatMacro', 'completeMacro', 'unformatMacro', 'minifyMacro', 'minifyMacroForCopy', 'createMacroAstInspection',
        'renderDomGrid', 'renderSvgGrid', 'renderSvgString', 'GridScene', 'extractVisibleTextRows',
      ]],
      ['高级 API', [
        'compileMacroAst', 'minifyMacroAst', 'minifyMacroForCopyAst',
        'computeAddition', 'computeSubtraction', 'computeMultiplication', 'computeDivision', 'computeShortDivision', 'computeCompositeArithmetic',
        'createAdditionMacroSource', 'createSubtractionMacroSource', 'createMultiplicationMacroSource', 'createDivisionMacroSource', 'createShortDivisionMacroSource', 'createCompositeArithmeticMacroSource',
        'createAdditionGridScene', 'createSubtractionGridScene', 'createMultiplicationGridScene', 'createDivisionGridScene', 'createShortDivisionGridScene',
        'compileCalculatorMacro', 'resolveGridMetrics', 'getGridPositionRect', 'getGridElementRect', 'getGridTextAnchor',
        'getMultiplicationStepCount', 'getDivisionPlaybackStepCount', 'getCompositeArithmeticStepCount',
      ]],
    ])
    expect(pagesOf('orientation')).toEqual([
      'lt', 'mt', 'mtd', 'rt', 'ml', 'mm', 'mr', 'lb', 'mb', 'rb', 'rbl',
    ])
    expect(pagesOf('symbol')).toEqual(['dot', 'bracket', 'tbd', 'rbd', 'bbd', 'lbd'])
    expect(pagesOf('sugar')).toEqual(['row-shorthand', 'cell-shorthand', 'zero-argument'])
    for (const page of macroDocPages) {
      expect(macroDocNavGroups.some(({ id }) => id === page.group), `${page.slug} 的分组不存在`).toBe(true)
    }
  })

  test('slug 与页内锚点唯一', () => {
    const slugs = macroDocPages.map(({ slug }) => slug)
    expect(new Set(slugs).size).toBe(slugs.length)

    for (const page of macroDocPages) {
      const sectionIds = page.sections.map(({ id }) => id)
      expect(new Set(sectionIds).size, `${page.slug} 存在重复章节 id`).toBe(sectionIds.length)
    }
  })

  test('每个 API 页面使用统一章节顺序并标注代码语言', () => {
    for (const page of macroDocApiNavGroups.flatMap(({ pages }) => pages)) {
      expect(page.sections.map(({ id }) => id), page.slug).toEqual(['name', 'example', 'purpose', 'signature', 'cautions'])
      const codeBlocks = page.sections.flatMap(({ blocks }) => blocks).filter(
        (block): block is Extract<DocBlock, { type: 'code' }> => block.type === 'code',
      )
      expect(codeBlocks.length, `${page.slug} 没有代码块`).toBeGreaterThan(0)
      expect(codeBlocks.every(({ language }) => language === 'typescript' || language === 'css'), page.slug).toBe(true)
    }
  })

  test('所有示例与对照源码都能编译', () => {
    expect(snippets.length).toBeGreaterThan(40)
    for (const snippet of snippets) {
      expect(
        () => compileMacro(snippet.code),
        `${snippet.page} / ${snippet.section} / ${snippet.label}`,
      ).not.toThrow()
    }
  })

  test('标记为等价的完整版与语法糖版输出同一个 GridScene', () => {
    const comparisons = macroDocPages.flatMap((page) => page.sections.flatMap((section) => (
      section.blocks
        .filter((block): block is Extract<DocBlock, { type: 'compare' }> => block.type === 'compare')
        .map((block) => ({ page: page.slug, section: section.id, block }))
    )))

    expect(comparisons.length).toBeGreaterThan(0)
    for (const { page, section, block } of comparisons) {
      const left = compileMacro(block.leftCode)
      const right = compileMacro(block.rightCode)
      if (block.equivalent === false) {
        expect(left, `${page} / ${section} / ${block.leftTitle} 标记为语义差异，但输出完全相同`).not.toEqual(right)
        continue
      }
      expect(left, `${page} / ${section} / ${block.leftTitle}`).toEqual(right)
    }
  })

  test('用户手册不发布练习章节，且页尾翻页链完整', () => {
    for (const page of macroDocPages) {
      for (const section of page.sections) {
        expect(section.id).not.toBe('practice')
      }
    }

    const isTechnical = (group: string): boolean => group === 'technical' || group === 'api'
    const areas = [
      macroDocPages.filter(({ group }) => !isTechnical(group)),
      macroDocPages.filter(({ group }) => isTechnical(group)),
    ]
    for (const areaPages of areas) {
      areaPages.forEach((page, index) => {
        const { previous, next } = getMacroDocNeighbors(page.slug)
        expect(previous?.slug).toBe(areaPages[index - 1]?.slug)
        expect(next?.slug).toBe(areaPages[index + 1]?.slug)
      })
    }

    expect(getMacroDocPath('intro')).toBe('/macro-rules')
    expect(getMacroDocPath('install')).toBe('/macro-api')
    expect(getMacroDocPath('quickstart')).toBe('/macro-api/quickstart')
    expect(getMacroDocNeighbors('install').previous).toBeUndefined()
    expect(getMacroDocNeighbors('getCompositeArithmeticStepCount').next).toBeUndefined()
  })

  test('页面内“继续阅读”链接都能落到文档页', () => {
    const links = macroDocPages.flatMap((page) => page.sections.flatMap((section) => (
      section.blocks.flatMap((block) => (
        block.type === 'cards' ? block.items.flatMap((item) => item.to ? [item.to] : []) : []
      ))
    )))

    const validPaths = new Set(macroDocPages.map(({ slug }) => getMacroDocPath(slug)))
    for (const link of links) {
      expect(validPaths.has(link), `无效的文档链接 ${link}`).toBe(true)
    }
  })
  test('文档中的完整算式符合数学结果', () => {
    const addition = readNumberRows(findCompareCode('examples', '加法：356 + 278 = 634'))
    expect(addition).toEqual(['356', '+278', '634'])
    expect(356 + 278).toBe(634)

    const subtraction = readNumberRows(findExampleCode('mt', '减法借位标记'))
    expect(subtraction).toEqual(['356', '−278', '78'])
    expect(356 - 278).toBe(78)

    const multiplication = readNumberRows(findCompareCode('examples', '乘法：97 × 89 = 8633'))
    expect(multiplication.at(-1)).toBe('8633')
    expect(97 * 89).toBe(8633)

    const bracket = readNumberRows(findExampleCode('bracket', '厂字弯与右侧厂字横'))
    expect(bracket).toEqual(['246', '2492'])
    expect(Number(bracket[1].slice(1)) / Number(bracket[1].slice(0, 1))).toBe(Number(bracket[0]))

    const longDivision = readNumberRows(findCompareCode('examples', '长除法：10230 ÷ 25 = 409.2'))
    expect(longDivision[0]).toBe('409.2')
    expect(longDivision[1]).toBe('2510230.0')
    expect(Number(longDivision[1].slice(2)) / 25).toBeCloseTo(Number(longDivision[0]), 10)
  })

})
