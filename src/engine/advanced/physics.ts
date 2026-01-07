// physics.ts

export const RS = 1.0;
export const LN10 = Math.LN10;

/**
 * Robust radius conversion.
 * We clamp this at 300 because standard math cannot represent
 * 1 + 10^-301. It just becomes 1.
 */
export function nToRadius(n: number): number {
  if (n > 300) return RS;
  return RS * (1 + Math.pow(10, -n));
}

export function radiusToN(r: number): number {
  if (r <= RS) return Infinity;
  const diff = (r - RS) / RS;
  if (diff === 0) return 308;
  return -Math.log10(diff);
}

/**
 * Tortoise Coordinate
 * For huge N, r is effectively 1.0, so we just use the linear term.
 */
export function tortoiseN(n: number): number {
  // If n is huge, r is 1.0. 
  // r* approx 1 - n * ln10
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

    const cosEtaH = (2 * RS) / this.R - 1;
    this.etaHorizon = Math.acos(cosEtaH);
    this.tauSingularity = Math.PI * Math.sqrt(Math.pow(this.R, 3) / 4);
    this.tauHorizon = this.tauFromEta(this.etaHorizon);

    this.tAnchor = this.computeAnalyticT(this.etaFromN(this.nAnchor));
  }

  // --- Main Solvers ---

  /**
   * Calculates state based on fraction of fall remaining (10^-nTau).
   * Able to handle fractions like 10^-10^50.
   */
  getStateFromHorizonFraction(fractionRemaining: number): FallerState {
    // If fraction is 0 (underflowed), we treat it as "Deep in the Freeze"
    // We can't recover n from 0, so the engine must pass n in separately if it's that large.
    // However, usually we drive this by 'n', see getStateFromN.

    if (fractionRemaining < 1e-9) {
      // Linearized Geodesic near horizon: 
      // r - 1 = E * dTau
      const dTau = this.tauHorizon * fractionRemaining;

      const rMinus1 = this.E * dTau;
      const n = -Math.log10(rMinus1); // This might return Infinity if rMinus1 is 0

      const t = this.extrapolateT(n); // If n is Infinity, t is Infinity
      const tau = this.tauHorizon - dTau;

      return { r: 1.0 + rMinus1, n, t, tau };
    }

    const tau = this.tauHorizon * (1 - fractionRemaining);
    return this.computeExactStateAtTau(tau);
  }

  /**
   * The "God Mode" Solver.
   * Can handle n = 10^50.
   */
  getStateFromN(n: number): FallerState {
    if (n < this.nAnchor) {
      const r = nToRadius(n);
      const eta = this.etaFromN(n);
      const t = this.computeAnalyticT(eta);
      const tau = this.tauFromEta(eta);
      return {r, n, t, tau};
    }

    // UNBOUNDED EXTRAPOLATION
    const t = this.extrapolateT(n);

    // Calculate tau (Distance from horizon)
    // dTau = 10^-n / E
    // If n > 308, 10^-n becomes 0. That's fine, tau becomes exactly tauHorizon.
    const dTau = Math.pow(10, -n) / this.E;

    // Radius will clamp to 1.0, but n and t keep growing
    const r = nToRadius(n);

    return { r, n, t, tau: this.tauHorizon - dTau };
  }

  // --- Physics Internals ---

  private computeExactStateAtTau(tau: number): FallerState {
    const C = this.tauSingularity / Math.PI;
    let eta = (tau / this.tauSingularity) * Math.PI;

    for(let i=0; i<8; i++) {
      const f = C * (eta + Math.sin(eta)) - tau;
      const df = C * (1 + Math.cos(eta));
      eta -= f / df;
    }

    const r = (this.R/2)*(1+Math.cos(eta));
    const n = radiusToN(r);

    let t: number;
    if (n > this.nAnchor) {
      t = this.extrapolateT(n);
    } else {
      t = this.computeAnalyticT(eta);
    }

    return { r, n, t, tau };
  }

  /**
   * Extrapolates Coordinate Time t for ARBITRARY N.
   * We REMOVED the clamp. n can be 10^40.
   */
  private extrapolateT(n: number): number {
    const slope = 1.0 * LN10;
    return this.tAnchor + slope * (n - this.nAnchor);
  }

  private computeAnalyticT(eta: number): number {
    const sqrtR = Math.sqrt(this.R);
    const term1 = (this.R/2 + 1)*sqrtR*eta + (this.R/2)*sqrtR*Math.sin(eta);
    const tanHalf = Math.tan(eta/2);
    const sqrtRm1 = Math.sqrt(this.R - 1);
    const num = sqrtRm1 + tanHalf;
    const den = sqrtRm1 - tanHalf;
    if (Math.abs(den) < 1e-12) return this.extrapolateT(12);
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