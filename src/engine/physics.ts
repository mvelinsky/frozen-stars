/**
 * Simplified physics for black hole visualization.
 * Uses n (log-distance from horizon) as primary spatial variable.
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
export function fallingN(tau: number, nStart: number, tauMax: number): number {
  if (tau <= 0) return nStart;
  if (tau >= tauMax) return Infinity;
  return nStart - Math.log10(1 - tau / tauMax);
}

// τmax scales with initial distance
export function maxProperTime(nStart: number, rs: number): number {
  const rStart = nToRadius(nStart, rs);
  return Math.sqrt(rStart * rStart * rStart / rs);
}

// ============ COORDINATE TIME ============

// Diverges as n → ∞
export function coordinateTime(n: number, nStart: number, rs: number): number {
  if (!isFinite(n)) return Infinity;
  return rs * (Math.pow(10, n) - Math.pow(10, nStart));
}

// ============ OBJECT 2 (STATIONARY) ============

export function stationaryProperTime(t: number, nObserver: number, rs: number): number {
  if (!isFinite(t)) return Infinity;
  const rObserver = nToRadius(nObserver, rs);
  return t * Math.sqrt(1 - rs / rObserver);
}

// ============ PHOTONS ============

export function photonN(nEmit: number, tEmit: number, tCurrent: number, rs: number): number {
  const dt = tCurrent - tEmit;
  if (dt <= 0) return nEmit;
  const speed = 1 / (rs * Math.LN10 * Math.pow(10, Math.max(nEmit, 0)));
  return nEmit - dt * speed;
}