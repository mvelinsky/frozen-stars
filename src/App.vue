<script setup lang="ts">
import { ref, watch } from 'vue'
import { BlackHoleEngine } from './engine/BlackHoleEngine'
import Controls from './components/Controls.vue'

// Configuration
const mass = ref<number>(10)
const nFaller = ref<number>(-7)
const nObserver = ref<number>(-8)

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
  <div class="h-screen bg-[#0a0a12] text-gray-100 flex">
    <!-- Controls Sidebar -->
    <div class="w-80 h-full bg-[#0f0f18] border-r border-white/5 flex flex-col">
      <Controls
        v-model:mass="mass"
        v-model:nFaller="nFaller"
        v-model:nObserver="nObserver"
      />
    </div>

    <!-- Visualization Area -->
    <div class="flex-1 bg-[#0a0a12]">
      <p class="text-gray-600 text-sm">Visualization</p>
    </div>
  </div>
</template>
