<script setup lang="ts">
import { ref } from 'vue'

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

defineProps<{ expanded: boolean }>()
defineEmits<{ toggle: [] }>()
</script>

<template>
  <div class="flex flex-col min-h-0 bg-[#0a0a12]">
    <!-- Header Bar -->
    <div class="flex items-center justify-between border-b border-gray-700/50 px-6 py-2 cursor-pointer hover:bg-[#0f0f1a] transition-colors select-none" @click="$emit('toggle')">
      <div class="flex gap-1">
        <button
          @click.stop="expanded ? (activeTab = 'main') : $emit('toggle')"
          :class="[
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'main'
              ? 'border-blue-400 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          ]"
        >
          What am I looking at?
        </button>
        <button
          @click.stop="expanded ? (activeTab = 'faq') : $emit('toggle')"
          :class="[
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'faq'
              ? 'border-blue-400 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          ]"
        >
          FAQ
        </button>
      </div>

      <button
        @click.stop="$emit('toggle')"
        class="p-1 text-gray-400 hover:text-gray-300 transition-colors rounded hover:bg-gray-700/30"
        :title="expanded ? 'Collapse' : 'Expand'"
      >
        <svg class="w-5 h-5 transition-transform" :class="{ 'rotate-180': expanded }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>

    <!-- Content -->
    <div v-if="expanded" class="flex-1 overflow-y-auto px-8 py-6">
      <!-- Main Text Tab -->
      <div v-if="activeTab === 'main'" class="max-w-3xl prose prose-invert prose-sm">
        <h1 class="text-xl font-semibold text-blue-300 mb-2">Black Holes Take Infinite Time to Form</h1>
        <p class="text-sm text-gray-400 mb-6">GR's Prediction: Frozen Stars, Not Black Holes</p>

        <p class="text-gray-300 leading-relaxed mb-6">
          This simulation demonstrates a geometric consequence of Einstein's General Relativity that's often overlooked: from the perspective of any external observer, an event horizon never forms in finite time.
        </p>

        <p class="text-gray-300 leading-relaxed mb-6">
          When an object falls toward a black hole, two reference frames tell seemingly different stories. The infalling object experiences a smooth journey and crosses the event horizon in finite proper time—typically seconds to hours for stellar-mass black holes. However, from the perspective of a distant stationary observer using Schwarzschild coordinates, the crossing occurs at coordinate time t → ∞.
        </p>

        <p class="text-gray-300 leading-relaxed mb-6">
          This isn't a visual illusion or communication delay. You can verify the object remains outside the horizon by sending light signals: at any finite coordinate time t, a photon sent from the external observer will reach the infalling object before it crosses, and the reflected signal will return. This two-way communication continues indefinitely in coordinate time.
        </p>

        <p class="text-gray-300 leading-relaxed mb-6">
          The critical question: If our universe has a finite lifetime—whether ending in heat death, Big Rip, or any other finite-coordinate-time event—what does it mean for something to "cross the horizon" at t = ∞?
        </p>

        <p class="text-gray-300 leading-relaxed mb-6">
          This simulation lets you explore this paradox. As the infalling object approaches arbitrarily close to the event horizon (down to sub-Planck distances of 10^-39 Planck lengths), the external observer's clock advances to 10^65+ years—far beyond any reasonable universe lifetime. At every stage, you can send photons that catch the infalling object and return, demonstrating ongoing causal contact.
        </p>

        <h2 class="text-base font-semibold text-blue-300 mt-8 mb-4">Two Interpretations</h2>

        <div class="flex gap-8 mb-6">
          <p class="flex-1 text-gray-300 leading-relaxed">
            <strong class="text-blue-300">Orthodox view:</strong> The interior "exists" in the maximal analytic extension of the spacetime (Kruskal-Szekeres coordinates), even though no external observer can verify this before the universe ends.
          </p>

          <p class="flex-1 text-gray-300 leading-relaxed">
            <strong class="text-blue-300">Frozen star view:</strong> Only assert what's operationally verifiable. If external observers can signal the infalling matter until the universe ends, then from the external universe's perspective, no horizon has formed. What exists are ultra-compact objects arbitrarily close to r = 2M, not true black holes with interiors.
          </p>
        </div>

        <p class="text-gray-300 leading-relaxed">
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
</template>
