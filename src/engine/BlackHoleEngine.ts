// BlackHoleEngine.ts

import { nToRadius, fallingN, maxProperTime, coordinateTime, stationaryProperTime, photonN } from "./physics";

export interface Config {
  rs: number;        // Schwarzschild radius
  nFaller: number;   // Object 1 (infaller) initial position
  nObserver: number; // Object 2 (stationary observer) position
}

export class BlackHoleEngine {
  constructor(public cfg: Config) {
    if (cfg.nObserver >= cfg.nFaller)
      throw new Error("Observer must be further out (lower n)");
  }

  get rs() {
    return this.cfg.rs;
  }

  get tauMax() {
    return maxProperTime(this.cfg.nFaller, this.cfg.rs);
  }

  getState(tau: number) {
    const nFaller = fallingN(tau, this.cfg.nFaller, this.tauMax);
    const t = coordinateTime(nFaller, this.cfg.nFaller, this.cfg.rs);
    const tauObserver = stationaryProperTime(t, this.cfg.nObserver, this.cfg.rs);

    return {
      object1: {n: nFaller, r: nToRadius(nFaller, this.cfg.rs), tau},
      object2: {n: this.cfg.nObserver, r: nToRadius(this.cfg.nObserver, this.cfg.rs), tau: tauObserver},
      coordinateTime: t,
      atHorizon: !isFinite(nFaller),
    };
  }

  getPhotonN(tauEmit: number, tauCurrent: number): number {
    const emitState = this.getState(tauEmit);
    const currentState = this.getState(tauCurrent);
    return photonN(emitState.object1.n, emitState.coordinateTime, currentState.coordinateTime, this.cfg.rs);
  }

  photonArrived(tauEmit: number, tauCurrent: number): boolean {
    return this.getPhotonN(tauEmit, tauCurrent) <= this.cfg.nObserver;
  }
}