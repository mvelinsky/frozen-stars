/**
 * Configuration for the black hole simulation
 */
export interface Config {
  M: number;   // Black hole mass
  r0: number;  // Object 1 initial radius (starting position)
  r2: number;  // Object 2 radius (stationary observer position)
}

/**
 * State of Object 1 (the infalling object)
 */
export interface Object1State {
  r: number;      // Actual radius (loses precision near horizon)
  n: number;      // Log scale: r = rs + rs * 10^(-n)
  tau: number;    // Proper time elapsed for object 1
}

/**
 * State of Object 2 (the stationary observer)
 */
export interface Object2State {
  r: number;      // Radius (constant)
  tau: number;    // Proper time elapsed for object 2
}

/**
 * Complete engine state at a given proper time
 */
export interface EngineState {
  object1: Object1State;
  object2: Object2State;
  coordinateTime: number;  // Schwarzschild t coordinate
  hasReachedHorizon: boolean;
}

/**
 * State of a photon traveling from Object 1 to Object 2
 */
export interface PhotonState {
  r: number;         // Current radius
  n: number | null;  // Log scale (only if near horizon)
  hasArrived: boolean;
}

/**
 * Result of finding position for a given proper time
 */
export interface PositionResult {
  r: number;
  n: number;
  isValid: boolean;
}
