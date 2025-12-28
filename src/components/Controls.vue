<script setup lang="ts">
import { computed } from 'vue'
import { createUnits } from '../engine/units'
import HumanReadableDistance from './HumanReadableDistance.vue'
import HumanReadableMass from './HumanReadableMass.vue'

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
  <div class="p-5 space-y-5">
    <!-- Mass Input -->
    <div class="flex flex-col gap-1.5">
      <label class="flex justify-between items-center text-xs">
        <span class="text-gray-400">Mass</span>
        <span class="font-mono text-blue-400">{{ mass }} M☉</span>
      </label>
      <input
        type="number"
        :value="mass"
        @input="emit('update:mass', Number(($event.target as HTMLInputElement).value))"
        min="0.1"
        max="999999"
        step="1"
        class="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 text-gray-200 text-sm focus:outline-none focus:border-blue-400/50"
      />
      <div class="flex justify-between items-center">
        <span class="text-[12px] text-gray-600">Schwarzschild radius: {{ units.rs_km.toFixed(2) }} km</span>
        <HumanReadableMass :solar-mass="mass" />
      </div>
    </div>

    <!-- nFaller Slider -->
    <div class="flex flex-col gap-1.5">
      <label class="flex justify-between items-center text-xs">
        <span class="text-gray-400">Faller (n)</span>
        <span class="font-mono text-blue-400">{{ nFaller.toFixed(1) }}</span>
      </label>
      <input
        type="range"
        :value="nFaller"
        @input="onUpdateFaller(Number(($event.target as HTMLInputElement).value))"
        min="-10"
        max="2"
        step="0.1"
        class="slider-reversed w-full h-1 bg-white/10 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-blue-400 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0"
      />
      <div class="flex justify-between items-center">
        <span class="text-[12px] text-gray-600">Distance from horizon:</span>
        <HumanReadableDistance :solar-mass="mass" :n="nFaller" />
      </div>
    </div>

    <!-- nObserver Slider -->
    <div class="flex flex-col gap-1.5">
      <label class="flex justify-between items-center text-xs">
        <span class="text-gray-400">Observer (n)</span>
        <span class="font-mono text-blue-400">{{ nObserver.toFixed(1) }}</span>
      </label>
      <input
        type="range"
        :value="nObserver"
        @input="onUpdateObserver(Number(($event.target as HTMLInputElement).value))"
        min="-10"
        max="2"
        step="0.1"
        class="slider-reversed w-full h-1 bg-white/10 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-blue-400 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0"
      />
      <div class="flex justify-between items-center">
        <span class="text-[12px] text-gray-600">Distance from horizon:</span>
        <HumanReadableDistance :solar-mass="mass" :n="nObserver" />
      </div>
    </div>

    <!-- Scale Reference -->
    <div class="pt-4 mt-2 border-t border-white/5">
      <div class="text-[12px] font-medium text-gray-600 mb-2 uppercase tracking-widest">n scale</div>
      <div class="flex flex-col gap-0.5 text-[12px]">
        <div class="flex justify-between">
          <span class="font-mono text-blue-400">n = -2</span>
          <span class="text-gray-600">far (r = 101rs)</span>
        </div>
        <div class="flex justify-between">
          <span class="font-mono text-blue-400">n = 0</span>
          <span class="text-gray-600">1×rs above horizon</span>
        </div>
        <div class="flex justify-between">
          <span class="font-mono text-blue-400">n = 2</span>
          <span class="text-gray-600">very close</span>
        </div>
        <div class="flex justify-between">
          <span class="font-mono text-blue-400">n → ∞</span>
          <span class="text-gray-600">at horizon</span>
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
