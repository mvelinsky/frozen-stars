<script setup lang="ts">
import { ref, watch } from 'vue'
import { BlackHoleEngine } from './engine/BlackHoleEngine'
import Aside from './components/Aside.vue'

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
  <div class="h-screen bg-[#0a0a12] text-gray-100 flex">
    <!-- Sidebar -->
    <Aside
      v-model:mass="mass"
      v-model:n-faller="nFaller"
      v-model:n-observer="nObserver"
    />

    <!-- Visualization Area -->
    <div class="flex-1 bg-[#0a0a12]">
      <p class="text-gray-600 text-sm">Visualization</p>
    </div>
  </div>
</template>
