<script setup lang="ts">
import { computed } from 'vue'
import { createUnits } from '../engine/units'

const props = defineProps<{
  solarMass: number
  n: number  // Logarithmic distance coordinate from engine
}>()

// Calculate distance to horizon
// n = -log10((r - rs) / rs)
// r/rs = 1 + 10^(-n)
// distance to horizon = (r - rs) = rs * 10^(-n)

const units = computed(() => createUnits(props.solarMass))

const distanceToHorizon = computed(() => {
  const rs_km = units.value.distanceToKm(1)  // rs in km
  const rs_meters = rs_km * 1000  // convert to meters
  return rs_meters * Math.pow(10, -props.n)
})

function formatDistance(meters: number): string {
  if (meters <= 0) return '0 m (at horizon)'

  const planckLength = 1.616e-35
  const plancks = meters / planckLength

  // Sub-Planck scales (probably unphysical)
  if (plancks < 1e-20) {
    return `${plancks.toExponential(2)} lP (vastly sub-Planck)`
  }
  if (plancks < 0.01) {
    return `${plancks.toExponential(2)} lP (sub-Planck)`
  }
  if (plancks < 1) {
    return `${plancks.toFixed(3)} lP (sub-Planck)`
  }

  // Planck to super-Planck (up to ~femtometer scale, since 1e20 lP ≈ 1.6 fm)
  if (plancks < 10) {
    return `${plancks.toFixed(2)} lP (Planck scale)`
  }
  if (plancks < 1e3) {
    return `${plancks.toFixed(1)} lP`
  }
  if (plancks < 1e6) {
    return `${(plancks / 1e3).toFixed(2)}k lP`
  }
  if (plancks < 1e9) {
    return `${(plancks / 1e6).toFixed(2)}M lP`
  }
  if (plancks < 1e12) {
    return `${(plancks / 1e9).toFixed(2)}G lP`
  }
  if (plancks < 1e15) {
    return `${(plancks / 1e12).toFixed(2)}T lP`
  }
  if (plancks < 1e18) {
    return `${(plancks / 1e15).toFixed(2)}P lP (subatomic)`
  }

  // Subatomic scale (attometer and above - now we have enough precision)
  if (meters < 1e-18) return `${(meters * 1e18).toFixed(2)} am (subatomic)`
  if (meters < 1e-15) return `${(meters * 1e15).toFixed(2)} fm (nuclear scale)`

  // Atomic scale
  if (meters < 1e-10) return `${(meters * 1e12).toFixed(2)} pm (atomic scale)`
  if (meters < 1e-9) return `${(meters * 1e9).toFixed(2)} nm (molecular)`

  // Microscopic
  if (meters < 1e-6) return `${(meters * 1e6).toFixed(2)} μm (cellular)`
  if (meters < 1e-3) return `${(meters * 1e3).toFixed(2)} mm (microscopic)`

  // Human scale
  if (meters < 1) return `${(meters * 100).toFixed(2)} cm`
  if (meters < 1000) return `${meters.toFixed(2)} m`
  if (meters < 100000) return `${(meters / 1000).toFixed(2)} km`

  // Planetary scale
  const earthRadius = 6.371e6
  if (meters < earthRadius * 100) {
    return `${(meters / earthRadius).toFixed(2)} Earth radii`
  }

  // Solar system scale
  const AU = 1.496e11
  if (meters < AU) {
    return `${(meters / 1e9).toFixed(2)} Gm (${(meters / earthRadius).toFixed(0)}× Earth)`
  }
  if (meters < AU * 100) {
    return `${(meters / AU).toFixed(3)} AU`
  }
  if (meters < AU * 100000) {
    return `${(meters / AU).toFixed(1)} AU (solar system)`
  }

  // Interstellar scale
  const lightYear = 9.461e15
  if (meters < lightYear * 1000) {
    return `${(meters / lightYear).toFixed(2)} light-years`
  }

  // Galactic scale
  const parsec = 3.086e16
  if (meters < parsec * 1000) {
    return `${(meters / parsec).toFixed(2)} parsecs`
  }
  if (meters < parsec * 1e6) {
    return `${(meters / parsec / 1000).toFixed(2)} kpc (galactic)`
  }

  // Cosmic scale
  if (meters < parsec * 1e9) {
    return `${(meters / parsec / 1e6).toFixed(2)} Mpc (cosmic)`
  }

  return `${(meters / lightYear).toExponential(2)} ly (cosmological)`
}</script>

<template>
  <span class="text-gray-400">{{ formatDistance(distanceToHorizon) }}</span>
</template>
