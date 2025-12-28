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

  getState(tau: number) {
    const nFaller = fallingN(tau, this.cfg.nFaller, this.tauMax);
    const t = coordinateTime(nFaller, this.cfg.nFaller);
    const tauObserver = stationaryProperTime(t, this.cfg.nObserver);

    return {
      object1: {n: nFaller, r: nToRadius(nFaller), tau},
      object2: {n: this.cfg.nObserver, r: nToRadius(this.cfg.nObserver), tau: tauObserver},
      coordinateTime: t,
      atHorizon: !isFinite(nFaller),
    };
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