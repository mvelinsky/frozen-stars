// BlackHoleEngine.ts

import { nToRadius, fallingN, maxProperTime, coordinateTime, stationaryProperTime, photonN } from "./physics";

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
}