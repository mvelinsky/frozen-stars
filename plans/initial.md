# Black Hole Frozen Star Visualization

## Overview

Build a physics simulation demonstrating why objects never cross a black hole's event horizon from an external observer's perspective. The visualization shows an infalling object (Object 1), a stationary observer (Object 2), and photons traveling between them.

## Architecture

**Two completely separate modules:**

1. `BlackHoleEngine` - Pure math, no UI, no state mutation, fully deterministic
2. Vue app - Handles state, animation loop, rendering, user input

## The Engine

### Physics Assumptions

- Schwarzschild black hole (non-rotating, uncharged)
- Geometric units: G = c = 1
- Schwarzschild radius: rs = 2M
- Object 1: radially freefalling from rest at r0
- Object 2: stationary at r2 (r2 > r0 > rs)
- Object 1 proper time (τ) is the "source of truth" - all other values derived from it

### Numerical Precision

JavaScript floats cannot handle the precision needed near the horizon (we need to track distances like 10^-100 × rs).

**Solution: Logarithmic parameterization**

```
δ = r - rs           (actual distance above horizon)
n = -log₁₀(δ / rs)   (closeness exponent)

So:
n = 1  → r = rs × 1.1
n = 10 → r = rs × 1.0000000001  
n = 100 → r = rs × (1 + 10⁻¹⁰⁰)
```

Store and compute with `n`, derive `r` only for display when precision allows.

### API

```typescript
interface Config {
  M: number;   // black hole mass
  r0: number;  // object 1 initial radius
  r2: number;  // object 2 radius (stationary)
}

interface Object1State {
  r: number;      // actual radius (loses precision near horizon)
  n: number;      // log scale: r = rs + rs × 10^(-n)
  τ: number;      // proper time elapsed
}

interface EngineState {
  object1: Object1State;
  object2τ: number;        // object 2 proper time  
  coordinateTime: number;  // Schwarzschild t
  hasReachedHorizon: boolean;
}

interface PhotonState {
  r: number;         // current radius
  n: number | null;  // log scale (only if near horizon)
  hasArrived: boolean;
}

class BlackHoleEngine {
  constructor(config: Config);
  
  // Core query - everything derived from τ
  getState(τ: number): EngineState;
  
  // Photon position - fully deterministic
  // Given when photon was emitted and current time, where is it?
  getPhotonPosition(τ_emit: number, τ_current: number): PhotonState;
  
  // Get max τ before horizon crossing
  getMaxProperTime(): number;
  
  // Utility
  getRs(): number;
}
```

### Key Physics Formulas

**Proper time for radial freefall from rest at r0 to radius r:**
```
τ(r) = √(r0³ / 2rs) × [arccos(√(r/r0)) + √((r/r0)(1 - r/r0))]
```

**Coordinate time (Schwarzschild t) - diverges at horizon:**
```
t(r) involves: τ(r) + rs × ln|(√(r0/rs - 1) + 1)(√(r/rs - 1) - 1) / ((√(r0/rs - 1) - 1)(√(r/rs - 1) + 1))| + ...
```

**Object 2 proper time (stationary observer):**
```
τ2 = t × √(1 - rs/r2)
```

**Outgoing photon trajectory:**
```
dr/dt = c(1 - rs/r)

Tortoise coordinate: r* = r + rs × ln|r/rs - 1|
Photon at constant (t - r*) for outgoing
```

**Photon travel time from r1 to r2:**
```
Δt = r*(r2) - r*(r1)
```

### Engine Implementation Notes

1. All methods are **pure functions** - same input = same output
2. No internal state mutation - τ is always passed in
3. Use n-based math throughout - it handles all distances uniformly
4. `getPhotonPosition` needs to:
    - Find r1 at τ_emit (where object 1 was)
    - Find coordinate time t_emit
    - Find coordinate time t_current
    - Calculate photon position given elapsed coordinate time
    - Return position or hasArrived: true if r >= r2

## Vue UI

### Layout

Simple 2D side view:
```
[Controls]

     Object 2 (stationary)
         ●
         |
         |  ← photons traveling up
         |
         ○ Object 1 (falling)
         |
         |
    ═════════════  Event Horizon (rs)
         |
        ●●● Black Hole
```

### Controls

- Mass (M): number input
- Initial distance (r0): number input
- Observer distance (r2): number input
- Time (τ): number input for skip
- Play/Pause button
- Observer toggle: "Object 1" / "Object 2"

### Display

- Object 1 proper time: τ
- Object 2 proper time: τ2
- Coordinate time: t
- Object 1 distance: show as "rs + 10^(-n) rs" when n > 15

### Behavior

- **Skip to time:** Clear all photons, set τ to new value, recalculate state
- **Play:** Increment τ each frame, emit photon every X proper time units
- **Photons:** Small dots traveling from Object 1 toward Object 2
- **Simulation end:** When Object 1 reaches horizon (observer = Object 1 mode)

### Observer Modes

**Object 1 perspective:**
- Time advances at τ rate
- Simulation ends when horizon reached

**Object 2 perspective:**
- Time advances at τ2 rate (much slower near horizon)
- Object 1 visually freezes
- Photons arrive with increasing delays
- Simulation never truly "ends"

## File Structure

```
src/
  engine/
    BlackHoleEngine.ts    # Pure physics, no dependencies
    physics.ts            # Formula implementations
    types.ts              # TypeScript interfaces
  components/
    Simulation.vue        # Main visualization
    Controls.vue          # Input controls
    Display.vue           # Time displays
  App.vue
```

## Implementation Order

1. Engine types and interfaces
2. Physics formulas (test with known values)
3. BlackHoleEngine class
4. Basic Vue layout without animation
5. Static rendering (given τ, render state)
6. Animation loop
7. Photon emission and rendering
8. Observer mode switching
9. Polish

## Test Cases

```javascript
const engine = new BlackHoleEngine({ M: 1, r0: 10, r2: 15 });

// At τ = 0, object 1 should be at r0
engine.getState(0).object1.r === 10

// Max proper time should be finite
engine.getMaxProperTime() // some finite number

// At max τ, should be at horizon
engine.getState(engine.getMaxProperTime()).hasReachedHorizon === true

// Photon emitted at τ=0 should eventually arrive at r2
// (find τ where hasArrived becomes true)
```
