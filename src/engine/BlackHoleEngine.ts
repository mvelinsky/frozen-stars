/**
 * BlackHoleEngine - Pure physics engine for black hole simulation.
 *
 * This class contains no UI code, no state mutation, and all methods
 * are pure functions (same input = same output).
 *
 * The proper time (τ) of Object 1 is the "source of truth" - all other
 * values are derived from it.
 */

import type {
  Config,
  EngineState,
  Object1State,
  Object2State,
  PhotonState,
} from './types';
import {
  schwarzschildRadius,
  nToRadius,
  radiusToN,
  maxProperTime,
  radiusFromProperTime,
  coordinateTime as physicsCoordinateTime,
  stationaryObserverProperTime,
  photonRadius,
} from './physics';

/**
 * Public interface for BlackHoleEngine
 */
export interface IBlackHoleEngine {
  getRs(): number;
  getMaxProperTime(): number;
  getR0(): number;
  getR2(): number;
  getState(tau: number): EngineState;
  getPhotonPosition(tauEmit: number, tauCurrent: number): PhotonState;
  getPhotonArrivalTime(tauEmit: number): number | null;
  nToRadius(n: number): number;
  radiusToN(r: number): number;
}

export class BlackHoleEngine implements IBlackHoleEngine {
  private readonly rs: number;  // Schwarzschild radius
  private readonly r0: number;  // Initial radius of object 1
  private readonly r2: number;  // Radius of object 2 (stationary)
  private readonly maxTau: number;  // Maximum proper time before horizon

  constructor(config: Config) {
    this.rs = schwarzschildRadius(config.M);
    this.r0 = config.r0;
    this.r2 = config.r2;
    this.maxTau = maxProperTime(config.r0, this.rs);

    // Validate inputs
    if (this.r0 <= this.rs) {
      throw new Error(`Initial radius r0 (${this.r0}) must be greater than Schwarzschild radius rs (${this.rs})`);
    }
    if (this.r2 <= this.r0) {
      throw new Error(`Observer radius r2 (${this.r2}) must be greater than initial radius r0 (${this.r0})`);
    }
  }

  /**
   * Get the Schwarzschild radius
   */
  getRs(): number {
    return this.rs;
  }

  /**
   * Get the maximum proper time before horizon crossing
   */
  getMaxProperTime(): number {
    return this.maxTau;
  }

  /**
   * Get the initial radius r0
   */
  getR0(): number {
    return this.r0;
  }

  /**
   * Get the observer radius r2
   */
  getR2(): number {
    return this.r2;
  }

  /**
   * Core query - get complete state for a given proper time of Object 1.
   *
   * All values are derived from the input τ.
   *
   * @param tau - Proper time of Object 1 (the infalling object)
   * @returns Complete engine state
   */
  getState(tau: number): EngineState {
    // Clamp tau to valid range
    const clampedTau = Math.max(0, Math.min(tau, this.maxTau));

    // Get Object 1 position from proper time
    const posResult = radiusFromProperTime(clampedTau, this.r0, this.rs);
    const object1: Object1State = {
      r: posResult.r,
      n: posResult.n,
      tau: clampedTau,
    };

    // Get coordinate time (Schwarzschild t)
    const coordTime = physicsCoordinateTime(clampedTau, this.r0, this.rs);

    // Get Object 2 proper time (stationary observer)
    const object2: Object2State = {
      r: this.r2,
      tau: stationaryObserverProperTime(coordTime, this.r2, this.rs),
    };

    return {
      object1,
      object2,
      coordinateTime: coordTime,
      hasReachedHorizon: clampedTau >= this.maxTau,
    };
  }

  /**
   * Get the position of a photon that was emitted at a certain proper time.
   *
   * The photon position is fully deterministic based on:
   * 1. When it was emitted (τ_emit)
   * 2. The current time (τ_current)
   *
   * @param tauEmit - Proper time when photon was emitted
   * @param tauCurrent - Current proper time of Object 1
   * @returns Current photon state
   */
  getPhotonPosition(tauEmit: number, tauCurrent: number): PhotonState {
    // Clamp values
    const emitTau = Math.max(0, Math.min(tauEmit, this.maxTau));
    const currentTau = Math.max(0, Math.min(tauCurrent, this.maxTau));

    // Can't see photons emitted in the future
    if (emitTau >= currentTau) {
      return {
        r: this.r0,
        n: radiusToN(this.r0, this.rs),
        hasArrived: false,
      };
    }

    // Get emission position and time
    const emitState = this.getState(emitTau);
    const rEmit = emitState.object1.r;
    const tEmit = emitState.coordinateTime;

    // Get current coordinate time
    const currentState = this.getState(currentTau);
    const tCurrent = currentState.coordinateTime;

    // Calculate photon position
    // For outgoing photons: t - r* = constant
    const photonR = photonRadius(rEmit, tEmit, tCurrent, this.rs);

    // Check if photon has reached or passed Object 2
    const hasArrived = photonR >= this.r2;

    return {
      r: hasArrived ? this.r2 : Math.max(photonR, this.rs),
      n: hasArrived ? radiusToN(this.r2, this.rs) : radiusToN(Math.max(photonR, this.rs), this.rs),
      hasArrived,
    };
  }

  /**
   * Find the proper time at which a photon emitted at tauEmit reaches Object 2.
   *
   * This uses binary search since we need to find when photonR >= r2.
   *
   * @param tauEmit - Proper time when photon was emitted
   * @returns Proper time when photon reaches Object 2, or null if it never arrives
   */
  getPhotonArrivalTime(tauEmit: number): number | null {
    const emitTau = Math.max(0, Math.min(tauEmit, this.maxTau));

    // Binary search for the arrival time
    let lo = emitTau;
    let hi = this.maxTau * 2; // Search beyond proper time (in coordinate time, photon may arrive later)

    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      const photon = this.getPhotonPosition(emitTau, mid);

      if (photon.hasArrived) {
        hi = mid;
      } else {
        lo = mid;
      }

      if (hi - lo < 1e-10) break;
    }

    const arrivalTau = (lo + hi) / 2;
    const photon = this.getPhotonPosition(emitTau, arrivalTau);

    return photon.hasArrived ? arrivalTau : null;
  }

  /**
   * Get the radius corresponding to a given logarithmic closeness parameter.
   *
   * @param n - Logarithmic closeness parameter
   * @returns Radius r
   */
  nToRadius(n: number): number {
    return nToRadius(n, this.rs);
  }

  /**
   * Get the logarithmic closeness parameter for a given radius.
   *
   * @param r - Radius
   * @returns Logarithmic closeness parameter n
   */
  radiusToN(r: number): number {
    return radiusToN(r, this.rs);
  }
}
