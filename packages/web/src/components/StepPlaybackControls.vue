<script setup lang="ts">
import CalculationStepsPanel from './CalculationStepsPanel.vue'

defineProps<{
  currentStep: number
  stepCount: number
  canStart: boolean
  canPrevious: boolean
  canNext: boolean
  computation: unknown
}>()

defineEmits<{
  start: []
  previous: []
  next: []
  reset: []
}>()
</script>

<template>
  <div class="step-playback" aria-label="计算步骤检查">
    <span class="step-playback__label">步骤 {{ currentStep }} / {{ stepCount }}</span>
    <div class="step-playback__actions">
      <button type="button" class="ghost-button step-playback__button" :disabled="!canStart" @click="$emit('start')">
        跳到最前
      </button>
      <button
        type="button"
        class="ghost-button step-playback__button"
        :disabled="!canPrevious"
        @click="$emit('previous')"
      >
        上一步
      </button>
      <button type="button" class="primary-button step-playback__button" :disabled="!canNext" @click="$emit('next')">
        下一步
      </button>
      <button
        type="button"
        class="ghost-button step-playback__button"
        :disabled="currentStep === stepCount"
        @click="$emit('reset')"
      >
        跳到最后
      </button>
      <CalculationStepsPanel :computation="computation" />
    </div>
  </div>
</template>
