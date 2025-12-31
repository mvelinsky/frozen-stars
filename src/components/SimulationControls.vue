<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import { timeScales } from '../engine/timescales'

const props = defineProps<{
  tauMax: number
  currentTau: number
  tauToSeconds: (tau: number) => number
}>()

const emit = defineEmits<{
  'update:currentNTau': [value: number]  // Logarithmic time coordinate
  'start': []
  'stop': []
  'skipToEnd': []
}>()

const isRunning = ref<boolean>(false)
const selectedSpeed = ref<string>('1us')
const stopOneTickBefore = ref<boolean>(true)
const autoDownscale = ref<boolean>(true)

// When auto-downscale is enabled, stop-one-tick-before must also be enabled
watch(autoDownscale, (enabled) => {
  if (enabled) {
    stopOneTickBefore.value = true
  }
})

const TARGET_FPS = 30
const FRAME_INTERVAL = 1000 / TARGET_FPS

// Logarithmic time coordinate (like the spatial n coordinate)
// Maps [0, tauMax) to [0, infinity)
// tau = tauMax * (1 - 10^(-n_tau))
const currentNTau = ref<number>(0)

// Convert linear tau to logarithmic n_tau
function tauToNTau(tau: number, tauMax: number): number {
  if (tau >= tauMax) return Infinity
  if (tau <= 0) return 0
  const fraction = 1 - tau / tauMax
  if (fraction <= 0) return Infinity
  return -Math.log10(fraction)
}

// Convert logarithmic n_tau to linear tau
function nTauToTau(n: number, tauMax: number): number {
  if (n === Infinity) return tauMax
  const cappedN = Math.max(0, n)
  const fraction = Math.pow(10, -cappedN)
  return tauMax * (1 - fraction)
}

// Track whether we just made a local update (to avoid round-trip precision loss)
let skipNextPropUpdate = false

// Initialize n_tau from currentTau
watch(() => props.currentTau, (newTau) => {
  // Only update from prop if not running (during animation we control it)
  // and if we didn't just make a local update (avoid round-trip precision loss)
  if (!isRunning.value && !skipNextPropUpdate) {
    const computedNTau = tauToNTau(newTau, props.tauMax)
    // Only update if the computed value is finite and significantly different
    // This prevents precision loss at extreme nTau values where tau ≈ tauMax
    if (isFinite(computedNTau) || !isFinite(currentNTau.value)) {
      currentNTau.value = computedNTau
    }
  }
  skipNextPropUpdate = false
}, { immediate: true })

// Helper to emit nTau update while preventing watcher from overriding
function emitNTauUpdate(nTau: number) {
  skipNextPropUpdate = true
  emit('update:currentNTau', nTau)
}

type SpeedOption = { value: string; label: string; secondsPerTick: number; getNTauDelta: () => number }

const speedOptions: SpeedOption[] = [
  { value: '1e-81s', label: '10⁻⁸¹s/tick', secondsPerTick: 1e-81, getNTauDelta: () => computeNTauDelta(1e-81) },
  { value: '1e-78s', label: '10⁻⁷⁸s/tick', secondsPerTick: 1e-78, getNTauDelta: () => computeNTauDelta(1e-78) },
  { value: '1e-75s', label: '10⁻⁷⁵s/tick', secondsPerTick: 1e-75, getNTauDelta: () => computeNTauDelta(1e-75) },
  { value: '1e-72s', label: '10⁻⁷²s/tick', secondsPerTick: 1e-72, getNTauDelta: () => computeNTauDelta(1e-72) },
  { value: '1e-69s', label: '10⁻⁶⁹s/tick', secondsPerTick: 1e-69, getNTauDelta: () => computeNTauDelta(1e-69) },
  { value: '1e-66s', label: '10⁻⁶⁶s/tick', secondsPerTick: 1e-66, getNTauDelta: () => computeNTauDelta(1e-66) },
  { value: '1e-63s', label: '10⁻⁶³s/tick', secondsPerTick: 1e-63, getNTauDelta: () => computeNTauDelta(1e-63) },
  { value: '1e-60s', label: '10⁻⁶⁰s/tick', secondsPerTick: 1e-60, getNTauDelta: () => computeNTauDelta(1e-60) },
  { value: '1e-57s', label: '10⁻⁵⁷s/tick', secondsPerTick: 1e-57, getNTauDelta: () => computeNTauDelta(1e-57) },
  { value: '1e-54s', label: '10⁻⁵⁴s/tick', secondsPerTick: 1e-54, getNTauDelta: () => computeNTauDelta(1e-54) },
  { value: '1e-51s', label: '10⁻⁵¹s/tick', secondsPerTick: 1e-51, getNTauDelta: () => computeNTauDelta(1e-51) },
  { value: '1e-48s', label: '10⁻⁴⁸s/tick', secondsPerTick: 1e-48, getNTauDelta: () => computeNTauDelta(1e-48) },
  { value: '1e-45s', label: '10⁻⁴⁵s/tick (~Planck time)', secondsPerTick: 1e-45, getNTauDelta: () => computeNTauDelta(1e-45) },
  { value: '1e-42s', label: '10⁻⁴²s/tick', secondsPerTick: 1e-42, getNTauDelta: () => computeNTauDelta(1e-42) },
  { value: '1e-39s', label: '10⁻³⁹s/tick', secondsPerTick: 1e-39, getNTauDelta: () => computeNTauDelta(1e-39) },
  { value: '1e-36s', label: '10⁻³⁶s/tick', secondsPerTick: 1e-36, getNTauDelta: () => computeNTauDelta(1e-36) },
  { value: '1e-33s', label: '10⁻³³s/tick', secondsPerTick: 1e-33, getNTauDelta: () => computeNTauDelta(1e-33) },
  { value: '1qs', label: '1qs/tick (quectosecond, 10⁻³⁰s)', secondsPerTick: 1e-30, getNTauDelta: () => computeNTauDelta(1e-30) },
  { value: '1rs', label: '1rs/tick (rontosecond, 10⁻²⁷s)', secondsPerTick: 1e-27, getNTauDelta: () => computeNTauDelta(1e-27) },
  { value: '1ys', label: '1ys/tick (yoctosecond, 10⁻²⁴s)', secondsPerTick: 1e-24, getNTauDelta: () => computeNTauDelta(1e-24) },
  { value: '1zs', label: '1zs/tick (zeptosecond, 10⁻²¹s)', secondsPerTick: 1e-21, getNTauDelta: () => computeNTauDelta(1e-21) },
  { value: '1as', label: '1as/tick (attosecond, 10⁻¹⁸s)', secondsPerTick: 1e-18, getNTauDelta: () => computeNTauDelta(1e-18) },
  { value: '1fs', label: '1fs/tick (femtosecond, 10⁻¹⁵s)', secondsPerTick: 1e-15, getNTauDelta: () => computeNTauDelta(1e-15) },
  { value: '1ps', label: '1ps/tick (picosecond, 10⁻¹²s)', secondsPerTick: 1e-12, getNTauDelta: () => computeNTauDelta(1e-12) },
  { value: '1ns', label: '1ns/tick (nanosecond, 10⁻⁹s)', secondsPerTick: 1e-9, getNTauDelta: () => computeNTauDelta(1e-9) },
  { value: '1us', label: '1μs/tick (microsecond, 10⁻⁶s)', secondsPerTick: 1e-6, getNTauDelta: () => computeNTauDelta(1e-6) },
  { value: '1ms', label: '1ms/tick (millisecond, 10⁻³s)', secondsPerTick: 1e-3, getNTauDelta: () => computeNTauDelta(1e-3) },
  { value: '1s', label: '1s/tick (second, 10⁰s)', secondsPerTick: 1, getNTauDelta: () => computeNTauDelta(1) },
  { value: '1m', label: '1m/tick (minute, 60s)', secondsPerTick: 60, getNTauDelta: () => computeNTauDelta(60) },
  { value: '1h', label: '1h/tick (hour, 3600s)', secondsPerTick: 3600, getNTauDelta: () => computeNTauDelta(3600) },
  { value: '1d', label: '1d/tick (day, 86400s)', secondsPerTick: 86400, getNTauDelta: () => computeNTauDelta(86400) },
  { value: '1min', label: 'Complete in 1min', secondsPerTick: 0, getNTauDelta: () => {
    const totalTicks = 60 * TARGET_FPS
    const finalNTau = 100  // Cap at n_tau = 20 (tau = tauMax * 0.999999999999999999)
    return finalNTau / totalTicks
  }},
]

// Find the next smaller timescale (previous in array since sorted smallest to largest)
function getSmallerTimescale(currentValue: string): SpeedOption | null {
  const currentIndex = speedOptions.findIndex(o => o.value === currentValue)
  if (currentIndex <= 0) return null  // Already at smallest or not found
  // Skip the '1min' option when downscaling
  const prevOption = speedOptions[currentIndex - 1]
  if (prevOption.value === '1min') return null
  return prevOption
}

// Compute the n_tau increment for a given time delta in seconds
// Using log-space arithmetic to avoid precision loss at extreme scales
function computeNTauDelta(secondsDelta: number): number {
  // Convert seconds to tau units
  const tauDelta = secondsDelta / props.tauToSeconds(1)

  if (currentNTau.value <= 0) {
    // At start, use linear approximation
    const derivative = props.tauMax * Math.LN10
    return tauDelta / derivative
  }

  // We want: newN such that tau(newN) = tau(currentN) + tauDelta
  // tau = tauMax * (1 - 10^(-n))
  // tau(currentN) + tauDelta = tauMax * (1 - 10^(-newN))
  // 10^(-newN) = 1 - (tau(currentN) + tauDelta) / tauMax
  //            = (tauMax - tau(currentN) - tauDelta) / tauMax
  //            = 10^(-currentN) - tauDelta / tauMax
  //
  // Problem: this subtraction loses precision when both terms are tiny.
  // Solution: work with the ratio tauDelta / (tauMax * 10^(-n))
  //
  // Let x = tauDelta / (tauMax * 10^(-n))
  // Then: 10^(-newN) = 10^(-n) * (1 - x)
  //       newN = n - log10(1 - x)
  //       delta = -log10(1 - x)
  //
  // For small x: -log10(1-x) ≈ x / ln(10)

  const x = tauDelta / (props.tauMax * Math.pow(10, -currentNTau.value))

  if (x >= 1) {
    // Step would cross or reach horizon
    return 100 - currentNTau.value
  }

  if (x < 1e-10) {
    // Use Taylor approximation for small x: -log10(1-x) ≈ x / ln(10)
    return x / Math.LN10
  }

  // General case
  return -Math.log10(1 - x)
}

const progress = computed(() => {
  if (props.tauMax === 0) return 0
  const currentTauFromN = nTauToTau(currentNTau.value, props.tauMax)
  return (currentTauFromN / props.tauMax) * 100
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

const currentTauComputed = computed(() => nTauToTau(currentNTau.value, props.tauMax))
const currentTimeFormatted = computed(() => formatTime(props.tauToSeconds(currentTauComputed.value)))
const maxTimeFormatted = computed(() => formatTime(props.tauToSeconds(props.tauMax)))

// Get the time scale reference for the selected speed
const speedReference = computed(() => {
  const option = speedOptions.find(o => o.value === selectedSpeed.value)
  if (!option) return ''

  if (option.value === '1min') {
    return 'completes in ~1 minute'
  }

  // Get the tau delta and convert back to seconds
  const nTauDelta = option.getNTauDelta()
  const derivativeAtCurrent = props.tauMax * Math.LN10 * Math.pow(10, -currentNTau.value)
  const tauDelta = nTauDelta * derivativeAtCurrent
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
    if (!option) {
      console.warn('animate: no option found for', selectedSpeed.value)
      stop()
      return
    }

    // Calculate the stop point in n_tau (exactly 1 tick before horizon)
    let stopNTau: number
    if (stopOneTickBefore.value) {
      if (option.value === '1min') {
        stopNTau = 20
      } else {
        // Direct log calculation to avoid floating-point precision loss
        const tauPerTick = option.secondsPerTick / props.tauToSeconds(1)
        if (tauPerTick >= props.tauMax) {
          console.warn('animate: tauPerTick >= tauMax', tauPerTick, props.tauMax)
          stop()
          return
        }
        stopNTau = Math.log10(props.tauMax / tauPerTick)
      }
    } else {
      stopNTau = 100
    }

    const nTauDelta = option.getNTauDelta()

    if (!isFinite(nTauDelta) || nTauDelta <= 0) {
      console.warn('animate: invalid nTauDelta', nTauDelta, 'at currentNTau', currentNTau.value)
      stop()
      return
    }

    let newNTau = currentNTau.value + nTauDelta

    // Check if we've reached or passed the stopping point
    if (newNTau >= stopNTau || !isFinite(newNTau)) {
      // Take final step to exactly the stop point
      if (currentNTau.value < stopNTau) {
        currentNTau.value = stopNTau
        emitNTauUpdate(stopNTau)
      }

      // If auto-downscale is enabled, switch to smaller timescale and continue
      if (autoDownscale.value && stopOneTickBefore.value) {
        const smallerOption = getSmallerTimescale(selectedSpeed.value)
        if (smallerOption) {
          selectedSpeed.value = smallerOption.value
          // Continue animation with new timescale (don't stop)
          lastTime = currentTime
          animationFrameId = requestAnimationFrame(animate)
          return
        }
      }

      stop()
      return
    }

    currentNTau.value = newNTau
    emitNTauUpdate(newNTau)
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

function step() {
  const option = speedOptions.find(o => o.value === selectedSpeed.value)
  if (!option) {
    console.warn('step: no option found for', selectedSpeed.value)
    return
  }

  // Calculate the stop point in n_tau
  // For stepping, we always allow stepping up to 1 tick before horizon at current timescale
  // (independent of the checkbox, which only affects continuous animation)
  let stopNTau: number
  if (option.value === '1min') {
    stopNTau = 20
  } else {
    // Direct log calculation to avoid floating-point precision loss
    const tauPerTick = option.secondsPerTick / props.tauToSeconds(1)
    if (tauPerTick >= props.tauMax) {
      console.warn('step: tauPerTick >= tauMax', tauPerTick, props.tauMax)
      return
    }
    stopNTau = Math.log10(props.tauMax / tauPerTick)
  }

  // Check if we've already reached the stop point for this timescale
  if (currentNTau.value >= stopNTau) {
    // If auto-downscale is enabled, switch to smaller timescale and continue
    if (autoDownscale.value) {
      const smallerOption = getSmallerTimescale(selectedSpeed.value)
      if (smallerOption) {
        selectedSpeed.value = smallerOption.value
        // Recursively call step with the new timescale
        step()
        return
      }
    }
    console.warn('step: already at stop point', currentNTau.value, '>=', stopNTau)
    return
  }

  // Calculate the n_tau delta for one tick of proper time
  const nTauDelta = option.getNTauDelta()

  if (!isFinite(nTauDelta) || nTauDelta <= 0) {
    console.warn('step: invalid nTauDelta', nTauDelta)
    return
  }

  let newNTau = currentNTau.value + nTauDelta

  // Clamp to stop point if we would overshoot
  if (newNTau > stopNTau || !isFinite(newNTau)) {
    newNTau = stopNTau
  }

  currentNTau.value = newNTau
  emitNTauUpdate(newNTau)
}

function onSliderInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  const newTau = (value / 100) * props.tauMax
  currentNTau.value = tauToNTau(newTau, props.tauMax)
  emitNTauUpdate(currentNTau.value)
}

function skipToEnd() {
  const option = speedOptions.find(o => o.value === selectedSpeed.value)
  if (!option) return

  let stopNTau: number

  // Skip to End always stops exactly 1 tick of the selected timescale before horizon
  if (option.value === '1min') {
    // For "complete in 1min" mode, use a fixed margin
    stopNTau = 20
  } else {
    // Calculate stop point as exactly 1 tick of proper time before horizon
    // We compute directly in log space to avoid floating-point precision loss
    // stopNTau = log10(tauMax / tauPerTick)
    const tauPerTick = option.secondsPerTick / props.tauToSeconds(1)

    if (tauPerTick >= props.tauMax) {
      // The tick is larger than the entire simulation, can't skip meaningfully
      return
    }

    // Direct log calculation avoids precision loss from (tauMax - tiny) = tauMax
    stopNTau = Math.log10(props.tauMax / tauPerTick)
  }

  // Only update if moving forward
  if (stopNTau > currentNTau.value) {
    currentNTau.value = stopNTau
    emitNTauUpdate(currentNTau.value)
  }
  emit('skipToEnd')
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
        <span class="text-blue-400">{{ currentTauComputed.toFixed(4) }}</span>
        <span>{{ tauMax.toFixed(1) }}</span>
      </div>
      <!-- Time values (seconds/minutes/hours/days) -->
      <div class="flex justify-between text-[10px] font-mono text-gray-500">
        <span>0s</span>
        <span class="text-blue-300">{{ currentTimeFormatted }}</span>
        <span>{{ maxTimeFormatted }}</span>
      </div>
      <!-- n_tau indicator (logarithmic time coordinate) -->
      <div class="flex justify-between text-[10px] font-mono text-gray-600">
        <span>n_τ = 0</span>
        <span class="text-purple-400">n_τ = {{ currentNTau.toFixed(4) }}</span>
        <span>n_τ → 20 (∞)</span>
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
        v-if="!isRunning"
        @click="start"
        class="flex-1 px-3 py-1.5 text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors"
      >
        Start
      </button>
      <button
        v-if="isRunning"
        @click="stop"
        class="flex-1 px-3 py-1.5 text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded hover:bg-amber-500/30 transition-colors"
      >
        Stop
      </button>
      <button
        @click="skipToEnd"
        :disabled="isRunning"
        class="flex-1 px-3 py-1.5 text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Skip to End
      </button>
      <button
        @click="step"
        :disabled="isRunning"
        class="flex-1 px-3 py-1.5 text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Step
      </button>
    </div>

    <!-- Stop One Tick Before Checkbox -->
    <label class="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
      <input
        v-model="stopOneTickBefore"
        type="checkbox"
        :disabled="isRunning || autoDownscale"
        class="w-3 h-3 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <span>Stop 1 tick before horizon</span>
    </label>

    <!-- Auto-downscale Checkbox -->
    <label class="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
      <input
        v-model="autoDownscale"
        type="checkbox"
        :disabled="isRunning"
        class="w-3 h-3 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <span>Auto-switch to smaller timescale at stop point</span>
    </label>
  </div>
</template>
