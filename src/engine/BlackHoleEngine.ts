import { nToRadius, fallingN, maxProperTime, coordinateTime, stationaryProperTime, photonN } from './physics';

export interface Config {
  rs: number;   // Schwarzschild radius
  n0: number;   // Object 1 initial position
  n2: number;   // Object 2 position (n2 < n0, further out)
}

export class BlackHoleEngine {
  constructor(public cfg: Config) {
    if (cfg.n2 >= cfg.n0) throw new Error('Object 2 must be further out (n2 < n0)');
  }

  get rs() { return this.cfg.rs; }
  get tauMax() { return maxProperTime(this.cfg.n0, this.cfg.rs); }

  getState(tau: number) {
    const n1 = fallingN(tau, this.cfg.n0, this.tauMax);
    const t = coordinateTime(n1, this.cfg.n0, this.cfg.rs);
    const tau2 = stationaryProperTime(t, this.cfg.n2, this.cfg.rs);

    return {
      object1: { n: n1, r: nToRadius(n1, this.cfg.rs), tau },
      object2: { n: this.cfg.n2, r: nToRadius(this.cfg.n2, this.cfg.rs), tau: tau2 },
      coordinateTime: t,
      atHorizon: !isFinite(n1),
    };
  }

  getPhotonN(tauEmit: number, tauCurrent: number): number {
    const emitState = this.getState(tauEmit);
    const currentState = this.getState(tauCurrent);
    return photonN(emitState.object1.n, emitState.coordinateTime, currentState.coordinateTime, this.cfg.rs);
  }

  photonArrived(tauEmit: number, tauCurrent: number): boolean {
    return this.getPhotonN(tauEmit, tauCurrent) <= this.cfg.n2;
  }
}