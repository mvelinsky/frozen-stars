/**
 * Simplified physics for black hole visualization.
 * ~50 lines. Captures qualitative behavior without exact GR formulas.
 *
 * Key insight: use n (log-distance from horizon) as primary spatial variable.
 * All formulas chosen for correct qualitative behavior, not GR precision.
 */

// ============ COORDINATE CONVERSION ============

export function nToRadius(n: number, rs: number): number {
  return rs * (1 + Math.pow(10, -n));
}

export function radiusToN(r: number, rs: number): number {
  if (r <= rs) return Infinity;
  return -Math.log10((r - rs) / rs);
}

// ============ OBJECT 1 (INFALLING) ============

// n increases as object falls. Reaches infinity at τ = τmax.
// Formula: n = n0 - log10(1 - τ/τmax)
export function fallingN(tau: number, n0: number, tauMax: number): number {
  if (tau <= 0) return n0;
  if (tau >= tauMax) return Infinity;
  return n0 - Math.log10(1 - tau / tauMax);
}

// τmax scales with initial distance (further = longer fall)
export function maxProperTime(n0: number, rs: number): number {
  const r0 = nToRadius(n0, rs);
  return Math.sqrt(r0 * r0 * r0 / rs);  // ~correct scaling
}

// ============ COORDINATE TIME ============

// Diverges as n → ∞. Formula: t = rs × (10^n - 10^n0)
export function coordinateTime(n: number, n0: number, rs: number): number {
  if (!isFinite(n)) return Infinity;
  return rs * (Math.pow(10, n) - Math.pow(10, n0));
}

// ============ OBJECT 2 (STATIONARY) ============

// Proper time runs slower than coordinate time
export function stationaryProperTime(t: number, n2: number, rs: number): number {
  if (!isFinite(t)) return Infinity;
  const r2 = nToRadius(n2, rs);
  return t * Math.sqrt(1 - rs / r2);
}

// ============ PHOTONS ============

// Outgoing photon: n decreases (moves away from horizon)
// Speed in n-space: dn/dt ≈ -1/(rs × ln10 × 10^n)
// Simplified: Δn = -(tCurrent - tEmit) / (rs × ln10 × 10^nEmit)
export function photonN(nEmit: number, tEmit: number, tCurrent: number, rs: number): number {
  const dt = tCurrent - tEmit;
  if (dt <= 0) return nEmit;
  const speed = 1 / (rs * Math.LN10 * Math.pow(10, Math.max(nEmit, 0)));
  return nEmit - dt * speed;
}