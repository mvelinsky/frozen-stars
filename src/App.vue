<script setup lang="ts">
import { ref, watch, computed, onUnmounted } from 'vue'
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

// Photon emission state
interface Photon {
  id: string
  emitNTau: number          // When emitted (log time)
  emitObserverTau: number   // Observer proper time at emission
  nEmit: number            // Starting position (observer n)
  direction: 'in' | 'out'  // Inbound to faller, or outbound to observer
  status: 'traveling' | 'reflected' | 'arrived'
  currentN: number         // Current position
  targetReachedAt?: number // n-tau when reached target
}

const photons = ref<Photon[]>([])
const activePhotonId = ref<string | null>(null)
const isPhotonAnimating = ref(false)

// Animation frame ID for cleanup
let photonAnimationId: number | null = null

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
  return delta
})

const timeToReceiveResponse = computed(() => timeToIntercept.value * 2)

// Show/hide instructions
const showInstructions = ref(true)

function toggleInstructions() {
  showInstructions.value = !showInstructions.value
}

// ===== Photon Emission Functions =====

function emitPhoton() {
  const state = engine.value.getStateByNTau(currentNTau.value)

  const photon: Photon = {
    id: Date.now().toString(),
    emitNTau: currentNTau.value,
    emitObserverTau: state.object2.tau,
    nEmit: nObserver.value,
    direction: 'in',
    status: 'traveling',
    currentN: nObserver.value
  }

  photons.value.push(photon)
  activePhotonId.value = photon.id

  // Start auto-advance animation
  isPhotonAnimating.value = true
  photonAnimationId = requestAnimationFrame(animatePhoton)
}

function updatePhotons() {
  const state = engine.value.getStateByNTau(currentNTau.value)
  const currentObserverTau = state.object2.tau

  photons.value.forEach(photon => {
    if (photon.status === 'arrived') return

    if (photon.direction === 'in') {
      // Inward: observer → faller
      photon.currentN = engine.value.getObserverPhotonN(
        photon.emitObserverTau,
        currentObserverTau
      )

      // Check if reached faller
      const fallerN = state.object1.n
      if (photon.currentN >= fallerN) {
        photon.status = 'reflected'
        photon.direction = 'out'
        photon.targetReachedAt = currentNTau.value
        photon.nEmit = fallerN  // New emission point for return journey
      }
    } else {
      // Outward: faller → observer
      // Calculate current coordinate time for outward photon
      const tCurrent = state.coordinateTime
      const tEmit = engine.value.getState(engine.value.nTauToTau(photon.targetReachedAt || 0)).coordinateTime
      const dt = tCurrent - tEmit
      // Use outward photon calculation from physics.ts
      // For outward journey, we need to use the physics.photonN function
      // which calculates n decreasing outward
      const speed = 1 / (Math.LN10 * Math.pow(10, Math.max(photon.nEmit, 0)))
      photon.currentN = photon.nEmit - dt * speed

      // Check if reached observer
      if (photon.currentN <= nObserver.value) {
        photon.status = 'arrived'
        photon.currentN = nObserver.value  // Snap to observer position
        activePhotonId.value = null
        isPhotonAnimating.value = false
      }
    }
  })
}

function getPhotonETA(photon: Photon): number {
  const state = engine.value.getStateByNTau(currentNTau.value)
  const currentObserverTau = state.object2.tau

  if (photon.direction === 'in') {
    // Time to reach faller = use existing getPhotonInterceptDelta
    const delta = engine.value.getPhotonIntersectDelta(currentObserverTau)
    return isFinite(delta) ? delta : Infinity
  } else {
    // Time to return to observer - calculate based on remaining distance
    const distanceToFaller = photon.currentN - nObserver.value
    // Convert n-distance to approximate time
    // At higher n, travel is faster due to less gravitational delay
    const avgN = (photon.currentN + nObserver.value) / 2
    const speed = 1 / (Math.LN10 * Math.pow(10, Math.max(avgN, 0)))
    return Math.max(0, distanceToFaller / speed)
  }
}

let lastTime = 0

function animatePhoton(currentTime: number) {
  if (!isPhotonAnimating.value) return

  const elapsed = currentTime - lastTime
  if (elapsed >= 33) { // ~30 FPS
    // Advance n_tau by a small amount each frame
    const delta = 0.01 // Small increment for smooth animation
    currentNTau.value += delta

    // Update photon position
    updatePhotons()

    // Check if photon arrived
    const activePhoton = photons.value.find(p => p.id === activePhotonId.value)
    if (activePhoton?.status === 'arrived') {
      isPhotonAnimating.value = false
      if (photonAnimationId) {
        cancelAnimationFrame(photonAnimationId)
        photonAnimationId = null
      }
      return
    }

    lastTime = currentTime
  }

  photonAnimationId = requestAnimationFrame(animatePhoton)
}

// Cleanup on unmount
onUnmounted(() => {
  if (photonAnimationId) {
    cancelAnimationFrame(photonAnimationId)
  }
})

// Active photon for UI display
const activePhoton = computed(() => {
  if (!activePhotonId.value) return null
  return photons.value.find(p => p.id === activePhotonId.value) || null
})

// Pass photons to visualization
const photonsForVis = computed(() => photons.value)
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
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-xs text-blue-300/60 uppercase tracking-widest font-medium">
              Photon Emission
              <span class="normal-case tracking-normal text-gray-400 font-normal ml-2">— information exchange between observer and faller</span>
            </h3>
            <button
              @click="emitPhoton"
              :disabled="!!activePhotonId"
              class="px-3 py-1.5 text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Emit Photon
            </button>
          </div>
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
          <div v-if="activePhoton" class="mt-2 flex items-center gap-3">
            <span class="text-gray-400 text-xs">
              Photon ETA: <span class="font-mono text-blue-400">{{ isFinite(getPhotonETA(activePhoton)) ? formatTime(getPhotonETA(activePhoton), 4) : '∞' }}</span>
            </span>
            <span class="text-gray-500 text-xs">
              ({{ activePhoton.direction === 'in' ? 'inbound to faller' : 'returning to observer' }})
            </span>
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
          :photons="photonsForVis"
        />
      </div>

      <!-- Instructions Section - header always visible, content collapsible -->
      <div class="flex flex-col border-t border-gray-700/30 min-h-0" :class="showInstructions ? 'flex-1' : 'flex-none'">
        <Instructions :expanded="showInstructions" @toggle="toggleInstructions" />
      </div>
    </div>
  </div>
</template>
