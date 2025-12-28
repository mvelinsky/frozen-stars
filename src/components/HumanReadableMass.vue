<script setup lang="ts">
import { computed } from 'vue'
import { M_SUN } from '../engine/units'

const props = defineProps<{
  solarMass: number
}>()

const massKg = computed(() => props.solarMass * M_SUN)

const formattedMass = computed(() => {
  const kg = massKg.value
  if (kg >= 1e30) return `${(kg / 1.989e30).toFixed(2)} × 10³⁰ kg`
  return `${kg.toExponential(2)} kg`
})

const approximateExample = computed(() => {
  const m = props.solarMass

  if (m < 0.1) return '≈ very small'
  if (m < 0.5) return '≈ small star'
  if (m < 1) return '≈ red dwarf'
  if (m < 1.5) return '≈ Sun-like star'
  if (m < 3) return '≈ Sirius A (2.0 M☉)'
  if (m < 8) return '≈ B-type star'
  if (m < 15) return '≈ large star'
  if (m < 25) return '≈ Rigel (20 M☉)'
  if (m < 40) return '≈ very massive star'
  if (m < 60) return '≈ Eta Carinae (~50 M☉)'
  if (m < 100) return '≈ stellar black hole'
  if (m < 500) return '≈ intermediate black hole'
  if (m < 1000) return '≈ large intermediate black hole'
  if (m < 5000) return '≈ small supermassive black hole'
  if (m < 10000) return '≈ Sgr A* (~4M M☉)'
  if (m < 50000) return '≈ typical galactic center'
  if (m < 100000) return '≈ M87* (~6.5B M☉)'
  if (m < 500000) return '≈ large supermassive black hole'
  if (m < 1000000) return '≈ monster black hole'

  return `≈ ${(m / 1e6).toFixed(2)}M M☉`
})
</script>

<template>
  <div class="flex flex-col items-end">
    <span class="font-mono text-blue-400 text-xs">{{ formattedMass }}</span>
    <span class="text-[12px] text-gray-500">{{ approximateExample }}</span>
  </div>
</template>
