<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { timeScales } from '../engine/timescales'

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
const stopOneTickBefore = ref<boolean>(false)

const TARGET_FPS = 30
const FRAME_INTERVAL = 1000 / TARGET_FPS

type SpeedOption = { value: string; label: string; getTauDelta: () => number }

const speedOptions: SpeedOption[] = [
  { value: '1e-25s', label: '10⁻²⁵s/tick', getTauDelta: () => 1e-25 / props.tauToSeconds(1) },
  { value: '1ys', label: '1ys/tick (yoctosecond, 10⁻²⁴s)', getTauDelta: () => 1e-24 / props.tauToSeconds(1) },
  { value: '10ys', label: '10ys/tick (10 yoctoseconds, 10⁻²³s)', getTauDelta: () => 1e-23 / props.tauToSeconds(1) },
  { value: '100ys', label: '100ys/tick (100 yoctoseconds, 10⁻²²s)', getTauDelta: () => 1e-22 / props.tauToSeconds(1) },
  { value: '1zs', label: '1zs/tick (zeptosecond, 10⁻²¹s)', getTauDelta: () => 1e-21 / props.tauToSeconds(1) },
  { value: '10zs', label: '10zs/tick (10 zeptoseconds, 10⁻²⁰s)', getTauDelta: () => 1e-20 / props.tauToSeconds(1) },
  { value: '100zs', label: '100zs/tick (100 zeptoseconds, 10⁻¹⁹s)', getTauDelta: () => 1e-19 / props.tauToSeconds(1) },
  { value: '1as', label: '1as/tick (attosecond, 10⁻¹⁸s)', getTauDelta: () => 1e-18 / props.tauToSeconds(1) },
  { value: '10as', label: '10as/tick (10 attoseconds, 10⁻¹⁷s)', getTauDelta: () => 1e-17 / props.tauToSeconds(1) },
  { value: '100as', label: '100as/tick (100 attoseconds, 10⁻¹⁶s)', getTauDelta: () => 1e-16 / props.tauToSeconds(1) },
  { value: '1fs', label: '1fs/tick (femtosecond, 10⁻¹⁵s)', getTauDelta: () => 1e-15 / props.tauToSeconds(1) },
  { value: '1ps', label: '1ps/tick (picosecond, 10⁻¹²s)', getTauDelta: () => 1e-12 / props.tauToSeconds(1) },
  { value: '1ns', label: '1ns/tick (nanosecond, 10⁻⁹s)', getTauDelta: () => 1e-9 / props.tauToSeconds(1) },
  { value: '1us', label: '1μs/tick (microsecond, 10⁻⁶s)', getTauDelta: () => 1e-6 / props.tauToSeconds(1) },
  { value: '1ms', label: '1ms/tick (millisecond, 10⁻³s)', getTauDelta: () => 1e-3 / props.tauToSeconds(1) },
  { value: '1s', label: '1s/tick (second, 10⁰s)', getTauDelta: () => 1 / props.tauToSeconds(1) },
  { value: '1m', label: '1m/tick (minute, 60s)', getTauDelta: () => 60 / props.tauToSeconds(1) },
  { value: '1h', label: '1h/tick (hour, 3600s)', getTauDelta: () => 3600 / props.tauToSeconds(1) },
  { value: '1d', label: '1d/tick (day, 86400s)', getTauDelta: () => 86400 / props.tauToSeconds(1) },
  { value: '1min', label: 'Complete in 1min', getTauDelta: () => props.tauMax / (60 * TARGET_FPS) },
]

const progress = computed(() => {
  if (props.tauMax === 0) return 0
  return (props.currentTau / props.tauMax) * 100
})

function formatTime(seconds: number): string {
  if (seconds < 1e-15) return `${(seconds * 1e18).toFixed(2)}as`
  if (seconds < 1e-12) return `${(seconds * 1e15).toFixed(2)}fs`
  if (seconds < 1e-9) return `${(seconds * 1e12).toFixed(2)}ps`
  if (seconds < 1e-6) return `${(seconds * 1e9).toFixed(2)}ns`
  if (seconds < 1e-3) return `${(seconds * 1e6).toFixed(2)}μs`
  if (seconds < 1) return `${(seconds * 1e3).toFixed(2)}ms`
  if (seconds < 60) return `${seconds.toFixed(2)}s`
  if (seconds < 3600) return `${(seconds / 60).toFixed(2)}m`
  if (seconds < 86400) return `${(seconds / 3600).toFixed(2)}h`
  if (seconds < 31536000) return `${(seconds / 86400).toFixed(2)}d`
  const years = seconds / 31536000
  if (years < 1e15) return `${years.toFixed(2)}y`
  // Use scientific notation for very large values
  return `${years.toExponential(2)}y`
}

const currentTimeFormatted = computed(() => formatTime(props.tauToSeconds(props.currentTau)))
const maxTimeFormatted = computed(() => formatTime(props.tauToSeconds(props.tauMax)))

// Get the time scale reference for the selected speed
const speedReference = computed(() => {
  const option = speedOptions.find(o => o.value === selectedSpeed.value)
  if (!option) return ''

  if (option.value === '1min') {
    return 'completes in ~1 minute'
  }

  // Get the tau delta and convert back to seconds
  const tauDelta = option.getTauDelta()
  const secondsPerTick = props.tauToSeconds(tauDelta)

  // Find the appropriate time scale reference
  const scale = timeScales.find(s => secondsPerTick < s.seconds * 10)
  return scale ? `${scale.reference}` : ''
})

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

      // Calculate the stopping point based on checkbox
      const stopPoint = stopOneTickBefore.value ? props.tauMax - tauDelta : props.tauMax
      const newTau = Math.min(props.currentTau + tauDelta, stopPoint)
      emit('update:currentTau', newTau)

      if (newTau >= stopPoint) {
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
      <span v-if="speedReference" class="text-[10px] text-gray-500">{{ speedReference }}</span>
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

    <!-- Stop One Tick Before Checkbox -->
    <label class="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
      <input
        v-model="stopOneTickBefore"
        type="checkbox"
        :disabled="isRunning"
        class="w-3 h-3 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <span>Stop 1 tick before horizon</span>
    </label>
  </div>
</template>
