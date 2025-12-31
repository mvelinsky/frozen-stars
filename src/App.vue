<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { BlackHoleEngine } from './engine/BlackHoleEngine'
import { createUnits } from './engine/units'
import { timeScales } from './engine/timescales'
import Aside from './components/Aside.vue'
import DistanceToHorizon from './components/DistanceToHorizon.vue'
import Visualization from './components/Visualization.vue'
import Instructions from './components/Instructions.vue'

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

function formatTime(tau: number, precision: number = 2): string {
  const seconds = units.value.tauToSeconds(tau)
  if (seconds < 1e-15) return `${(seconds * 1e18).toFixed(precision)}as`
  if (seconds < 1e-12) return `${(seconds * 1e15).toFixed(precision)}fs`
  if (seconds < 1e-9) return `${(seconds * 1e12).toFixed(precision)}ps`
  if (seconds < 1e-6) return `${(seconds * 1e9).toFixed(precision)}ns`
  if (seconds < 1e-3) return `${(seconds * 1e6).toFixed(precision)}μs`
  if (seconds < 1) return `${(seconds * 1e3).toFixed(precision)}ms`
  if (seconds < 60) return `${seconds.toFixed(precision)}s`
  if (seconds < 3600) return `${(seconds / 60).toFixed(precision)}m`
  if (seconds < 86400) return `${(seconds / 3600).toFixed(precision)}h`
  if (seconds < 31536000) return `${(seconds / 86400).toFixed(precision)}d`
  const years = seconds / 31536000
  if (years < 1e15) return `${years.toFixed(precision)}y`
  return `${years.toExponential(2)}y`
}

function getTimeScaleReference(tau: number): string {
  const seconds = units.value.tauToSeconds(tau)
  const scale = timeScales.find(s => seconds < s.seconds * 10)
  return scale?.reference || ''
}

const observerTimeReference = computed(() => getTimeScaleReference(currentState.value.object2.tau))

// Photon exchange timing - depends on current simulation state
const timeToIntercept = computed(() => {
  const state = engine.value.getStateByNTau(currentNTau.value)
  const currentObserverTau = state.object2.tau
  const delta = engine.value.getPhotonIntersectDelta(currentObserverTau)
  console.log('intercept:', { nTau: currentNTau.value, fallerN: state.object1.n, observerTau: currentObserverTau, delta })
  return delta
})

const timeToReceiveResponse = computed(() => timeToIntercept.value * 2)

// Show/hide instructions
const showInstructions = ref(true)

function toggleInstructions() {
  showInstructions.value = !showInstructions.value
}
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
    <div class="flex-1 flex flex-col bg-[#0a0a12] overflow-hidden">
      <!-- Stats Panel -->
      <div class="flex-none bg-[#12121f] border-b-2 border-blue-500/20">
        <!-- Proper Time Bar -->
        <div class="px-8 py-6 flex items-start gap-12">
          <!-- Faller -->
          <div class="flex-1">
            <h3 class="text-xs text-blue-300/60 mb-3 uppercase tracking-widest font-medium">Faller Proper Time</h3>
            <p class="font-mono text-4xl text-blue-400 font-light tracking-tight">{{ formatTime(currentState.object1.tau) }}</p>
            <p class="text-gray-400 mt-3 text-sm">Distance to horizon: <DistanceToHorizon :solar-mass="mass" :n="currentState.object1.n" /></p>
          </div>
          <!-- Divider -->
          <div class="w-px h-20 bg-blue-500/20 self-center"></div>
          <!-- Observer -->
          <div class="flex-1">
            <h3 class="text-xs text-blue-300/60 mb-3 uppercase tracking-widest font-medium">Observer Proper Time</h3>
            <p class="font-mono text-4xl text-blue-400 font-light tracking-tight">{{ formatTime(currentState.object2.tau) }}</p>
            <p v-if="observerTimeReference" class="text-gray-400 mt-3 text-sm">{{ observerTimeReference }}</p>
            <p v-else class="mt-3 text-sm">&nbsp;</p>
          </div>
        </div>

        <!-- Photon Exchange Bar -->
        <div class="px-8 py-4">
          <h3 class="text-xs text-blue-300/60 mb-2 uppercase tracking-widest font-medium">
            Photon Emission
            <span class="normal-case tracking-normal text-gray-400 font-normal ml-2">— information exchange between observer and faller</span>
          </h3>
          <div class="flex items-baseline gap-8">
            <div>
              <span class="text-gray-400 text-sm mr-2">Time to intercept:</span>
              <span class="font-mono text-xl text-blue-400">{{ isFinite(timeToIntercept) ? formatTime(timeToIntercept, 4) : '∞' }}</span>
            </div>
            <div>
              <span class="text-gray-500 text-sm mr-2">Round-trip:</span>
              <span class="font-mono text-gray-400">{{ isFinite(timeToReceiveResponse) ? formatTime(timeToReceiveResponse, 4) : '∞' }}</span>
            </div>
          </div>
          <p class="text-gray-500 text-xs mt-2 max-w-2xl">
            Time for light to travel from the observer to the faller. With a mirror on the faller, the flash would be visible after the "round-trip" duration. This confirms the faller remains causally connected to and aware of events in the observer's frame.
          </p>
        </div>
      </div>

      <!-- Main Visualization -->
      <div class="overflow-hidden" :class="showInstructions ? 'h-[300px]' : 'flex-1'">
        <Visualization
          :solar-mass="mass"
          :n-faller="nFaller"
          :n-observer="nObserver"
          :n-current-faller="currentState.object1.n"
        />
      </div>

      <!-- Instructions Section - header always visible, content collapsible -->
      <div class="flex flex-col border-t border-gray-700/30 min-h-0" :class="showInstructions ? 'flex-1' : 'flex-none'">
        <Instructions :expanded="showInstructions" @toggle="toggleInstructions" />
      </div>
    </div>
  </div>
</template>
