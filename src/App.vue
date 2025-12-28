<script setup lang="ts">
import { ref, computed } from 'vue'
import { BlackHoleEngine } from './engine/BlackHoleEngine'

// Configuration
const nFaller = ref<number>(0)
const nObserver = ref<number>(-1)

// Engine instance
const engine = ref<BlackHoleEngine>(new BlackHoleEngine({
  nFaller: nFaller.value,      // starts 1×rs above horizon (r = 2rs)
  nObserver: nObserver.value,   // observer 10×rs above horizon (r = 11rs)
}))

console.log(engine.value.getPhotonN);
console.log(engine.value);
</script>

<template>
  <div class="app">
    <h1 class="pt-[28px]">Black Hole Frozen Star Visualization</h1>
    <p class="subtitle">
      Objects never appear to cross the event horizon from an external observer's perspective
    </p>

    <div class="container">
      <div class="sidebar">

      </div>
    </div>
  </div>
</template>
