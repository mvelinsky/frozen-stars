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

const approximateExample = computed(() => {
  const km = distanceKm.value
  const au = km / 149600000

  if (km < 100) return ''
  if (km < 1000) return '≈ 0.01× Earth diameter'
  if (km < 5000) return '≈ 0.1× Earth diameter'
  if (km < 15000) return '≈ Earth diameter'
  if (km < 40000) return '≈ 2× Earth diameter'
  if (km < 100000) return '≈ 0.25× to Moon'
  if (km < 200000) return '≈ 0.5× to Moon'
  if (km < 400000) return '≈ distance to Moon'
  if (km < 1000000) return '≈ 2× Moon distance'
  if (km < 50000000) return `≈ ${(km / 384400).toFixed(0)}× Moon distance`
  if (km < 150000000) return '≈ 0.5 AU (Venus orbit)'
  if (km < 300000000) return '≈ 1 AU (Earth orbit)'
  if (km < 600000000) return '≈ 2 AU (Mars orbit)'
  if (km < 2000000000) return `≈ ${au.toFixed(1)} AU`
  if (km < 5000000000) return '≈ Jupiter (5 AU)'
  if (km < 10000000000) return '≈ Saturn (10 AU)'
  if (km < 30000000000) return `≈ ${au.toFixed(0)} AU`
  if (km < 50000000000) return '≈ Pluto (33 AU)'
  if (km < 100000000000) return '≈ inner Kuiper Belt'
  if (km < 300000000000) return '≈ Kuiper Belt'
  if (km < 750000000000) return '≈ outer Kuiper Belt'
  if (km < 1500000000000) return '≈ inner Oort Cloud'
  if (km < 5000000000000) return '≈ outer Oort Cloud'
  if (km < 15000000000000) return '≈ 100,000 AU'
  if (km < 40000000000000) return '≈ Proxima Centauri (4.2 ly)'
  if (km < 80000000000000) return '≈ Sirius (8.6 ly)'
  if (km < 150000000000000) return `≈ ${(au / 63241).toFixed(0)} ly`
  if (km < 400000000000000) return '≈ Arcturus (37 ly)'
  if (km < 600000000000000) return '≈ Betelgeuse (400 ly)'
  if (km < 1000000000000000) return `≈ ${(au / 63241).toFixed(0)} ly`

  const lightYears = au / 63241
  return `≈ ${lightYears.toFixed(0)} ly`
})
</script>

<template>
  <div class="flex flex-col">
    <span class="font-mono text-indigo-300">{{ formattedDistance }}</span>
    <span class="text-xs text-slate-500">{{ approximateExample }}</span>
  </div>
</template>
