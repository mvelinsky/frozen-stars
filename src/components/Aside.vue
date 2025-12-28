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
  currentTau: number
}>()

const emit = defineEmits<{
  'update:mass': [value: number]
  'update:nFaller': [value: number]
  'update:nObserver': [value: number]
  'update:currentTau': [value: number]
}>()

// Engine instance
const engine = ref<BlackHoleEngine>(new BlackHoleEngine({
  nFaller: props.nFaller,
  nObserver: props.nObserver,
}))

// Get tauMax from engine
const tauMax = computed(() => engine.value.tauMax)

// Get units for time conversion
const units = computed(() => createUnits(props.mass))

// Recreate engine when config changes
watch([() => props.nFaller, () => props.nObserver], () => {
  engine.value = new BlackHoleEngine({
    nFaller: props.nFaller,
    nObserver: props.nObserver,
  })
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
  emit('update:currentTau', value)
}

function startSimulation() {
  // TODO: start animation
}

function stopSimulation() {
  // TODO: stop animation
}

function resetSimulation() {
  emit('update:currentTau', 0)
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
      </div>
    </div>
  </div>
</template>
