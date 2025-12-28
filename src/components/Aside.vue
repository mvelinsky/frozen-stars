<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { BlackHoleEngine } from '../engine/BlackHoleEngine'
import { createUnits } from '../engine/units'
import Controls from './Controls.vue'
import SimulationControls from './SimulationControls.vue'

const props = defineProps<{
  mass: number
  nFaller: number
  nObserver: number
}>()

const emit = defineEmits<{
  'update:mass': [value: number]
  'update:nFaller': [value: number]
  'update:nObserver': [value: number]
}>()

// Engine instance
const engine = ref<BlackHoleEngine>(new BlackHoleEngine({
  nFaller: props.nFaller,
  nObserver: props.nObserver,
}))

// Current simulation time (tau)
const currentTau = ref<number>(0)

// Get tauMax from engine
const tauMax = computed(() => engine.value.tauMax)

// Get units for time conversion
const units = computed(() => createUnits(props.mass))

// Get current state from engine
const currentState = computed(() => {
  return engine.value.getState(currentTau.value);
})

// Recreate engine when config changes
watch([() => props.nFaller, () => props.nObserver], () => {
  engine.value = new BlackHoleEngine({
    nFaller: props.nFaller,
    nObserver: props.nObserver,
  })
  // Reset currentTau when engine is recreated
  currentTau.value = 0
})

function updateMass(value: number) {
  emit('update:mass', value)
}

function updateFaller(value: number) {
  emit('update:nFaller', value)
}

function updateObserver(value: number) {
  emit('update:nObserver', value)
}

function updateCurrentTau(value: number) {
  currentTau.value = value
}

function startSimulation() {
  // TODO: start animation
}

function stopSimulation() {
  // TODO: stop animation
}

function resetSimulation() {
  currentTau.value = 0
}

function formatTime(tau: number): string {
  const seconds = units.value.tauToSeconds(tau)
  if (seconds < 1e-12) return `${(seconds * 1e15).toFixed(2)}fs`
  if (seconds < 1e-9) return `${(seconds * 1e12).toFixed(2)}ps`
  if (seconds < 1e-6) return `${(seconds * 1e9).toFixed(2)}ns`
  if (seconds < 1e-3) return `${(seconds * 1e6).toFixed(2)}μs`
  if (seconds < 1) return `${(seconds * 1e3).toFixed(2)}ms`
  if (seconds < 60) return `${seconds.toFixed(2)}s`
  if (seconds < 3600) return `${(seconds / 60).toFixed(2)}m`
  if (seconds < 86400) return `${(seconds / 3600).toFixed(2)}h`
  if (seconds < 31536000) return `${(seconds / 86400).toFixed(2)}d`
  return `${(seconds / 31536000).toFixed(2)}y`
}
</script>

<template>
  <div class="w-80 h-full bg-[#0f0f18] border-r border-white/5 flex flex-col">
    <!-- Header -->
    <header class="px-5 py-4 border-b border-white/5">
      <h1 class="text-sm font-medium tracking-tight">Black Hole Frozen Star</h1>
    </header>

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto">
      <Controls
        :mass="mass"
        :n-faller="nFaller"
        :n-observer="nObserver"
        @update:mass="updateMass"
        @update:n-faller="updateFaller"
        @update:n-observer="updateObserver"
      />

      <!-- Simulation Section -->
      <div class="px-5 pb-5 border-t border-white/5">
        <div class="pt-4">
          <h2 class="text-[12px] font-medium text-gray-400 mb-3 uppercase tracking-widest">Simulation</h2>
          <SimulationControls
            :tau-max="tauMax"
            :current-tau="currentTau"
            :tau-to-seconds="units.tauToSeconds"
            @update:current-tau="updateCurrentTau"
            @start="startSimulation"
            @stop="stopSimulation"
            @reset="resetSimulation"
          />
        </div>

        <!-- Proper Time Display -->
        <div class="mt-4 pt-4 border-t border-white/5">
          <h3 class="text-[10px] font-medium text-gray-500 mb-2 uppercase tracking-widest">Proper Time</h3>
          <div class="grid grid-cols-2 gap-3">
            <!-- Faller -->
            <div class="flex flex-col gap-1">
              <span class="text-[10px] text-gray-600">Faller</span>
              <span class="font-mono text-xs text-blue-400">{{ formatTime(currentState.object1.tau) }}</span>
            </div>
            <!-- Observer -->
            <div class="flex flex-col gap-1">
              <span class="text-[10px] text-gray-600">Observer</span>
              <span class="font-mono text-xs text-blue-400">{{ formatTime(currentState.object2.tau) }}</span>
              <span class="text-xs">{{ currentState.object2.tau }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
