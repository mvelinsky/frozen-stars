<script setup lang="ts">
import { computed } from 'vue'
import { createUnits } from '../engine/units'
import HumanReadableDistance from './HumanReadableDistance.vue'

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

const units = computed(() => createUnits(props.mass))

function onUpdateFaller(value: number) {
  // Faller can't go below observer (must stay closer to horizon)
  emit('update:nFaller', Math.max(value, props.nObserver + 0.1))
}

function onUpdateObserver(value: number) {
  // Observer can't go above faller (must stay farther from horizon)
  emit('update:nObserver', Math.min(value, props.nFaller - 0.1))
}
</script>

<template>
  <div class="p-6 space-y-6 bg-[#1a1a2e] rounded-xl">
    <!-- Mass Input -->
    <div class="flex flex-col gap-2">
      <label class="flex justify-between items-center">
        <span class="text-sm font-medium text-gray-200">Black Hole Mass</span>
        <span class="font-mono text-sm text-blue-400">{{ mass }} M☉</span>
      </label>
      <input
        type="number"
        :value="mass"
        @input="emit('update:mass', Number(($event.target as HTMLInputElement).value))"
        min="0.1"
        max="1000"
        step="0.1"
        class="w-full px-2 py-2 bg-[#16213e] border border-slate-700 rounded-md text-gray-50 text-base focus:outline-none focus:border-blue-400"
      />
      <div class="text-xs text-slate-600">
        Schwarzschild radius: {{ units.rs_km.toFixed(2) }} km
      </div>
    </div>

    <!-- nFaller Slider -->
    <div class="flex flex-col gap-2">
      <label class="flex justify-between items-center">
        <span class="text-sm font-medium text-gray-200">Faller Position (n)</span>
        <span class="font-mono text-sm text-blue-400">{{ nFaller.toFixed(1) }}</span>
      </label>
      <input
        type="range"
        :value="nFaller"
        @input="onUpdateFaller(Number(($event.target as HTMLInputElement).value))"
        min="-10"
        max="2"
        step="0.1"
        class="slider-reversed w-full h-2 bg-slate-700 rounded-md outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-blue-400 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0"
      />
      <div class="flex justify-between text-xs text-slate-400">
        <span class="text-slate-600">Distance from horizon:</span>
        <HumanReadableDistance :solar-mass="mass" :n="nFaller" />
      </div>
    </div>

    <!-- nObserver Slider -->
    <div class="flex flex-col gap-2">
      <label class="flex justify-between items-center">
        <span class="text-sm font-medium text-gray-200">Observer Position (n)</span>
        <span class="font-mono text-sm text-blue-400">{{ nObserver.toFixed(1) }}</span>
      </label>
      <input
        type="range"
        :value="nObserver"
        @input="onUpdateObserver(Number(($event.target as HTMLInputElement).value))"
        min="-10"
        max="2"
        step="0.1"
        class="slider-reversed w-full h-2 bg-slate-700 rounded-md outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-blue-400 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0"
      />
      <div class="flex justify-between text-xs text-slate-400">
        <span class="text-slate-600">Distance from horizon:</span>
        <HumanReadableDistance :solar-mass="mass" :n="nObserver" />
      </div>
    </div>

    <!-- Scale Reference -->
    <div class="mt-4 pt-4 border-t border-slate-700">
      <div class="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">n scale reference:</div>
      <div class="flex flex-col gap-1">
        <div class="flex justify-between text-xs">
          <span class="font-mono text-blue-400">n = 2</span>
          <span class="text-slate-600">very far (r = 101rs)</span>
        </div>
        <div class="flex justify-between text-xs">
          <span class="font-mono text-blue-400">n = 0</span>
          <span class="text-slate-600">1×rs above horizon</span>
        </div>
        <div class="flex justify-between text-xs">
          <span class="font-mono text-blue-400">n = 2</span>
          <span class="text-slate-600">very close</span>
        </div>
        <div class="flex justify-between text-xs">
          <span class="font-mono text-blue-400">n → ∞</span>
          <span class="text-slate-600">at horizon</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Reversed direction for slider - higher value = closer to horizon */
.slider-reversed {
  direction: rtl;
}
</style>
