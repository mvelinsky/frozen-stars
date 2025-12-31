# Plan: Photon Emission & Reflection Feature

## Overview
Add ability for user to emit a photon from the observer toward the faller, visualize its journey, show it reflect off the faller, and travel back to the observer. Display real-time ETA countdowns.

## Key Requirements
1. **Emit photon** from observer toward faller (one at a time)
2. **Auto-advance time** - simulation runs automatically while photon is in flight
3. **Visualize photon** traveling inward (observer → faller)
4. **Show reflection** at faller (photon travels outward: faller → observer)
5. **Display ETA** - real-time countdown until photon reaches target
6. **Stay visible** - completed photon remains at observer position to show journey completion

## Technical Approach

### Phase 1: State Management (App.vue)

Add photon state tracking:

```typescript
interface Photon {
  id: string
  emitNTau: number          // When emitted (log time)
  emitObserverTau: number   // Observer proper time at emission
  nEmit: number            // Starting position (observer n)
  direction: 'in' | 'out'  // Inbound to horizon, or outbound to observer
  status: 'traveling' | 'reflected' | 'arrived'
  currentN: number         // Current position
  targetReachedAt?: number // n-tau when reached target
}

const photons = ref<Photon[]>([])
const activePhotonId = ref<string | null>(null)
const isPhotonAnimating = ref(false)
```

**Key insight**: Track photons by their emission time in observer's proper time. The engine already has `getObserverPhotonN(tauEmit, tauCurrent)` to calculate position.

### Phase 2: UI Controls

Add "Emit Photon" button in the photon exchange section (App.vue, around line 118-137):

```vue
<button
  @click="emitPhoton"
  :disabled="!!activePhotonId"
  class="px-3 py-1.5 text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-500/30 disabled:opacity-50"
>
  Emit Photon
</button>
```

- Disabled if a photon is already active (one at a time)
- Button in "Photon Emission" bar alongside the timing display

### Phase 3: Emit Photon Logic

```typescript
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
  lastTime = 0
  photonAnimationId = requestAnimationFrame(animatePhoton)
}
```

### Phase 4: Photon Position Tracking

The engine already has `getObserverPhotonN(tauEmit, tauCurrent)` - use it!

For each frame in simulation update, update photon positions:

```typescript
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
      // Use photonN for outward journey
      const dt = currentObserverTau - photon.emitObserverTau
      photon.currentN = photonN(photon.nEmit, 0, dt)

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
```

### Phase 5: ETA Calculation

Show time until photon reaches target:

```typescript
function getPhotonETA(photon: Photon): number {
  const state = engine.value.getStateByNTau(currentNTau.value)
  const currentObserverTau = state.object2.tau

  if (photon.direction === 'in') {
    // Time to reach faller = use existing getPhotonInterceptDelta
    const delta = engine.value.getPhotonIntersectDelta(currentObserverTau)
    return isFinite(delta) ? delta : Infinity
  } else {
    // Time to return to observer - approximate as remaining distance
    const distanceToObserver = photon.currentN - nObserver.value
    // Convert n-distance to time (rough approximation for display)
    return distanceToObserver * 0.001 // Placeholder - needs proper calculation
  }
}
```

### Phase 6: Auto-Advance Animation

When photon is emitted, start an animation loop:

```typescript
let photonAnimationId: number | null = null
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
```

### Phase 7: Visualization (Visualization.vue)

Add photon rendering to the canvas:

```typescript
// Add to props
const props = defineProps<{
  // ... existing props
  photons?: Array<{
    currentN: number
    direction: 'in' | 'out'
    status: string
  }>
}>()

// In render loop, after drawing faller/observer
props.photons?.forEach(photon => {
  const x = getScreenX(photon.currentN)

  // Color based on direction/status
  const color = photon.direction === 'in'
    ? 'rgba(147, 51, 234, 0.9)'  // Purple for inbound
    : 'rgba(34, 197, 94, 0.9)'   // Green for outbound/reflected

  // Draw photon as glowing dot
  ctx.beginPath()
  ctx.arc(x, horizonY, 6, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()

  // Glow effect
  ctx.shadowColor = color
  ctx.shadowBlur = 15
  ctx.fill()
  ctx.shadowBlur = 0
})
```

### Phase 8: Display ETA in UI

Add ETA display in the photon exchange section:

```vue
<div v-if="activePhoton" class="mt-2 flex items-center gap-3">
  <span class="text-gray-400 text-xs">
    Photon ETA: <span class="font-mono text-blue-400">{{ formatTime(getPhotonETA(activePhoton), 4) }}</span>
  </span>
  <span class="text-gray-500 text-xs">
    ({{ activePhoton.direction === 'in' ? 'inbound to faller' : 'returning to observer' }})
  </span>
</div>
```

## Implementation Order

1. **State management** - Add photon interface and refs to App.vue
2. **Emit button** - Add UI button and emitPhoton() function
3. **Position tracking** - Add updatePhotons() function
4. **Auto-advance animation** - Add animation loop
5. **Visualization** - Add photon rendering to Visualization.vue
6. **ETA display** - Add countdown in photon exchange section
7. **Reflection logic** - Handle direction change when photon reaches faller
8. **Completion** - Mark photon as completed but keep visible at observer

## Critical Files to Modify

1. **src/App.vue** - Main state management, emit logic, UI updates, animation loop
2. **src/components/Visualization.vue** - Photon rendering on canvas
3. **src/engine/BlackHoleEngine.ts** - May need helper method for outward photon from faller

## Notes

- The engine already has most physics needed (`getObserverPhotonN`, `photonN`)
- Reuse existing `formatTime()` for displaying ETA
- Use existing color scheme: purple for inbound, green for outbound
- Animation stops automatically when photon arrives back at observer
- Photon stays visible at observer position to show completed journey
