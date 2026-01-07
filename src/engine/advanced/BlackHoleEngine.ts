// BlackHoleEngine.ts

import {
  nToRadius,
  tortoiseN,
  GeodesicCalculator,
  LN10,
  RS
} from "./physics";

export interface Config {
  nFaller: number;
  nObserver: number;
}

export class BlackHoleEngine {
  private calculator: GeodesicCalculator;
  private obsTortoise: number;
  private obsTimeDilation: number;

  constructor(public cfg: Config) {
    this.calculator = new GeodesicCalculator(cfg.nFaller);
    this.obsTortoise = tortoiseN(cfg.nObserver);
    this.obsTimeDilation = Math.sqrt(1 - RS / nToRadius(cfg.nObserver));
  }

  get tauMax() { return this.calculator.tauHorizon; }

  // ============ HELPERS ============

  /**
   * WARNING: Precision loss for n > 16.
   */
  tauToNTau(tau: number): number {
    if (tau >= this.tauMax) return Infinity;
    if (tau <= 0) return 0;
    const fraction = 1 - tau / this.tauMax;
    if (fraction <= 1e-308) return 308; // Limit of Tau precision
    return -Math.log10(fraction);
  }

  nTauToTau(nTau: number): number {
    if (nTau === Infinity || nTau > 308) return this.tauMax;
    const fraction = Math.pow(10, -Math.max(0, nTau));
    return this.tauMax * (1 - fraction);
  }

  // ============ STATE ============

  getStateByNTau(nTau: number) {
    // We prefer using getStateFromN directly for super-high n values
    // n is roughly nTau inside the asymptotic zone.

    let state;
    if (nTau > 20) {
      // Direct asymptotic mapping
      // nTau is effectively "n" (minus a small constant shift from the start)
      // But for visualization, assuming n = nTau is fine deep in the well.
      state = this.calculator.getStateFromN(nTau);
    } else {
      const fraction = Math.pow(10, -nTau);
      state = this.calculator.getStateFromHorizonFraction(fraction);
    }

    // Observer time can now be 10^50
    const tauObserver = !isFinite(state.t) ? Infinity : state.t * this.obsTimeDilation;

    return {
      object1: { n: state.n, r: state.r, tau: state.tau, nTau },
      object2: { n: this.cfg.nObserver, r: nToRadius(this.cfg.nObserver), tau: tauObserver },
      coordinateTime: state.t,
      atHorizon: false
    };
  }

  // Legacy support - will cap at n=16
  getState(tau: number) {
    return this.getStateByNTau(this.tauToNTau(tau));
  }

  /**
   * VISUAL SOLVER
   * Now capable of solving for n = 10^30.
   */
  getVisualState(observerTau: number) {
    const tReceive = observerTau / this.obsTimeDilation;
    const targetVal = tReceive - this.obsTortoise;

    // t ~ n ln10. Slope = 2 n ln10
    // Guess n. 
    // If tReceive is 10^30, n will be 10^29. Standard floats handle this fine.
    let n = Math.max(0, tReceive / (2 * LN10));

    // For extremely large N, the guess is practically perfect because
    // the non-linear parts are negligible.
    // We only iterate if n is small.
    if (n < 1000) {
      for (let i = 0; i < 10; i++) {
        const state = this.calculator.getStateFromN(n);
        const rStar = tortoiseN(n);

        const val = state.t - rStar;
        const error = val - targetVal;

        if (Math.abs(error) < 1e-5) break;
        n -= error / (2 * LN10);
      }
    }

    if (n < 0) n = 0;
    const finalState = this.calculator.getStateFromN(n);

    // Safety for redshift display
    const redshift = finalState.n > 600 ? Infinity : Math.pow(10, finalState.n / 2);

    return {
      faller: { ...finalState },
      observer: { tau: observerTau },
      coordinateTime: tReceive,
      redshift: redshift,
      atHorizon: false
    };
  }
}