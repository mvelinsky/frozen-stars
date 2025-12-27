<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { BlackHoleEngine, type IBlackHoleEngine } from './engine/BlackHoleEngine'
import type { PhotonState } from './engine/types'
import Simulation from './components/Simulation.vue'
import Controls from './components/Controls.vue'
import Display from './components/Display.vue'

// Configuration
const mass = ref<number>(1)
const r0 = ref<number>(10)
const r2 = ref<number>(15)
const currentTime = ref<number>(0)
const isPlaying = ref<boolean>(false)
const observerMode = ref<'object1' | 'object2'>('object1')

// Engine instance
const engine = ref<IBlackHoleEngine | null>(null)

// Photons array - tracks emitted photons
interface TrackedPhoton {
  tauEmit: number
  current: PhotonState
}

const photons = ref<TrackedPhoton[]>([])

// Animation state
let animationFrameId: number | null = null
let lastTimestamp: number = 0
const photonEmissionInterval = 2  // Emit photon every N proper time units
let lastEmissionTime = 0

// Create engine when config changes
const createEngine = () => {
  try {
    engine.value = new BlackHoleEngine({
      M: mass.value,
      r0: r0.value,
      r2: r2.value,
    })
    // Reset time and photons
    currentTime.value = 0
    photons.value = []
    lastEmissionTime = 0
  } catch (e) {
    console.error('Failed to create engine:', e)
  }
}

// Watch for config changes
watch([mass, r0, r2], () => {
  createEngine()
})

// Current state
const currentState = computed(() => {
  if (!engine.value) return null
  return engine.value.getState(currentTime.value)
})

// Max proper time
const maxTime = computed(() => {
  return engine.value?.getMaxProperTime() ?? 0
})

// Check if simulation has ended
const isEnded = computed(() => {
  if (!engine.value) return false
  if (observerMode.value === 'object1') {
    return currentState.value?.hasReachedHorizon ?? false
  }
  return false // Object 2 perspective - simulation never truly ends
})

// Time display based on observer mode
const displayedTime = computed(() => {
  if (!currentState.value) return 0
  if (observerMode.value === 'object1') {
    return currentState.value.object1.tau
  } else {
    return currentState.value.object2.tau
  }
})

// Advance simulation by one step
const advanceSimulation = (deltaTime: number) => {
  if (!engine.value || isEnded.value) return

  const state = engine.value.getState(currentTime.value)

  if (observerMode.value === 'object1') {
    // Advance by proper time of object 1
    currentTime.value += deltaTime
  } else {
    // For object 2 mode, we need to advance such that object 2's proper time
    // increases by deltaTime. This is slower as object 1 approaches horizon.
    const currentTau2 = state.object2.tau
    const targetTau2 = currentTau2 + deltaTime

    // Binary search to find tau1 that gives the desired tau2
    let lo = currentTime.value
    let hi = maxTime.value * 1.1

    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2
      const testState = engine.value!.getState(mid)
      if (testState.object2.tau < targetTau2) {
        lo = mid
      } else {
        hi = mid
      }
      if (hi - lo < 1e-10) break
    }

    currentTime.value = (lo + hi) / 2
  }

  // Emit photons at regular intervals
  if (currentTime.value - lastEmissionTime >= photonEmissionInterval) {
    emitPhoton()
    lastEmissionTime = currentTime.value
  }

  // Update photon positions
  updatePhotons()
}

// Emit a new photon from object 1's current position
const emitPhoton = () => {
  if (!engine.value) return
  photons.value.push({
    tauEmit: currentTime.value,
    current: { r: r0.value, n: 0, hasArrived: false },
  })
}

// Update all photon positions
const updatePhotons = () => {
  if (!engine.value) return
  photons.value = photons.value.map(p => {
    const pos = engine.value!.getPhotonPosition(p.tauEmit, currentTime.value)
    return { tauEmit: p.tauEmit, current: pos }
  }).filter(p => !p.current.hasArrived) // Remove arrived photons
}

// Animation loop
const animate = (timestamp: number) => {
  if (!lastTimestamp) lastTimestamp = timestamp
  const elapsed = timestamp - lastTimestamp

  if (isPlaying.value) {
    // Time scaling: run at reasonable speed
    const timeScale = 0.5
    advanceSimulation(elapsed * timeScale / 1000)
  }

  lastTimestamp = timestamp
  animationFrameId = requestAnimationFrame(animate)
}

// Toggle play/pause
const togglePlay = () => {
  isPlaying.value = !isPlaying.value
}

// Skip to specific time
const skipToTime = (time: number) => {
  if (!engine.value) return
  currentTime.value = Math.max(0, Math.min(time, maxTime.value))
  // Clear photons when skipping
  photons.value = []
  lastEmissionTime = currentTime.value
}

// Reset simulation
const resetSimulation = () => {
  currentTime.value = 0
  photons.value = []
  lastEmissionTime = 0
  isPlaying.value = false
}

// Lifecycle
onMounted(() => {
  createEngine()
  animationFrameId = requestAnimationFrame(animate)
})

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<template>
  <div class="app">
    <h1>Black Hole Frozen Star Visualization</h1>
    <p class="subtitle">
      Objects never appear to cross the event horizon from an external observer's perspective
    </p>

    <div class="container">
      <Simulation
        :engine="engine"
        :state="currentState"
        :photons="photons"
        :observer-mode="observerMode"
      />

      <div class="sidebar">
        <Display
          :state="currentState"
          :displayed-time="displayedTime"
          :observer-mode="observerMode"
          :max-time="maxTime"
        />

        <Controls
          v-model:mass="mass"
          v-model:r0="r0"
          v-model:r2="r2"
          v-model:current-time="currentTime"
          v-model:observer-mode="observerMode"
          :is-playing="isPlaying"
          :is-ended="isEnded"
          :max-time="maxTime"
          @toggle-play="togglePlay"
          @skip-to-time="skipToTime"
          @reset="resetSimulation"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  font-family: system-ui, -apple-system, sans-serif;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  color: #e0e0e0;
}

h1 {
  text-align: center;
  margin-bottom: 5px;
  color: #fff;
}

.subtitle {
  text-align: center;
  color: #888;
  margin-bottom: 30px;
  font-size: 0.95rem;
}

.container {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 20px;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (max-width: 1000px) {
  .container {
    grid-template-columns: 1fr;
  }
}
</style>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: #0a0a0f;
  min-height: 100vh;
}

input {
  font-family: inherit;
}

button {
  font-family: inherit;
}
</style>
