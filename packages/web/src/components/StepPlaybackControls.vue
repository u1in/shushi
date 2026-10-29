<script setup lang="ts">
defineProps<{
  currentStep: number
  stepCount: number
  canStart: boolean
  canPrevious: boolean
  canNext: boolean
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
    <button type="button" class="ghost-button step-playback__button" :disabled="!canStart" @click="$emit('start')">开始</button>
    <button type="button" class="ghost-button step-playback__button" :disabled="!canPrevious" @click="$emit('previous')">上一步</button>
    <button type="button" class="primary-button step-playback__button" :disabled="!canNext" @click="$emit('next')">下一步</button>
    <button type="button" class="ghost-button step-playback__button" :disabled="currentStep === stepCount" @click="$emit('reset')">结束</button>
  </div>
</template>
