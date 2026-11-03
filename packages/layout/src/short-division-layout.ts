/** Short-division macro layout: uses the public DIV/VALUE grammar exclusively. */
import type { GridScene } from '@u1in/shushi-grid'
import type { ShortDivisionComputation } from '@u1in/shushi-calculators'
import type { ShortDivisionRenderSettings } from './types'
import { compileCalculatorMacro, macroLiteral, macroOption } from './macro-source'

const value = (text: string, token: string): string => `VALUE(${macroLiteral(text)}, ${macroOption('style', token)})`
const divisor = (text: string): string => `CELL(MM(${macroLiteral(text)}, ${macroOption('style', 'short-division.divisor')}))`

/**
 * `DIV` 和 `VALUE` 是短除法唯一的结构真相；自动结果只填写这些公开命令。
 * 进制转换余数同样写成普通 VALUE 组，用户复制源码后可以继续编辑。
 */
export const createShortDivisionMacroSource = (
  computation: ShortDivisionComputation,
  settings: ShortDivisionRenderSettings,
): string => {
  const visibleStepCount = Math.min(Math.max(settings.visibleStepCount ?? computation.steps.length, 0), computation.steps.length)
  const visibleSteps = computation.steps.slice(0, visibleStepCount)
  const showRemainders = computation.mode === 'baseConversion' && settings.showRemainders
  const groupCount = computation.inputValues.length + (showRemainders ? 2 : 0)
  const children = visibleSteps.map((step) => {
    const groups = step.dividends.map((item) => value(item, 'short-division.dividend'))
    if (showRemainders) groups.push(value('余', 'short-division.remainder-label'), value(step.remainders[0], 'short-division.remainder'))
    return `ROW(${divisor(step.divisor)}, DIV(${macroOption('separatorStyle', 'short-division.separator')}, ${macroOption('barStyle', 'short-division.bar')}), ${groups.join(', ')})`
  })
  const resultValues = settings.visibleStepCount === undefined || visibleStepCount >= computation.steps.length
    ? computation.finalValues
    : (visibleSteps.at(-1)?.quotients ?? [])
  const finalGroups = resultValues.map((item) => value(item, 'short-division.final'))
  while (finalGroups.length < groupCount) finalGroups.push(value('', 'short-division.final'))
  children.push(`ROW(${finalGroups.join(', ')})`)
  // DIV 宏自行决定半格轨道和阶梯；columns 对它没有意义，因此不写入普通 GRID 配置。
  const options = [
    // 短除法也沿用同一套内容级颜色，确保 DOM 与 SVG 不再分叉。
    macroOption('autoColor', true),
    macroOption('unitWidth', settings.cellWidth),
    macroOption('unitHeight', settings.rowHeight),
    macroOption('fontSizeRatio', settings.fontSizeRatio),
    macroOption('paddingX', 20),
    macroOption('paddingY', 12),
    macroOption('showGrid', settings.showGuideGrid),
    macroOption('ariaLabel', `短除法：${computation.inputValues.join('、')}`),
  ]
  return `GRID(${[...options, ...children].join(', ')})`
}

/** @deprecated 使用宏源码编译；保留名称以兼容既有调用方。 */
export const createShortDivisionGridScene = (
  computation: ShortDivisionComputation,
  settings: ShortDivisionRenderSettings,
): GridScene => compileCalculatorMacro(createShortDivisionMacroSource(computation, settings))
