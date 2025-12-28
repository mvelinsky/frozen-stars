# Black Hole Engine Documentation

## Overview

The `src/engine/` module implements a simplified physics engine for simulating objects in the vicinity of a Schwarzschild black hole. It tracks proper time for both an infalling object and a stationary observer, modeling gravitational time dilation and the behavior of light signals between them.

## Files

| File | Purpose |
|------|---------|
| `types.ts` | TypeScript interfaces for engine state |
| `units.ts` | Physical constants and unit conversion utilities |
| `physics.ts` | Core physics calculations |
| `BlackHoleEngine.ts` | Main engine class |

## Key Concepts

### The `n` Coordinate

The engine uses a logarithmic spatial coordinate `n` instead of raw radius to maintain numerical precision near the event horizon:

```
n = -log10((r - rs) / rs)
```

- As `r → rs` (the horizon), `n → ∞`
- This allows smooth simulation all the way to the horizon

| n | r/rs | distance from horizon |
|---|------|----------------------|
| -2 | 101 | very far |
| -1 | 11 | far |
| 0 | 2 | 1×rs above horizon |
| 1 | 1.1 | close |
| 2 | 1.01 | very close |
| +∞ | 1 | at horizon |


### Two Time Reference Frames

1. **Proper Time (τ)**: Time experienced by each object individually
   - Object 1 (infalling): `τ` increases from 0 to `τmax` at the horizon
   - Object 2 (stationary): `τ` flows slower due to gravitational time dilation

2. **Coordinate Time (t)**: Schwarzschild `t` coordinate (time at infinity)
   - Diverges to infinity as Object 1 reaches the horizon

## Usage

```typescript
import { BlackHoleEngine } from './src/engine/BlackHoleEngine';

// Initialize with positions (n-coordinate)
const engine = new BlackHoleEngine({
   nFaller: 0,      // Starts at r = 2rs (1×rs above horizon)
   nObserver: -1,   // Observer at r = 11rs (10×rs above horizon)
});

// Get state at proper time τ
const state = engine.getState(5);

// Track a photon from faller to observer
const photonArrived = engine.photonArrived(emitTime, currentTime);
```

## API Reference

### `BlackHoleEngine`

| Method | Returns | Description |
|--------|---------|-------------|
| `getState(τ)` | `EngineState` | State of both objects at proper time τ |
| `tauMax` | `number` | Maximum proper time before horizon crossing |
| `getPhotonN(τEmit, τCurrent)` | `number` | Photon's n-position |
| `photonArrived(τEmit, τCurrent)` | `boolean` | Whether photon reached observer |

### Unit Conversion (`units.ts`)

`createUnits(M_solar)` maps to real-world scale

```typescript
const units = createUnits(10); // 10 solar masses

// Convert geometric units to physical
units.tauToSeconds(1)        // proper time → seconds
units.distanceToKm(2)        // r/rs → kilometers
```

## Physics Notes

The simulation uses simplified equations suitable for visualization:

- **Infall**: `n(τ) = n₀ - log₁₀(1 - τ/τmax)`
- **Coordinate time**: `t(n) = 10ⁿ - 10ⁿ⁰`
- **Stationary proper time**: `τ = t·√(1 - rs/r)`
- rs = 1 implicitly


Photon propagation approximates the increasing light travel time near the horizon.

## Frontend

The frontend is a Vue 3 application (`src/App.vue`) using the Composition API with `<script setup>` syntax. It instantiates `BlackHoleEngine` with reactive refs for configuration (`nFaller`, `nObserver`) and provides a basic layout structure. Currently a shell—visualization and controls are yet to be implemented.

### Styling

Tailwind CSS 4.1 is used for all styling. Prefer standard Tailwind utility classes (e.g., `flex`, `p-4`, `text-lg`). When specific values are needed, use arbitrary values with square brackets like `pt-[28px]` or `w-[373px]` instead of custom CSS.
