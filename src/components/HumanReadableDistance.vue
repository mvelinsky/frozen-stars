<script setup lang="ts">
import { computed } from 'vue'
import { createUnits } from '../engine/units'
import { nToRadius } from '../engine/physics'

const props = defineProps<{
  solarMass: number
  n: number
}>()

const units = computed(() => createUnits(props.solarMass))

const distanceKm = computed(() => {
  const rOverRs = nToRadius(props.n)
  return rOverRs * units.value.rs_km
})

const formattedDistance = computed(() => {
  const km = distanceKm.value
  if (km >= 1e6) return `${(km / 1e6).toFixed(2)}M km`
  if (km >= 1e3) return `${(km / 1e3).toFixed(2)}k km`
  return `${km.toFixed(2)} km`
})
</script>

<template>
  <span class="font-mono text-indigo-300">{{ formattedDistance }}</span>
</template>
