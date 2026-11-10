/** Composite arithmetic layout: joins single-operation macro rows into one continuous GRID. */
import type { CompositeArithmeticComputation, CompositeArithmeticStep } from '@u1in/shushi-calculators'
import type { GridScene } from '@u1in/shushi-grid'
import { minifyMacroForCopyAst, parseMacro } from '@u1in/shushi-macro'
import type { MacroCall, MacroNode } from '@u1in/shushi-macro'
import { createAdditionMacroSource } from './addition-layout'
import { createMultiplicationMacroSource } from './multiplication-layout'
import { createSubtractionMacroSource } from './subtraction-layout'
import type { CompositeArithmeticRenderSettings } from './types'
import { compileCalculatorMacro, macroGrid } from './macro-source'

interface CompositeArithmeticMacroStep {
  index: number
  operator: CompositeArithmeticStep['operator']
  label: string
  source: string
  visibleStepCount: number | undefined
  isReached: boolean
}

const DEFAULT_SETTINGS: CompositeArithmeticRenderSettings = {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
  useMinimalDecimalResult: false,
  showCarrySteps: true,
  // 组合竖式默认突出连续计算结果；需要教学借位时由调用方显式开启。
  showBorrowSteps: false,
  uniformMultiplicationBars: false,
}

const isCall = (node: MacroNode, name: string): node is MacroCall => node.kind === 'call' && node.name === name

const getNodeValue = (node: MacroNode | undefined): string | undefined =>
  node?.kind === 'literal' ? node.value : node?.kind === 'symbol' ? node.name : undefined

const getGridColumnCount = (source: string): number => {
  // 单项布局统一通过 macroGrid 输出此稳定的场景配置；此处只读取列数，不重新解释其行内容。
  const match = /KV\(columns,\s*(\d+)\)/.exec(source)
  if (!match) throw new Error('组合竖式步骤缺少有效的 GRID(columns) 配置。')
  return Number(match[1])
}

/** 单项宏的 full 横线只覆盖自己数字区；合并后改为 previous，避免扩展到其他步骤的左侧空列。 */
const normalizeLineSpan = (node: MacroNode): MacroNode => {
  if (!isCall(node, 'LINE')) return node
  return {
    ...node,
    arguments: node.arguments.map((argument) =>
      isCall(argument, 'KV') &&
      getNodeValue(argument.arguments[0]) === 'span' &&
      getNodeValue(argument.arguments[1]) === 'full'
        ? { ...argument, arguments: [argument.arguments[0], { kind: 'literal', value: 'previous' }] }
        : argument,
    ),
  }
}

/** 读取减法第一行中的借位点；数字本身会被复用，只有这些教学标记需要叠加到上一段结果行。 */
const getBorrowMarkers = (node: MacroNode): MacroNode[] => {
  if (node.kind === 'symbol') return node.name === 'MTD' ? [node] : []
  if (node.kind !== 'call') return []
  if (node.name === 'MTD') return [node]
  return node.arguments.flatMap(getBorrowMarkers)
}

/** 将借位点叠到已有结果单元格；结果行可能是正文、CELL 或空占位，三者都保持同一格坐标。 */
const appendBorrowMarkers = (target: MacroNode, markers: MacroNode[]): MacroNode => {
  if (markers.length === 0) return target
  if (isCall(target, 'CELL')) return { ...target, arguments: [...target.arguments, ...markers] }
  if (isCall(target, 'EMPTY') || (target.kind === 'symbol' && target.name === 'EMPTY')) {
    return { kind: 'call', name: 'CELL', arguments: markers }
  }
  return { kind: 'call', name: 'CELL', arguments: [target, ...markers] }
}

/**
 * 后续减法的被减数行不重复写入，但借位点属于这一步的教学过程。
 * 两行均按右对齐列数编排，故从末尾对齐后可安全把 MTD 合并到上一段最终结果行。
 */
const mergeBorrowMarkersIntoPreviousResult = (children: MacroNode[], minuendRow: MacroCall): void => {
  let resultRowIndex = -1
  for (let index = children.length - 1; index >= 0; index -= 1) {
    if (!isCall(children[index], 'ROW')) continue
    resultRowIndex = index
    break
  }
  const resultRow = children[resultRowIndex]
  if (!isCall(resultRow, 'ROW')) throw new Error('组合减法缺少可复用的上一段结果行。')

  const resultCells = [...resultRow.arguments]
  minuendRow.arguments.forEach((sourceCell, sourceIndex) => {
    const markers = getBorrowMarkers(sourceCell)
    if (markers.length === 0) return
    const targetIndex = resultCells.length - minuendRow.arguments.length + sourceIndex
    if (targetIndex < 0) throw new Error('组合减法的借位列无法与上一段结果对齐。')
    resultCells[targetIndex] = appendBorrowMarkers(resultCells[targetIndex], markers)
  })
  children[resultRowIndex] = { ...resultRow, arguments: resultCells }
}

export const getCompositeArithmeticStepCount = (computation: CompositeArithmeticComputation): number =>
  computation.calculationSteps.length

/**
 * 组合宏不是一段伪造的超级 GRID：每一步都产生可独立复制回宏调试的宏源码框的源码。
 * 这样组合功能不会给宏语言或渲染器引入运算专属分支。
 */
const createCompositeArithmeticMacroStages = (
  computation: CompositeArithmeticComputation,
  settings: Partial<CompositeArithmeticRenderSettings> = {},
): CompositeArithmeticMacroStep[] => {
  const resolvedSettings: CompositeArithmeticRenderSettings = { ...DEFAULT_SETTINGS, ...settings }
  const visibleCalculationSteps =
    resolvedSettings.visibleStepCount === undefined
      ? undefined
      : computation.calculationSteps.slice(0, Math.max(0, resolvedSettings.visibleStepCount))

  return computation.steps.map((step, index) => {
    const localCalculationSteps = visibleCalculationSteps?.filter(({ operationIndex }) => operationIndex === index)
    const isReached =
      visibleCalculationSteps === undefined ||
      index === 0 ||
      Boolean(localCalculationSteps?.some(({ action }) => action === 'start-operation'))
    const visibleStepCount =
      localCalculationSteps === undefined
        ? undefined
        : localCalculationSteps.filter(({ action }) => action !== 'start-operation').length
    const common = {
      cellWidth: resolvedSettings.cellWidth,
      rowHeight: resolvedSettings.rowHeight,
      fontSizeRatio: resolvedSettings.fontSizeRatio,
      showGuideGrid: resolvedSettings.showGuideGrid,
      visibleStepCount,
      useMinimalDecimalResult: resolvedSettings.useMinimalDecimalResult,
    }
    const source =
      step.operator === '+'
        ? createAdditionMacroSource(step.computation, { ...common, showCarrySteps: resolvedSettings.showCarrySteps })
        : step.operator === '-'
          ? createSubtractionMacroSource(step.computation, {
              ...common,
              showBorrowSteps: resolvedSettings.showBorrowSteps,
            })
          : createMultiplicationMacroSource(step.computation, {
              ...common,
              showCarrySteps: resolvedSettings.showCarrySteps,
              uniformMultiplicationBars: resolvedSettings.uniformMultiplicationBars,
            })

    return {
      index: step.index,
      operator: step.operator,
      label: `${step.leftOperandDigits} ${step.operator} ${step.rightOperandDigits} = ${step.resultDigits}`,
      source,
      visibleStepCount,
      isReached,
    }
  })
}

/**
 * 将各单项竖式的行与横线串入一份 GRID 宏源码。每一段仍来自已有布局器，
 * 因而组合只负责行级编排，不复制任何进位、借位或部分积计算规则。
 */
export const createCompositeArithmeticMacroSource = (
  computation: CompositeArithmeticComputation,
  settings: Partial<CompositeArithmeticRenderSettings> = {},
): string => {
  const resolvedSettings: CompositeArithmeticRenderSettings = { ...DEFAULT_SETTINGS, ...settings }
  const stages = createCompositeArithmeticMacroStages(computation, resolvedSettings)
  const includedStages = stages.filter(({ isReached }) => isReached)
  if (includedStages.length === 0) throw new Error('组合竖式至少需要一个运算步骤。')

  const columns = Math.max(...includedStages.map(({ source }) => getGridColumnCount(source)))
  // 复用公共 GRID 选项，确保组合场景与各单项场景的尺寸、颜色和辅助网格一致。
  const root = parseMacro(macroGrid(columns, resolvedSettings, `${computation.expression} 的组合竖式`, []))
  const options = root.arguments.filter((node) => isCall(node, 'KV'))
  const children: MacroNode[] = []
  includedStages.forEach((stage, stageIndex) => {
    let skippedFirstRow = false
    parseMacro(stage.source)
      .arguments.filter((node) => !isCall(node, 'KV'))
      .forEach((node) => {
        // 连续竖式的上一步结果就是下一步的第一操作数，不能再抄写一遍。
        if (stageIndex === 0 || skippedFirstRow || !isCall(node, 'ROW')) {
          children.push(normalizeLineSpan(node))
          return
        }
        skippedFirstRow = true
        if (stage.operator === '-') mergeBorrowMarkersIntoPreviousResult(children, node)
      })
  })

  // 交由宏包正式复制导出 API 输出，避免布局层自行裁剪页面参数、拼接文本或复制别名规则。
  return minifyMacroForCopyAst({ kind: 'call', name: 'GRID', arguments: [...options, ...children] })
}

/** @deprecated 使用单份组合宏源码；保留直接取场景的兼容入口。 */
export const createCompositeArithmeticGridScene = (
  computation: CompositeArithmeticComputation,
  settings: Partial<CompositeArithmeticRenderSettings> = {},
): GridScene => compileCalculatorMacro(createCompositeArithmeticMacroSource(computation, settings))
