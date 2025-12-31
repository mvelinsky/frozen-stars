/**
 * Optimized Schwarzschild physics for real-time black hole visualization.
 * Uses n = -log₁₀((r - rₛ)/rₛ) to spatially resolve the exponential
 * metric stretch near the horizon without numerical singularities.
 *
 * Method: Exact GR scaling laws + asymptotic approximations of geodesics.
 * Provides correct qualitative behavior (time dilation, photon delays,
 * horizon crossing) with O(1) per-frame cost, sacrificing full ODE
 * integration accuracy for visualization fidelity and performance.
 */

// ============ COORDINATE CONVERSION ============

export function nToRadius(n: number): number {
  return (1 + Math.pow(10, -n));
}

export function radiusToN(r: number, rs: number): number {
  if (r <= rs) return Infinity;
  return -Math.log10((r - rs) / rs);
}

// ============ OBJECT 1 (INFALLING) ============

// n increases as object falls. Reaches infinity at τ = τmax.
export function fallingN(tau: number, nStart: number, tauMax: number): number {
  if (tau <= 0) return nStart;
  if (tau >= tauMax) return Infinity;
  return nStart - Math.log10(1 - tau / tauMax);
}

// τmax scales with initial distance
export function maxProperTime(nStart: number): number {
  const rStart = nToRadius(nStart);
  return Math.sqrt(rStart * rStart * rStart / 1);
}

// ============ COORDINATE TIME ============

// Diverges as n → ∞
export function coordinateTime(n: number, nStart: number): number {
  if (!isFinite(n)) return Infinity;
  return (Math.pow(10, n) - Math.pow(10, nStart));
}

// ============ OBJECT 2 (STATIONARY) ============

export function stationaryProperTime(t: number, nObserver: number): number {
  if (!isFinite(t)) return Infinity;
  const rObserver = nToRadius(nObserver);
  return t * Math.sqrt(1 - 1 / rObserver);
}

// ============ PHOTONS ============

// Outward photon (from faller towards observer, n decreasing)
export function photonN(nEmit: number, tEmit: number, tCurrent: number): number {
  const dt = tCurrent - tEmit;
  if (dt <= 0) return nEmit;
  const speed = 1 / (Math.LN10 * Math.pow(10, Math.max(nEmit, 0)));
  return nEmit - dt * speed;
}

// Inward photon (from observer towards horizon, n increasing)
// dn/dt = 1 / (ln10 * (1 + 10^(-n)))
// For efficiency, we work in log space: log_dt = log10(dt)
export function photonNInward(nEmit: number, tEmit: number, tCurrent: number): number {
  const dt = tCurrent - tEmit;
  if (dt <= 0) return nEmit;

  // For inward photon, speed approaches 1/ln10 near horizon
  // dn/dt = 1 / (ln10 * (1 + 10^(-n)))
  // Integrate: n increases as photon falls in

  // The photon's n increases. Near horizon (high n), dn/dt ≈ 1/ln10.
  // Far out (low/negative n), dn/dt ≈ 1/(ln10 * 10^(-n)) = 10^n / ln10

  // Simple integration: at observer's position, integrate inward
  // For a photon at position n, coordinate time to reach horizon ~= ln10 * 10^(-n)
  // So after time dt, photon reaches n where: 10^(-n) = 10^(-nEmit) - dt/ln10

  // In log space: the remaining "log-distance" decreases
  const remainingLogDist = Math.pow(10, -nEmit);
  const traveled = dt / Math.LN10;
  const newRemaining = remainingLogDist - traveled;

  if (newRemaining <= 0) {
    return Infinity; // Reached/crossed horizon
  }

  return -Math.log10(newRemaining);
}