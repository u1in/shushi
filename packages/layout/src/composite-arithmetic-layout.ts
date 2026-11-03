/** Composite arithmetic layout: joins single-operation macro rows into one continuous GRID. */
import type { CompositeArithmeticComputation, CompositeArithmeticStep } from '@u1in/shushi-calculators'
import type { GridScene } from '@u1in/shushi-grid'
import { minifyMacroForCopyAst, parseMacro } from '@u1in/shushi-macro'
import type { MacroCall, MacroNode } from '@u1in/shushi-macro'
import {
  createAdditionMacroSource,
} from './addition-layout'
import { createMultiplicationMacroSource, getMultiplicationStepCount } from './multiplication-layout'
import { createSubtractionMacroSource } from './subtraction-layout'
import type { CompositeArithmeticRenderSettings } from './types'
import { compileCalculatorMacro, macroGrid } from './macro-source'

interface CompositeArithmeticMacroStep {
  index: number
  operator: CompositeArithmeticStep['operator']
  label: string
  source: string
  stepCount: number
  visibleStepCount: number | undefined
}

const DEFAULT_SETTINGS: CompositeArithmeticRenderSettings = {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
  showCarrySteps: true,
  showBorrowSteps: true,
  uniformMultiplicationBars: false,
}

/** 返回单项规则本身定义的教学事件数，组合播放器据此映射全局游标。 */
const getOperationStepCount = (step: CompositeArithmeticStep): number => {
  switch (step.operator) {
    case '+': return step.computation.steps.length
    case '-': return step.computation.steps.length
    case '×': return getMultiplicationStepCount(step.computation)
  }
}

/** 后续步骤先单独引入“运算符 + 第二操作数”，下一帧才开始该步骤自己的逐位过程。 */
const getLocalVisibleStepCount = (
  completedCount: number,
  stepCount: number,
  globalVisibleStepCount: number | undefined,
  needsOperandIntroduction: boolean,
): number | undefined => {
  if (globalVisibleStepCount === undefined) return undefined
  const introductionStepCount = needsOperandIntroduction ? 1 : 0
  return Math.min(Math.max(globalVisibleStepCount - completedCount - introductionStepCount, 0), stepCount)
}

const isCall = (node: MacroNode, name: string): node is MacroCall => node.kind === 'call' && node.name === name

const getNodeValue = (node: MacroNode | undefined): string | undefined => (
  node?.kind === 'literal' ? node.value : node?.kind === 'symbol' ? node.name : undefined
)

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
    arguments: node.arguments.map((argument) => (
      isCall(argument, 'KV')
      && getNodeValue(argument.arguments[0]) === 'span'
      && getNodeValue(argument.arguments[1]) === 'full'
        ? { ...argument, arguments: [argument.arguments[0], { kind: 'literal', value: 'previous' }] }
        : argument
    )),
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
  if (isCall(target, 'EMPTY') || target.kind === 'symbol' && target.name === 'EMPTY') {
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

export const getCompositeArithmeticStepCount = (computation: CompositeArithmeticComputation): number => (
  computation.steps.reduce((count, step, index) => count + getOperationStepCount(step) + (index === 0 ? 0 : 1), 0)
)

/**
 * 组合宏不是一段伪造的超级 GRID：每一步都产生可独立复制回宏试验区的源码。
 * 这样组合功能不会给宏语言或渲染器引入运算专属分支。
 */
const createCompositeArithmeticMacroStages = (
  computation: CompositeArithmeticComputation,
  settings: Partial<CompositeArithmeticRenderSettings> = {},
): CompositeArithmeticMacroStep[] => {
  const resolvedSettings: CompositeArithmeticRenderSettings = { ...DEFAULT_SETTINGS, ...settings }
  let completedCount = 0

  return computation.steps.map((step, index) => {
    const stepCount = getOperationStepCount(step)
    const needsOperandIntroduction = index > 0
    const visibleStepCount = getLocalVisibleStepCount(
      completedCount,
      stepCount,
      resolvedSettings.visibleStepCount,
      needsOperandIntroduction,
    )
    completedCount += stepCount + (needsOperandIntroduction ? 1 : 0)
    const common = {
      cellWidth: resolvedSettings.cellWidth,
      rowHeight: resolvedSettings.rowHeight,
      fontSizeRatio: resolvedSettings.fontSizeRatio,
      showGuideGrid: resolvedSettings.showGuideGrid,
      visibleStepCount,
    }
    const source = step.operator === '+'
      ? createAdditionMacroSource(step.computation, { ...common, showCarrySteps: resolvedSettings.showCarrySteps })
      : step.operator === '-'
        ? createSubtractionMacroSource(step.computation, { ...common, showBorrowSteps: resolvedSettings.showBorrowSteps })
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
      stepCount,
      visibleStepCount,
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
  const globalVisibleStepCount = resolvedSettings.visibleStepCount
  let completedCount = 0
  const includedStages: CompositeArithmeticMacroStep[] = []

  stages.forEach((stage, index) => {
    // 第 0 帧显示第一步两个操作数；后续段必须等到额外的引入事件，才出现第二操作数行。
    const isReached = globalVisibleStepCount === undefined || index === 0 || globalVisibleStepCount > completedCount
    if (isReached) includedStages.push(stage)
    completedCount += stage.stepCount + (index === 0 ? 0 : 1)
  })
  if (includedStages.length === 0) throw new Error('组合竖式至少需要一个运算步骤。')

  const columns = Math.max(...includedStages.map(({ source }) => getGridColumnCount(source)))
  // 复用公共 GRID 选项，确保组合场景与各单项场景的尺寸、颜色和辅助网格一致。
  const root = parseMacro(macroGrid(columns, resolvedSettings, `${computation.expression} 的组合竖式`, []))
  const options = root.arguments.filter((node) => isCall(node, 'KV'))
  const children: MacroNode[] = []
  includedStages.forEach((stage, stageIndex) => {
    let skippedFirstRow = false
    parseMacro(stage.source).arguments
      .filter((node) => !isCall(node, 'KV'))
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
