<script setup lang="ts">
import { ref, watch } from 'vue'
import { BlackHoleEngine } from './engine/BlackHoleEngine'
import Controls from './components/Controls.vue'

// Configuration
const mass = ref<number>(10)
const nFaller = ref<number>(0)
const nObserver = ref<number>(-1)

// Engine instance
const engine = ref<BlackHoleEngine>(new BlackHoleEngine({
  nFaller: nFaller.value,
  nObserver: nObserver.value,
}))

// Recreate engine when config changes
watch([nFaller, nObserver], () => {
  engine.value = new BlackHoleEngine({
    nFaller: nFaller.value,
    nObserver: nObserver.value,
  })
})
</script>

<template>
  <div class="min-h-screen bg-[#0f0f1a] text-gray-100">
    <div class="max-w-6xl mx-auto px-4 py-8">
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-center mb-2">
          Black Hole Frozen Star Visualization
        </h1>
        <p class="text-center text-gray-400 text-sm max-w-2xl mx-auto">
          Objects never appear to cross the event horizon from an external observer's perspective
        </p>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Controls Sidebar -->
        <div class="lg:col-span-1">
          <Controls
            v-model:mass="mass"
            v-model:nFaller="nFaller"
            v-model:nObserver="nObserver"
          />
        </div>

        <!-- Visualization Area -->
        <div class="lg:col-span-2 bg-[#1a1a2e] rounded-xl p-6 min-h-[500px]">
          <p class="text-gray-500 text-center">Visualization coming soon...</p>
        </div>
      </div>
    </div>
  </div>
</template>
