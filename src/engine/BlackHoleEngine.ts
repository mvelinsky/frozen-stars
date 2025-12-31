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
   * Find the observer's proper time when a photon emitted towards the horizon
   * intersects the falling object.
   * Uses binary search in log-time space.
   * @param tauEmit - Observer's proper time when photon was emitted
   * @returns Observer's proper time at intersection (Infinity if no intersection)
   */
  getPhotonIntersectTau(tauEmit: number): number {
    const tEmit = this.observerTauToCoordinateTime(tauEmit);

    // At emission: check if faller already at horizon
    const fallerNAtEmit = this.fallerNAtCoordinateTime(tEmit);

    // If faller already at or past horizon at emission time, no intersection
    if (!isFinite(fallerNAtEmit)) {
      return Infinity;
    }

    // Photon starts behind faller (lower n = further from horizon)
    // Binary search in log-coordinate-time space for numerical stability
    // Search for log10(dt) where dt = t - tEmit

    // Upper bound: when photon reaches horizon
    // Photon reaches horizon when: 10^(-nObserver) - dt/ln10 = 0
    // dt_max = ln10 * 10^(-nObserver)
    const logDtMax = Math.log10(Math.LN10) - this.cfg.nObserver;

    // Lower bound: very small dt
    let logDtLow = -10; // dt = 10^-10
    let logDtHigh = logDtMax - 1e-10; // Just before horizon

    const EPS = 1e-12;
    const MAX_ITER = 100;

    for (let i = 0; i < MAX_ITER; i++) {
      const logDtMid = (logDtLow + logDtHigh) / 2;
      const dt = Math.pow(10, logDtMid);
      const tCurrent = tEmit + dt;

      const photonN = photonNInward(this.cfg.nObserver, tEmit, tCurrent);
      const fallerN = this.fallerNAtCoordinateTime(tCurrent);

      // Check for convergence
      if (Math.abs(photonN - fallerN) < EPS || logDtHigh - logDtLow < EPS) {
        // Convert coordinate time back to observer proper time
        const rObserver = nToRadius(this.cfg.nObserver);
        return tCurrent * Math.sqrt(1 - 1 / rObserver);
      }

      if (photonN < fallerN) {
        // Photon hasn't caught up yet (lower n = further out)
        logDtLow = logDtMid;
      } else {
        // Photon has passed faller
        logDtHigh = logDtMid;
      }
    }

    // Return best estimate
    const dt = Math.pow(10, (logDtLow + logDtHigh) / 2);
    const tCurrent = tEmit + dt;
    const rObserver = nToRadius(this.cfg.nObserver);
    return tCurrent * Math.sqrt(1 - 1 / rObserver);
  }
}