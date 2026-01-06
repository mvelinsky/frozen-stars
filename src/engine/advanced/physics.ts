export const RS = 1.0;
export const LN10 = Math.LN10;

/**
 * Robust radius conversion.
 * Handles the edge case where r snaps to RS due to float precision.
 */
export function radiusToN(r: number): number {
  if (r <= RS) return Infinity;
  // Calculate relative difference directly
  const diff = (r - RS) / RS;
  if (diff === 0) return 308; // Max float precision boundary (~10^-308)
  return -Math.log10(diff);
}

export function nToRadius(n: number): number {
  if (n > 308) return RS;
  return RS * (1 + Math.pow(10, -n));
}

export function tortoiseN(n: number): number {
  if (n > 100) return RS - n * LN10;
  const r = nToRadius(n);
  return r + Math.log(r - RS);
}

export interface FallerState {
  r: number;
  n: number;
  t: number;
  tau: number;
}

export class GeodesicCalculator {
  private readonly R: number;
  private readonly E: number;

  public readonly tauHorizon: number;
  public readonly tauSingularity: number;

  private readonly etaHorizon: number;
  private readonly nAnchor = 5.0;
  private readonly tAnchor: number;

  constructor(nStart: number) {
    this.R = nToRadius(nStart);
    this.E = Math.sqrt(1 - RS / this.R);

    // 1. Horizon Geometry
    const cosEtaH = (2 * RS) / this.R - 1;
    this.etaHorizon = Math.acos(cosEtaH);
    this.tauSingularity = Math.PI * Math.sqrt(Math.pow(this.R, 3) / 4);
    this.tauHorizon = this.tauFromEta(this.etaHorizon);

    // 2. Precompute anchor for t-extrapolation
    this.tAnchor = this.computeAnalyticT(this.etaFromN(this.nAnchor));
  }

  // --- Main Solvers ---

  /**
   * Calculates state based on the fraction of the fall remaining.
   * fraction = 1.0 (Start) -> 0.0 (Horizon)
   */
  getStateFromHorizonFraction(fractionRemaining: number): FallerState {
    // If we are extremely close (fraction < 10^-9), use linearized physics
    if (fractionRemaining < 1e-9) {
      // Linear approximation near horizon:
      // r - 1 approx E * (tauH - tau)
      const dTau = this.tauHorizon * fractionRemaining;

      const rMinus1 = this.E * dTau;
      const n = -Math.log10(rMinus1);

      // Calculate t using purely logarithmic growth
      const t = this.extrapolateT(n);
      const tau = this.tauHorizon - dTau;

      return { r: 1.0 + rMinus1, n, t, tau };
    }

    // Standard Cycloid Solver
    const tau = this.tauHorizon * (1 - fractionRemaining);
    return this.computeExactStateAtTau(tau);
  }

  getStateFromN(n: number): FallerState {
    if (n < this.nAnchor) {
      const r = nToRadius(n);
      const eta = this.etaFromN(n);
      const t = this.computeAnalyticT(eta);
      const tau = this.tauFromEta(eta);
      return {r, n, t, tau};
    }
    const t = this.extrapolateT(n);
    const dTau = Math.pow(10, -n) / this.E;
    return { r: 1, n, t, tau: this.tauHorizon - dTau };
  }

  // --- Physics Internals ---

  private computeExactStateAtTau(tau: number): FallerState {
    const C = this.tauSingularity / Math.PI;
    let eta = (tau / this.tauSingularity) * Math.PI;

    // Robust Newton Solver for Cycloid
    for(let i=0; i<8; i++) {
      const f = C * (eta + Math.sin(eta)) - tau;
      const df = C * (1 + Math.cos(eta));
      eta -= f / df;
    }

    const r = (this.R/2)*(1+Math.cos(eta));
    const n = radiusToN(r);

    // Switch to Extrapolation if n is high to preserve continuity
    // (Analytic formula is unstable for high n due to tan(eta/2))
    let t: number;
    if (n > this.nAnchor) {
      t = this.extrapolateT(n);
    } else {
      t = this.computeAnalyticT(eta);
    }

    return { r, n, t, tau };
  }

  /**
   * Extrapolates Coordinate Time t for high N.
   * Formula: t ~ n * ln(10)
   * The coefficient is 1.0 (Schwarzschild metric), not 2.0.
   */
  private extrapolateT(n: number): number {
    if (n > 308) n = 308; // Clamp to double precision
    const slope = 1.0 * LN10;
    return this.tAnchor + slope * (n - this.nAnchor);
  }

  /**
   * Analytic solution for Schwarzschild T.
   * t = E * [ ...linear terms... + 1.0 * ln(r-1) ]
   */
  private computeAnalyticT(eta: number): number {
    const sqrtR = Math.sqrt(this.R);
    const term1 = (this.R/2 + 1)*sqrtR*eta + (this.R/2)*sqrtR*Math.sin(eta);

    const tanHalf = Math.tan(eta/2);
    const sqrtRm1 = Math.sqrt(this.R - 1);
    const num = sqrtRm1 + tanHalf;
    const den = sqrtRm1 - tanHalf;

    // Fallback if den approaches 0 (Horizon)
    if (Math.abs(den) < 1e-12) return this.extrapolateT(12);

    // FIX: The coefficient here is 1.0, derived from integral(dr / (1-1/r))
    const termLog = 1.0 * Math.log(Math.abs(num/den));
    return this.E * (term1 + termLog);
  }

  private tauFromEta(eta: number): number {
    return (this.tauSingularity / Math.PI) * (eta + Math.sin(eta));
  }

  private etaFromN(n: number): number {
    return Math.acos((2*nToRadius(n))/this.R - 1);
  }
}
