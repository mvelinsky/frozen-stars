<script setup lang="ts">
import { ref } from 'vue'

const progress = ref<number>(0)
const isRunning = ref<boolean>(false)

function start() {
  isRunning.value = true
}

function stop() {
  isRunning.value = false
}

function reset() {
  isRunning.value = false
  progress.value = 0
}
</script>

<template>
  <div class="space-y-4">
    <!-- Progress Slider -->
    <div class="flex flex-col gap-1.5">
      <label class="flex justify-between items-center text-xs">
        <span class="text-gray-400">Progress</span>
        <span class="font-mono text-blue-400">{{ progress.toFixed(1) }}%</span>
      </label>
      <input
        v-model.number="progress"
        type="range"
        min="0"
        max="100"
        step="0.1"
        class="w-full h-1 bg-white/10 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-blue-400 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0"
      />
    </div>

    <!-- Control Buttons -->
    <div class="flex gap-2">
      <button
        @click="start"
        :disabled="isRunning"
        class="flex-1 px-3 py-1.5 text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Start
      </button>
      <button
        @click="stop"
        :disabled="!isRunning"
        class="flex-1 px-3 py-1.5 text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Stop
      </button>
      <button
        @click="reset"
        class="flex-1 px-3 py-1.5 text-xs font-medium bg-white/5 text-gray-400 border border-white/10 rounded hover:bg-white/10 transition-colors"
      >
        Reset
      </button>
    </div>
  </div>
</template>
