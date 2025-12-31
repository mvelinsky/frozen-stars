// BlackHoleEngine.ts

import { nToRadius, fallingN, maxProperTime, coordinateTime, stationaryProperTime, photonN, photonNInward } from "./physics";

export interface Config {
  nFaller: number;   // Object 1 (infaller) initial position
  nObserver: number; // Object 2 (stationary observer) position
}

export class BlackHoleEngine {
  constructor(public cfg: Config) {
    if (cfg.nObserver >= cfg.nFaller)
      throw new Error("Observer must be further out (lower n)");
  }

  get tauMax() {
    return maxProperTime(this.cfg.nFaller);
  }

  /**
   * Convert linear tau to logarithmic n_tau
   * tau = tauMax * (1 - 10^(-n_tau))
   */
  tauToNTau(tau: number): number {
    if (tau >= this.tauMax) return Infinity;
    if (tau <= 0) return 0;
    const fraction = 1 - tau / this.tauMax;
    if (fraction <= 0) return Infinity;
    return -Math.log10(fraction);
  }

  /**
   * Convert logarithmic n_tau to linear tau
   */
  nTauToTau(nTau: number): number {
    if (nTau === Infinity) return this.tauMax;
    const cappedN = Math.max(0, nTau);
    const fraction = Math.pow(10, -cappedN);
    return this.tauMax * (1 - fraction);
  }

  /**
   * Get state using linear tau (legacy, for backward compatibility)
   */
  getState(tau: number) {
    const nFaller = fallingN(tau, this.cfg.nFaller, this.tauMax);
    const t = coordinateTime(nFaller, this.cfg.nFaller);
    const tauObserver = stationaryProperTime(t, this.cfg.nObserver);
    const ret = {
      object1: {n: nFaller, r: nToRadius(nFaller), tau},
      object2: {n: this.cfg.nObserver, r: nToRadius(this.cfg.nObserver), tau: tauObserver},
      coordinateTime: t,
      atHorizon: !isFinite(nFaller),
    };

    return ret;
  }

  /**
   * Get state using logarithmic n_tau
   * With logarithmic time: n_faller = n_start + n_tau (linear relationship!)
   */
  getStateByNTau(nTau: number) {
    // With log time, position becomes linear: n = n_start + n_tau
    const nFaller = this.cfg.nFaller + nTau;
    const t = coordinateTime(nFaller, this.cfg.nFaller);
    const tauObserver = stationaryProperTime(t, this.cfg.nObserver);
    const tau = this.nTauToTau(nTau);

    let ret = {
      object1: {n: nFaller, r: nToRadius(nFaller), tau, nTau},
      object2: {n: this.cfg.nObserver, r: nToRadius(this.cfg.nObserver), tau: tauObserver},
      coordinateTime: t,
      atHorizon: !isFinite(nFaller)
    };

    return ret;
  }

  getPhotonN(tauEmit: number, tauCurrent: number): number {
    const emitState = this.getState(tauEmit);
    const currentState = this.getState(tauCurrent);
    return photonN(emitState.object1.n, emitState.coordinateTime, currentState.coordinateTime);
  }

  photonArrived(tauEmit: number, tauCurrent: number): boolean {
    return this.getPhotonN(tauEmit, tauCurrent) <= this.cfg.nObserver;
  }

  /**
   * Convert observer's proper time to coordinate time
   * Inverse of stationaryProperTime: t = τ / √(1 - 1/r)
   */
  private observerTauToCoordinateTime(tauObserver: number): number {
    const rObserver = nToRadius(this.cfg.nObserver);
    return tauObserver / Math.sqrt(1 - 1 / rObserver);
  }

  /**
   * Get the n-coordinate of a photon emitted from observer towards the horizon.
   * Returns the log-distance from horizon (higher n = closer to horizon).
   * @param tauEmit - Observer's proper time when photon was emitted
   * @param tauCurrent - Observer's current proper time
   */
  getObserverPhotonN(tauEmit: number, tauCurrent: number): number {
    const tEmit = this.observerTauToCoordinateTime(tauEmit);
    const tCurrent = this.observerTauToCoordinateTime(tauCurrent);
    return photonNInward(this.cfg.nObserver, tEmit, tCurrent);
  }

  /**
   * Check if photon emitted from observer has reached the horizon
   */
  observerPhotonAtHorizon(tauEmit: number, tauCurrent: number): boolean {
    return !isFinite(this.getObserverPhotonN(tauEmit, tauCurrent));
  }

  /**
   * Get faller's n-coordinate at a given coordinate time.
   * Inverse of coordinateTime: n = log10(t + 10^nStart)
   */
  private fallerNAtCoordinateTime(t: number): number {
    const nStart = this.cfg.nFaller;
    const val = t + Math.pow(10, nStart);
    if (val <= 0) return nStart;
    return Math.log10(val);
  }

  /**
   * Find how long (in observer proper time) until a photon emitted now
   * intersects the falling object.
   * Uses binary search with actual Schwarzschild physics.
   *
   * Key physics:
   * - Both photon and faller slow down near horizon at same rate asymptotically
   * - Photon always has slight edge and catches up in finite coordinate time
   * - Intercept time grows with emission time, but remains finite
   *
   * @param tauEmit - Observer's proper time when photon was emitted
   * @returns Delta in observer proper time until intersection (Infinity if no intersection)
   */
  getPhotonIntersectDelta(tauEmit: number): number {
    const tEmit = this.observerTauToCoordinateTime(tauEmit);
    const rObserver = nToRadius(this.cfg.nObserver);

    // Binary search for intersection time in coordinate time
    let tLow = tEmit;
    let tHigh = tEmit * 2 + 10; // Start with a reasonable upper bound

    // Find upper bound where photon has passed or caught faller
    let attempts = 0;
    while (attempts < 100) {
      const nFallerAtHigh = this.fallerNAtCoordinateTime(tHigh);
      const nPhotonAtHigh = photonNInward(this.cfg.nObserver, tEmit, tHigh);

      if (!isFinite(nPhotonAtHigh) || nPhotonAtHigh >= nFallerAtHigh) {
        break; // Photon reached or passed faller
      }

      tHigh *= 2;
      attempts++;

      if (tHigh > 1e100 || !isFinite(tHigh)) {
        return Infinity; // No convergence
      }
    }

    if (attempts >= 100) {
      return Infinity;
    }

    // Binary search for intersection
    for (let i = 0; i < 60; i++) {
      const tMid = (tLow + tHigh) / 2;
      const nFallerAtMid = this.fallerNAtCoordinateTime(tMid);
      const nPhotonAtMid = photonNInward(this.cfg.nObserver, tEmit, tMid);

      if (!isFinite(nPhotonAtMid) || nPhotonAtMid >= nFallerAtMid) {
        tHigh = tMid;
      } else {
        tLow = tMid;
      }
    }

    const dtCoordinate = tHigh - tEmit;

    // Convert coordinate time delta to observer proper time delta
    return dtCoordinate * Math.sqrt(1 - 1 / rObserver);
  }

  // Legacy method for backwards compatibility
  getPhotonIntersectTau(tauEmit: number): number {
    const delta = this.getPhotonIntersectDelta(tauEmit);
    if (!isFinite(delta)) return Infinity;
    return tauEmit + delta;
  }
}