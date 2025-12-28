<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

const props = defineProps<{
  tauMax: number
  currentTau: number
  tauToSeconds: (tau: number) => number
}>()

const emit = defineEmits<{
  'update:currentTau': [value: number]
  'start': []
  'stop': []
  'reset': []
}>()

const isRunning = ref<boolean>(false)
const selectedSpeed = ref<string>('1s')

const TARGET_FPS = 30
const FRAME_INTERVAL = 1000 / TARGET_FPS

type SpeedOption = { value: string; label: string; getTauDelta: () => number }

const speedOptions: SpeedOption[] = [
  { value: '1us', label: '1μs/tick', getTauDelta: () => 1e-6 / props.tauToSeconds(1) },
  { value: '1ms', label: '1ms/tick', getTauDelta: () => 1e-3 / props.tauToSeconds(1) },
  { value: '1s', label: '1s/tick', getTauDelta: () => 1 / props.tauToSeconds(1) },
  { value: '1m', label: '1m/tick', getTauDelta: () => 60 / props.tauToSeconds(1) },
  { value: '1h', label: '1h/tick', getTauDelta: () => 3600 / props.tauToSeconds(1) },
  { value: '1d', label: '1d/tick', getTauDelta: () => 86400 / props.tauToSeconds(1) },
  { value: '1min', label: 'Complete in 1min', getTauDelta: () => props.tauMax / (60 * TARGET_FPS) },
]

const progress = computed(() => {
  if (props.tauMax === 0) return 0
  return (props.currentTau / props.tauMax) * 100
})

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(2)}s`
  if (seconds < 3600) return `${(seconds / 60).toFixed(2)}m`
  if (seconds < 86400) return `${(seconds / 3600).toFixed(2)}h`
  if (seconds < 31536000) return `${(seconds / 86400).toFixed(2)}d`
  return `${(seconds / 31536000).toFixed(2)}y`
}

const currentTimeFormatted = computed(() => formatTime(props.tauToSeconds(props.currentTau)))
const maxTimeFormatted = computed(() => formatTime(props.tauToSeconds(props.tauMax)))

let animationFrameId: number | null = null
let lastTime = 0

function animate(currentTime: number) {
  if (!isRunning.value) return

  if (lastTime === 0) {
    lastTime = currentTime
  }

  const elapsed = currentTime - lastTime

  if (elapsed >= FRAME_INTERVAL) {
    const option = speedOptions.find(o => o.value === selectedSpeed.value)
    if (option) {
      const tauDelta = option.getTauDelta()
      const newTau = Math.min(props.currentTau + tauDelta, props.tauMax)
      emit('update:currentTau', newTau)

      if (newTau >= props.tauMax) {
        stop()
        return
      }
    }
    lastTime = currentTime
  }

  animationFrameId = requestAnimationFrame(animate)
}

function start() {
  if (isRunning.value) return
  isRunning.value = true
  lastTime = 0
  emit('start')
  animationFrameId = requestAnimationFrame(animate)
}

function stop() {
  isRunning.value = false
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  emit('stop')
}

function reset() {
  stop()
  emit('update:currentTau', 0)
  emit('reset')
}

function onSliderInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  emit('update:currentTau', (value / 100) * props.tauMax)
}

onUnmounted(() => {
  stop()
})
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
        :value="progress"
        @input="onSliderInput"
        type="range"
        min="0"
        max="100"
        step="0.1"
        class="w-full h-1 bg-white/10 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-blue-400 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0"
      />
      <!-- Tau values below slider -->
      <div class="flex justify-between text-[10px] font-mono text-gray-600 pt-1">
        <span>0</span>
        <span class="text-blue-400">{{ currentTau.toFixed(1) }}</span>
        <span>{{ tauMax.toFixed(1) }}</span>
      </div>
      <!-- Time values (seconds/minutes/hours/days) -->
      <div class="flex justify-between text-[10px] font-mono text-gray-500">
        <span>0s</span>
        <span class="text-blue-300">{{ currentTimeFormatted }}</span>
        <span>{{ maxTimeFormatted }}</span>
      </div>
    </div>

    <!-- Speed Selector -->
    <div class="flex flex-col gap-1.5">
      <label class="text-xs text-gray-400">Speed</label>
      <select
        v-model="selectedSpeed"
        :disabled="isRunning"
        class="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 text-gray-200 text-xs focus:outline-none focus:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option v-for="option in speedOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
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
