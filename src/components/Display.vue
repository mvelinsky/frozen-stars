<script setup lang="ts">
import { computed } from 'vue'
import type { EngineState } from '../engine/types'

interface Props {
  state: EngineState | null
  displayedTime: number
  observerMode: 'object1' | 'object2'
  maxTime: number
}

const props = defineProps<Props>()

// Format time for display
const formatTime = (t: number): string => {
  if (t === Infinity) return '∞'
  if (t > 1e6) return `${(t / 1e6).toFixed(2)}M`
  if (t > 1e3) return `${(t / 1e3).toFixed(2)}K`
  return t.toFixed(4)
}

// Format distance for display
const formatDistance = (r: number, n: number): string => {
  if (n > 15) {
    return `10^(-${n.toFixed(1)}) rs`
  }
  return r.toFixed(6)
}

// Coordinate time display
const coordinateTimeDisplay = computed(() => {
  if (!props.state) return '0'
  return formatTime(props.state.coordinateTime)
})

// Object 1 proper time
const object1TimeDisplay = computed(() => {
  if (!props.state) return '0'
  return formatTime(props.state.object1.tau)
})

// Object 2 proper time
const object2TimeDisplay = computed(() => {
  if (!props.state) return '0'
  return formatTime(props.state.object2.tau)
})

// Object 1 distance display
const object1DistanceDisplay = computed(() => {
  if (!props.state) return '0'
  return formatDistance(props.state.object1.r, props.state.object1.n)
})

// Progress percentage
const progressPercent = computed(() => {
  if (!props.state || props.maxTime === 0) return 0
  return Math.min(100, (props.state.object1.tau / props.maxTime) * 100)
})

// Time dilation factor
const timeDilationFactor = computed(() => {
  if (!props.state) return 1
  const dt1 = props.state.object1.tau || 1
  const dt2 = props.state.object2.tau || 1
  return dt2 / dt1
})
</script>

<template>
  <div class="display">
    <h3>Time & Position</h3>

    <div class="display-row">
      <span class="label">Observer Mode:</span>
      <span class="value" :class="{ 'mode-1': observerMode === 'object1', 'mode-2': observerMode === 'object2' }">
        {{ observerMode === 'object1' ? 'Object 1 (falling)' : 'Object 2 (stationary)' }}
      </span>
    </div>

    <div class="divider"></div>

    <div class="display-row">
      <span class="label">Displayed Time:</span>
      <span class="value primary">{{ formatTime(displayedTime) }}</span>
    </div>

    <div class="display-row">
      <span class="label">Object 1 τ (falling):</span>
      <span class="value">{{ object1TimeDisplay }}</span>
    </div>

    <div class="display-row">
      <span class="label">Object 2 τ (stationary):</span>
      <span class="value">{{ object2TimeDisplay }}</span>
    </div>

    <div class="display-row">
      <span class="label">Coordinate Time t:</span>
      <span class="value" :class="{ infinite: state?.coordinateTime === Infinity }">
        {{ coordinateTimeDisplay }}
      </span>
    </div>

    <div class="divider"></div>

    <div class="display-row">
      <span class="label">Object 1 Distance:</span>
      <span class="value">{{ object1DistanceDisplay }}</span>
    </div>

    <div class="display-row">
      <span class="label">Above Horizon:</span>
      <span class="value">
        n = {{ state?.object1.n.toFixed(2) ?? '0' }}
      </span>
    </div>

    <div class="divider"></div>

    <div class="display-row">
      <span class="label">Progress to Horizon:</span>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progressPercent}%` }"></div>
      </div>
      <span class="value">{{ progressPercent.toFixed(1) }}%</span>
    </div>

    <div class="display-row" v-if="timeDilationFactor > 10">
      <span class="label">Time Dilation:</span>
      <span class="value warning">{{ timeDilationFactor.toFixed(1) }}x slower</span>
    </div>

    <div class="status" :class="{ horizon: state?.hasReachedHorizon }">
      {{ state?.hasReachedHorizon ? '⚠ HORIZON REACHED (Object 1)' : 'Infalling...' }}
    </div>
  </div>
</template>

<style scoped>
.display {
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

.display-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 13px;
}

.label {
  color: #888;
}

.value {
  color: #ccc;
  font-family: 'SF Mono', Monaco, monospace;
}

.value.primary {
  color: #4a9eff;
  font-weight: bold;
  font-size: 15px;
}

.value.mode-1 {
  color: #44ff88;
}

.value.mode-2 {
  color: #4a9eff;
}

.value.infinite {
  color: #ff6b35;
  font-weight: bold;
}

.value.warning {
  color: #ffaa00;
}

.divider {
  height: 1px;
  background: #333;
  margin: 12px 0;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #222;
  border-radius: 3px;
  margin: 0 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #44ff88, #4a9eff);
  border-radius: 3px;
  transition: width 0.1s linear;
}

.status {
  margin-top: 12px;
  padding: 10px;
  text-align: center;
  background: #1a2a1a;
  border: 1px solid #44ff88;
  border-radius: 4px;
  color: #44ff88;
  font-size: 13px;
  font-weight: bold;
}

.status.horizon {
  background: #2a1a1a;
  border-color: #ff6b35;
  color: #ff6b35;
}
</style>
