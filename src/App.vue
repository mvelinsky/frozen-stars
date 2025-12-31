<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { BlackHoleEngine } from './engine/BlackHoleEngine'
import { createUnits } from './engine/units'
import { timeScales } from './engine/timescales'
import Aside from './components/Aside.vue'
import DistanceToHorizon from './components/DistanceToHorizon.vue'
import Visualization from './components/Visualization.vue'

// Configuration
const mass = ref<number>(10)
const nFaller = ref<number>(0)
const nObserver = ref<number>(-1)

// Current simulation time in logarithmic form (n_tau)
const currentNTau = ref<number>(0)

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

function formatTime(tau: number): string {
  const seconds = units.value.tauToSeconds(tau)
  if (seconds < 1e-15) return `${(seconds * 1e18).toFixed(2)}as`
  if (seconds < 1e-12) return `${(seconds * 1e15).toFixed(2)}fs`
  if (seconds < 1e-9) return `${(seconds * 1e12).toFixed(2)}ps`
  if (seconds < 1e-6) return `${(seconds * 1e9).toFixed(2)}ns`
  if (seconds < 1e-3) return `${(seconds * 1e6).toFixed(2)}μs`
  if (seconds < 1) return `${(seconds * 1e3).toFixed(2)}ms`
  if (seconds < 60) return `${seconds.toFixed(2)}s`
  if (seconds < 3600) return `${(seconds / 60).toFixed(2)}m`
  if (seconds < 86400) return `${(seconds / 3600).toFixed(2)}h`
  if (seconds < 31536000) return `${(seconds / 86400).toFixed(2)}d`
  const years = seconds / 31536000
  if (years < 1e15) return `${years.toFixed(2)}y`
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
  console.log('intercept:', { nTau: currentNTau.value, fallerN: state.object1.n, observerTau: currentObserverTau, delta })
  return delta
})

const timeToReceiveResponse = computed(() => timeToIntercept.value * 2)

// Explanation tabs
const activeTab = ref<'main' | 'faq'>('main')

// FAQ data
const faqItems = [
  { q: "Isn't this just a coordinate artifact?", a: 'Coordinate time approaching infinity is telling you something physical: the crossing takes infinite time as measured by stationary observers at any finite radius. You can switch to Kruskal coordinates where the crossing happens at finite coordinate values, but Kruskal coordinates implicitly assume time extends to t = ∞. If the universe ends at finite t, the Kruskal extension describes regions causally disconnected from the external universe.' },
  { q: "What about the infalling observer's experience?", a: 'The infalling observer definitely experiences crossing in finite proper time (~278 microseconds in this simulation). The question isn\'t "what does B experience?" but "what exists in the observable universe from external frame A?" These can have different answers when events require infinite coordinate time.' },
  { q: "Can't we observe black holes with LIGO?", a: 'LIGO observes ultra-compact objects producing gravitational waves consistent with objects very close to r = 2M. The ringdown signals from an object at r = 2M + ε (frozen star) are nearly indistinguishable from r = 2M (true black hole) for arbitrarily small ε. To date, no observation definitively confirms event horizon crossing. Some research groups search for "echoes" that would indicate a surface rather than a horizon, but results remain inconclusive.' },
  { q: 'Is this a fringe position?', a: 'The "frozen star" interpretation was the original understanding (Wheeler, 1950s) before Kruskal-Szekeres coordinates (1960) enabled working with the maximal extension. Recent years have seen renewed serious discussion (Mersini-Houghton, Vachaspati, others) as quantum gravity has failed to resolve black hole paradoxes in 70+ years. The position is scientifically defensible: assert only what\'s operationally verifiable rather than mathematical extensions into causally inaccessible regions.' },
  { q: 'Where does GR break down?', a: 'GR\'s equations remain valid at all radii r > 2M shown here. The Schwarzschild metric is smooth and well-defined. The "breakdown" isn\'t mathematical—it\'s interpretational: does the maximal extension represent physical reality, or just mathematical possibility?' },
  { q: 'Why does standard physics claim black holes exist?', a: 'Most physicists treat the Kruskal extension as physically real, not just mathematically valid. This is a philosophical choice: trust the complete mathematical solution over operational verifiability. Both positions use the same GR equations; they disagree on what "exists" means for regions requiring infinite coordinate time to verify.' },
  { q: 'What would prove horizons are real?', a: 'Detecting distinctive signatures impossible for frozen stars: gravitational wave echoes from a surface (absent in true horizons), or quantum gravity effects that allow finite-time crossing. Neither has been observed. Until then, "frozen star" and "true black hole" remain observationally equivalent.' }
]
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
    <div class="flex-1 flex flex-col bg-[#0a0a12]">
      <!-- Stats Panel -->
      <div class="bg-[#12121f] border-b-2 border-blue-500/20">
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
          <h3 class="text-xs text-blue-300/60 mb-2 uppercase tracking-widest font-medium">
            Photon Emission
            <span class="normal-case tracking-normal text-gray-400 font-normal ml-2">— information exchange between observer and faller</span>
          </h3>
          <div class="flex items-baseline gap-8">
            <div>
              <span class="text-gray-400 text-sm mr-2">Time to intercept:</span>
              <span class="font-mono text-xl text-blue-400">{{ isFinite(timeToIntercept) ? formatTime(timeToIntercept) : '∞' }}</span>
            </div>
            <div>
              <span class="text-gray-500 text-sm mr-2">Round-trip:</span>
              <span class="font-mono text-gray-400">{{ isFinite(timeToReceiveResponse) ? formatTime(timeToReceiveResponse) : '∞' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Visualization -->
      <Visualization
        :solar-mass="mass"
        :n-faller="nFaller"
        :n-observer="nObserver"
        :n-current-faller="currentState.object1.n"
      />

      <!-- Explanation Section -->
      <div class="flex-1 flex flex-col min-h-0 bg-[#0a0a12]">
        <!-- Tabs -->
        <div class="flex border-b border-gray-700/50 px-6">
          <button
            @click="activeTab = 'main'"
            :class="[
              'px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === 'main'
                ? 'border-blue-400 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            ]"
          >
            What am I looking at?
          </button>
          <button
            @click="activeTab = 'faq'"
            :class="[
              'px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === 'faq'
                ? 'border-blue-400 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            ]"
          >
            FAQ
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto px-8 py-6">
          <!-- Main Text Tab -->
          <div v-if="activeTab === 'main'" class="max-w-3xl prose prose-invert prose-sm">
            <h1 class="text-xl font-semibold text-blue-300 mb-2">Black Holes Take Infinite Time to Form</h1>
            <p class="text-sm text-gray-400 mb-6">GR's Prediction: Frozen Stars, Not Black Holes</p>

            <p class="text-gray-300 leading-relaxed">
              This simulation demonstrates a geometric consequence of Einstein's General Relativity that's often overlooked: from the perspective of any external observer, an event horizon never forms in finite time.
            </p>

            <p class="text-gray-300 leading-relaxed">
              When an object falls toward a black hole, two reference frames tell seemingly different stories. The infalling object experiences a smooth journey and crosses the event horizon in finite proper time—typically seconds to hours for stellar-mass black holes. However, from the perspective of a distant stationary observer using Schwarzschild coordinates, the crossing occurs at coordinate time t → ∞.
            </p>

            <p class="text-gray-300 leading-relaxed">
              This isn't a visual illusion or communication delay. You can verify the object remains outside the horizon by sending light signals: at any finite coordinate time t, a photon sent from the external observer will reach the infalling object before it crosses, and the reflected signal will return. This two-way communication continues indefinitely in coordinate time.
            </p>

            <p class="text-gray-300 leading-relaxed">
              The critical question: If our universe has a finite lifetime—whether ending in heat death, Big Rip, or any other finite-coordinate-time event—what does it mean for something to "cross the horizon" at t = ∞?
            </p>

            <p class="text-gray-300 leading-relaxed">
              This simulation lets you explore this paradox. As the infalling object approaches arbitrarily close to the event horizon (down to sub-Planck distances of 10^-39 Planck lengths), the external observer's clock advances to 10^65+ years—far beyond any reasonable universe lifetime. At every stage, you can send photons that catch the infalling object and return, demonstrating ongoing causal contact.
            </p>

            <h2 class="text-base font-semibold text-blue-300 mt-8 mb-4">Two Interpretations</h2>

            <div class="flex gap-8">
              <p class="flex-1 text-gray-300 leading-relaxed">
                <strong class="text-blue-300">Orthodox view:</strong> The interior "exists" in the maximal analytic extension of the spacetime (Kruskal-Szekeres coordinates), even though no external observer can verify this before the universe ends.
              </p>

              <p class="flex-1 text-gray-300 leading-relaxed">
                <strong class="text-blue-300">Frozen star view:</strong> Only assert what's operationally verifiable. If external observers can signal the infalling matter until the universe ends, then from the external universe's perspective, no horizon has formed. What exists are ultra-compact objects arbitrarily close to r = 2M, not true black holes with interiors.
              </p>
            </div>

            <p class="text-gray-300 leading-relaxed mt-4">
              This simulation doesn't claim GR is wrong—it shows exactly what GR predicts in Schwarzschild coordinates for external observers.
            </p>
          </div>

          <!-- FAQ Tab -->
          <div v-else class="max-w-3xl space-y-6">
            <div v-for="(item, index) in faqItems" :key="index" class="border-b border-gray-700/30 pb-6 last:border-0">
              <p class="text-blue-300 font-medium mb-2">{{ item.q }}</p>
              <p class="text-gray-400 text-sm leading-relaxed">{{ item.a }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
