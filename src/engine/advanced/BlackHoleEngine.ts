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

  // Map user's "100%" progress to the Horizon
  get tauMax() {
    return this.calculator.tauHorizon;
  }

  // ============ HELPERS ============

  tauToNTau(tau: number): number {
    if (tau >= this.tauMax) return Infinity;
    if (tau <= 0) return 0;
    const fraction = 1 - tau / this.tauMax;
    // Logarithmic distance to horizon
    if (fraction <= 1e-308) return 308;
    return -Math.log10(fraction);
  }

  nTauToTau(nTau: number): number {
    if (nTau === Infinity || nTau > 308) return this.tauMax;
    const fraction = Math.pow(10, -Math.max(0, nTau));
    return this.tauMax * (1 - fraction);
  }

  // ============ STATE ============

  getStateByNTau(nTau: number) {
    // 1. Calculate fraction remaining (high precision)
    const fraction = Math.pow(10, -nTau);

    // 2. Solve Physics
    const state = this.calculator.getStateFromHorizonFraction(fraction);

    // 3. Calculate Observer Time
    const tauObserver = !isFinite(state.t) ? Infinity : state.t * this.obsTimeDilation;

    return {
      object1: { n: state.n, r: state.r, tau: state.tau, nTau },
      object2: { n: this.cfg.nObserver, r: nToRadius(this.cfg.nObserver), tau: tauObserver },
      coordinateTime: state.t,
      atHorizon: false // By definition of tauMax=Horizon, we never cross it
    };
  }

  getState(tau: number) {
    return this.getStateByNTau(this.tauToNTau(tau));
  }

  getVisualState(observerTau: number) {
    const tReceive = observerTau / this.obsTimeDilation;
    const targetVal = tReceive - this.obsTortoise;

    // t - r* ~ 2n ln10 (Slope is t(n)-r*(n) ~ n ln10 - (-n ln10) = 2 n ln10)
    let n = Math.max(0, tReceive / (2 * LN10));

    for (let i = 0; i < 10; i++) {
      const state = this.calculator.getStateFromN(n);
      const rStar = tortoiseN(n);

      const val = state.t - rStar;
      const error = val - targetVal;

      if (Math.abs(error) < 1e-5) break;
      n -= error / (2 * LN10);
    }

    if (n < 0) n = 0;
    const finalState = this.calculator.getStateFromN(n);

    return {
      faller: { ...finalState },
      observer: { tau: observerTau },
      coordinateTime: tReceive,
      redshift: Math.pow(10, finalState.n / 2),
      atHorizon: false
    };
  }

  /**
   * Get the n-coordinate of a photon emitted from observer towards the horizon.
   * Returns the log-distance from horizon (higher n = closer to horizon).
   * @param tauEmit - Observer's proper time when photon was emitted
   * @param tauCurrent - Observer's current proper time
   */
  getObserverPhotonN(tauEmit: number, tauCurrent: number): number {
    const tEmit = tauEmit / this.obsTimeDilation;
    const tCurrent = tauCurrent / this.obsTimeDilation;
    const dt = tCurrent - tEmit;

    if (dt <= 0) return this.cfg.nObserver;

    // For inward photon: n increases as it falls toward horizon
    // Approximate: t - r* = constant for null geodesic
    // r* = r + ln(r-1) ≈ -n*ln10 for large n

    // The photon travels from observer (low n) toward horizon (high n)
    // Coordinate time to fall from n to horizon ≈ ln10 * 10^(-n)
    const remainingLogDist = Math.pow(10, -this.cfg.nObserver) - dt / Math.LN10;

    if (remainingLogDist <= 0) {
      return Infinity; // Reached/crossed horizon
    }

    return -Math.log10(remainingLogDist);
  }

  /**
   * Check if photon emitted from observer has reached the horizon
   */
  observerPhotonAtHorizon(tauEmit: number, tauCurrent: number): boolean {
    return !isFinite(this.getObserverPhotonN(tauEmit, tauCurrent));
  }

  /**
   * Find how long (in observer proper time) until a photon emitted now
   * intersects the falling object.
   * Uses binary search with actual Schwarzschild physics.
   * @param tauEmit - Observer's proper time when photon was emitted
   * @returns Delta in observer proper time until intersection (Infinity if no intersection)
   */
  getPhotonIntersectDelta(tauEmit: number): number {
    const tEmit = tauEmit / this.obsTimeDilation;

    // Binary search for intersection time in coordinate time
    let tLow = tEmit;
    let tHigh = tEmit * 2 + 10;

    // Find upper bound where photon has passed or caught faller
    let attempts = 0;
    while (attempts < 100) {
      const state = this.calculator.getStateFromN(
        this.cfg.nObserver + (tHigh - tEmit) / (2 * LN10)
      );
      const nFallerAtHigh = state.n;
      const nPhotonAtHigh = this.cfg.nObserver + (tHigh - tEmit) / LN10;

      if (nPhotonAtHigh >= nFallerAtHigh) {
        break; // Photon caught faller
      }

      tHigh *= 2;
      attempts++;

      if (tHigh > 1e100 || !isFinite(tHigh)) {
        return Infinity;
      }
    }

    if (attempts >= 100) {
      return Infinity;
    }

    // Binary search for intersection
    for (let i = 0; i < 60; i++) {
      const tMid = (tLow + tHigh) / 2;
      const dt = tMid - tEmit;
      const nFallerAtMid = this.calculator.getStateFromN(
        this.cfg.nFaller + dt / (2 * LN10)
      ).n;
      const nPhotonAtMid = this.cfg.nObserver + dt / LN10;

      if (nPhotonAtMid >= nFallerAtMid) {
        tHigh = tMid;
      } else {
        tLow = tMid;
      }
    }

    const dtCoordinate = tHigh - tEmit;

    // Convert coordinate time delta to observer proper time delta
    return dtCoordinate * this.obsTimeDilation;
  }

  // Legacy method for backwards compatibility
  getPhotonIntersectTau(tauEmit: number): number {
    const delta = this.getPhotonIntersectDelta(tauEmit);
    if (!isFinite(delta)) return Infinity;
    return tauEmit + delta;
  }

  getPhotonN(_tauEmit: number, _tauCurrent: number): number {
    // Not implemented in advanced version - use getVisualState instead
    return this.cfg.nFaller;
  }

  photonArrived(_tauEmit: number, _tauCurrent: number): boolean {
    // Not implemented in advanced version
    return false;
  }
}
