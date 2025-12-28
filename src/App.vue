<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { BlackHoleEngine } from './engine/BlackHoleEngine'
import { createUnits } from './engine/units'
import { timeScales } from './engine/timescales'
import Aside from './components/Aside.vue'

// Configuration
const mass = ref<number>(10)
const nFaller = ref<number>(0)
const nObserver = ref<number>(-1)

// Current simulation time in logarithmic form (n_tau)
const currentNTau = ref<number>(0)

// Engine instance
const engine = ref<BlackHoleEngine>(new BlackHoleEngine({
  nFaller: nFaller.value,
  nObserver: nObserver.value,
}))

// Get units for time conversion
const units = computed(() => createUnits(mass.value))

// Get current state from engine using logarithmic time
const currentState = computed(() => engine.value.getStateByNTau(currentNTau.value))

// Recreate engine when config changes
watch([nFaller, nObserver], () => {
  engine.value = new BlackHoleEngine({
    nFaller: nFaller.value,
    nObserver: nObserver.value,
  })
  // Reset currentNTau when engine is recreated
  currentNTau.value = 0
})

function formatTime(tau: number): string {
  const seconds = units.value.tauToSeconds(tau)
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
  return `${years.toExponential(2)}y`
}

function getTimeScaleReference(tau: number): string {
  const seconds = units.value.tauToSeconds(tau)
  const scale = timeScales.find(s => seconds < s.seconds * 10)
  return scale?.reference || ''
}

const observerTimeReference = computed(() => getTimeScaleReference(currentState.value.object2.tau))
</script>

<template>
  <div class="h-screen bg-[#0a0a12] text-gray-100 flex">
    <!-- Sidebar -->
    <Aside
      v-model:mass="mass"
      v-model:n-faller="nFaller"
      v-model:n-observer="nObserver"
      v-model:current-n-tau="currentNTau"
    />

    <!-- Visualization Area -->
    <div class="flex-1 flex flex-col bg-[#0a0a12]">
      <!-- Proper Time Bar -->
      <div class="h-[150px] border-b border-white/5 px-8 py-6 flex items-start gap-8">
        <!-- Faller -->
        <div class="flex-1">
          <h3 class="text-sm text-gray-500 mb-2 uppercase tracking-widest">Faller Proper Time</h3>
          <p class="font-mono text-3xl text-blue-400">{{ formatTime(currentState.object1.tau) }}</p>
        </div>
        <!-- Observer -->
        <div class="flex-1">
          <h3 class="text-sm text-gray-500 mb-2 uppercase tracking-widest">Observer Proper Time</h3>
          <p class="font-mono text-3xl text-blue-400">{{ formatTime(currentState.object2.tau) }}</p>
          <p v-if="observerTimeReference" class="text-gray-400 mt-1">{{ observerTimeReference }}</p>
        </div>
      </div>

      <!-- Main Visualization -->
      <div class="flex-1 flex items-center justify-center">
        <p class="text-gray-600 text-sm">Visualization</p>
      </div>
    </div>
  </div>
</template>
