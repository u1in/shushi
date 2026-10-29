import { computed, ref, type ComputedRef, type Ref } from 'vue'

export interface CalculatorStepPlayback {
  visibleStepCount: Ref<number | undefined>
  stepCount: ComputedRef<number>
  currentStep: ComputedRef<number>
  canPrevious: ComputedRef<boolean>
  canNext: ComputedRef<boolean>
  canStart: ComputedRef<boolean>
  start: () => void
  previous: () => void
  next: () => void
  reset: () => void
}

interface CalculatorPlaybackOptions {
  getStepCount: () => number
  render: () => void
}

/** 为单个计算器提供可反复检查的步骤游标，不修改计算层的过程数据。 */
export const useCalculatorStepPlayback = ({ getStepCount, render }: CalculatorPlaybackOptions): CalculatorStepPlayback => {
  const visibleStepCount = ref<number | undefined>(undefined)
  const stepCount = computed(() => Math.max(0, getStepCount()))
  const currentStep = computed(() => visibleStepCount.value ?? stepCount.value)
  const canPrevious = computed(() => currentStep.value > 0)
  const canNext = computed(() => currentStep.value < stepCount.value)
  const canStart = computed(() => currentStep.value > 0)

  const start = (): void => {
    visibleStepCount.value = 0
    render()
  }

  const previous = (): void => {
    visibleStepCount.value = Math.max(0, currentStep.value - 1)
    render()
  }
  const next = (): void => {
    // 完整结果视图从第一步开始前进，便于用户随时重新检查当前算式。
    visibleStepCount.value = Math.min(stepCount.value, visibleStepCount.value === undefined ? 1 : visibleStepCount.value + 1)
    render()
  }
  const reset = (): void => {
    visibleStepCount.value = undefined
    render()
  }

  return { visibleStepCount, stepCount, currentStep, canPrevious, canNext, canStart, start, previous, next, reset }
}
