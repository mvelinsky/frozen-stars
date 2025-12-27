<script setup lang="ts">
interface Props {
  mass: number
  r0: number
  r2: number
  currentTime: number
  observerMode: 'object1' | 'object2'
  isPlaying: boolean
  isEnded: boolean
  maxTime: number
}

defineProps<Props>()

const emit = defineEmits<{
  'update:mass': [value: number]
  'update:r0': [value: number]
  'update:r2': [value: number]
  'update:currentTime': [value: number]
  'update:observerMode': [value: 'object1' | 'object2']
  'togglePlay': []
  'skipToTime': [value: number]
  'reset': []
}>()

const skipTo = (percent: number) => {
  emit('skipToTime', percent)
}
</script>

<template>
  <div class="controls">
    <h3>Controls</h3>

    <!-- Play/Pause/Reset -->
    <div class="button-row">
      <button
        class="btn btn-primary"
        @click="$emit('togglePlay')"
        :disabled="isEnded"
      >
        {{ isPlaying ? '⏸ Pause' : '▶ Play' }}
      </button>
      <button class="btn btn-secondary" @click="$emit('reset')">
        ↺ Reset
      </button>
    </div>

    <!-- Skip to time -->
    <div class="skip-section">
      <label>Skip to time (τ):</label>
      <div class="skip-buttons">
        <button class="btn-skip" @click="skipTo(0)">0</button>
        <button class="btn-skip" @click="skipTo(maxTime * 0.25)">25%</button>
        <button class="btn-skip" @click="skipTo(maxTime * 0.5)">50%</button>
        <button class="btn-skip" @click="skipTo(maxTime * 0.75)">75%</button>
        <button class="btn-skip" @click="skipTo(maxTime * 0.9)">90%</button>
        <button class="btn-skip" @click="skipTo(maxTime * 0.99)">99%</button>
      </div>
    </div>

    <!-- Observer Mode -->
    <div class="mode-section">
      <label>Observer Perspective:</label>
      <div class="mode-toggle">
        <button
          class="btn-mode"
          :class="{ active: observerMode === 'object1' }"
          @click="$emit('update:observerMode', 'object1')"
        >
          Object 1<br><small>(infalling)</small>
        </button>
        <button
          class="btn-mode"
          :class="{ active: observerMode === 'object2' }"
          @click="$emit('update:observerMode', 'object2')"
        >
          Object 2<br><small>(stationary)</small>
        </button>
      </div>
    </div>

    <!-- Configuration -->
    <div class="config-section">
      <h4>Configuration</h4>

      <div class="config-row">
        <label for="mass">Black Hole Mass (M):</label>
        <input
          id="mass"
          type="number"
          :value="mass"
          @input="$emit('update:mass', Number(($event.target as HTMLInputElement).value))"
          min="0.1"
          max="100"
          step="0.1"
        />
      </div>

      <div class="config-row">
        <label for="r0">Initial Distance (r₀):</label>
        <input
          id="r0"
          type="number"
          :value="r0"
          @input="$emit('update:r0', Number(($event.target as HTMLInputElement).value))"
          min="3"
          max="100"
          step="1"
        />
      </div>

      <div class="config-row">
        <label for="r2">Observer Distance (r₂):</label>
        <input
          id="r2"
          type="number"
          :value="r2"
          @input="$emit('update:r2', Number(($event.target as HTMLInputElement).value))"
          min="5"
          max="200"
          step="1"
        />
      </div>

      <div class="config-row">
        <label>Schwarzschild Radius:</label>
        <span class="config-value">rs = {{ (2 * mass).toFixed(2) }}</span>
      </div>

      <div class="config-row">
        <label>Max Proper Time:</label>
        <span class="config-value">{{ maxTime.toFixed(4) }}</span>
      </div>
    </div>

    <p class="note">
      Note: Changing configuration resets the simulation.
    </p>
  </div>
</template>

<style scoped>
.controls {
  background: #111;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 16px;
}

h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #fff;
  border-bottom: 1px solid #333;
  padding-bottom: 8px;
}

h4 {
  margin: 16px 0 10px 0;
  font-size: 14px;
  color: #888;
}

.button-row {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #4a9eff;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #5aafff;
}

.btn-primary:disabled {
  background: #333;
  color: #666;
  cursor: not-allowed;
}

.btn-secondary {
  background: #333;
  color: #fff;
}

.btn-secondary:hover {
  background: #444;
}

.skip-section {
  margin-bottom: 16px;
}

.skip-section label {
  display: block;
  margin-bottom: 8px;
  color: #888;
  font-size: 13px;
}

.skip-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.btn-skip {
  padding: 6px 10px;
  background: #222;
  border: 1px solid #444;
  border-radius: 4px;
  color: #aaa;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-skip:hover {
  background: #333;
  border-color: #666;
  color: #fff;
}

.mode-section {
  margin-bottom: 16px;
}

.mode-section label {
  display: block;
  margin-bottom: 8px;
  color: #888;
  font-size: 13px;
}

.mode-toggle {
  display: flex;
  gap: 8px;
}

.btn-mode {
  flex: 1;
  padding: 10px;
  background: #222;
  border: 2px solid #444;
  border-radius: 6px;
  color: #888;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-mode small {
  font-size: 11px;
  opacity: 0.7;
}

.btn-mode:hover {
  border-color: #666;
}

.btn-mode.active {
  border-color: #4a9eff;
  color: #4a9eff;
  background: #1a2a3a;
}

.config-section {
  background: #0a0a0f;
  padding: 12px;
  border-radius: 6px;
}

.config-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.config-row label {
  color: #888;
  font-size: 13px;
}

.config-row input {
  width: 80px;
  padding: 6px 8px;
  background: #222;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 13px;
  text-align: right;
}

.config-row input:focus {
  outline: none;
  border-color: #4a9eff;
}

.config-value {
  color: #4a9eff;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 13px;
}

.note {
  margin-top: 12px;
  padding: 8px;
  background: #1a1a2e;
  border-radius: 4px;
  color: #666;
  font-size: 11px;
  text-align: center;
}
</style>
