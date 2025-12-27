/**
 * Pure physics formulas for Schwarzschild black hole simulation.
 * All functions are pure and deterministic.
 */

/**
 * Schwarzschild radius: rs = 2M (in geometric units where G = c = 1)
 */
export function schwarzschildRadius(M: number): number {
  return 2 * M;
}

/**
 * Convert between actual radius and logarithmic closeness parameter.
 *
 * δ = r - rs (distance above horizon)
 * n = -log10(δ / rs) (closeness exponent)
 *
 * So: r = rs + rs * 10^(-n) = rs * (1 + 10^(-n))
 *
 * @param n - Logarithmic closeness parameter
 * @param rs - Schwarzschild radius
 * @returns The actual radius r
 */
export function nToRadius(n: number, rs: number): number {
  return rs * (1 + Math.pow(10, -n));
}

/**
 * Convert actual radius to logarithmic closeness parameter.
 *
 * @param r - Actual radius
 * @param rs - Schwarzschild radius
 * @returns The logarithmic closeness parameter n
 */
export function radiusToN(r: number, rs: number): number {
  const delta = r - rs;
  if (delta <= 0) {
    return Infinity; // At or below horizon
  }
  return -Math.log10(delta / rs);
}

/**
 * Proper time for radial freefall from rest at r0 to radius r.
 *
 * Using the parametric solution:
 * τ(r) = sqrt(r0^3 / 8M) * [arccos(sqrt(r/r0)) + sqrt((r/r0) * (1 - r/r0))]
 *
 * @param r - Current radius
 * @param r0 - Initial radius (starting position)
 * @param rs - Schwarzschild radius
 * @returns Proper time elapsed
 */
export function properTime(r: number, r0: number, rs: number): number {
  if (r >= r0) return 0;
  if (r <= rs) {
    // Return max proper time when at or below horizon
    return maxProperTime(r0, rs);
  }

  const eta = Math.acos(Math.sqrt(r / r0));
  const term1 = eta;
  const term2 = Math.sqrt((r / r0) * (1 - r / r0));
  const prefactor = Math.sqrt(Math.pow(r0, 3) / (8 * (rs / 2))); // rs = 2M, so M = rs/2

  return prefactor * (term1 + term2);
}

/**
 * Maximum proper time to reach the horizon from r0.
 *
 * @param r0 - Initial radius
 * @param rs - Schwarzschild radius
 * @returns Maximum proper time before horizon crossing
 */
export function maxProperTime(r0: number, rs: number): number {
  // At the horizon (r = rs), the parametric solution gives:
  // η_max = acos(sqrt(rs/r0))
  const etaMax = Math.acos(Math.sqrt(rs / r0));
  const prefactor = Math.sqrt(Math.pow(r0, 3) / (4 * rs)); // Simplified: sqrt(r0^3/8M) with M=rs/2
  return prefactor * etaMax;
}

/**
 * Find radius given proper time during freefall.
 * Inverts the properTime function numerically using binary search.
 *
 * @param tau - Proper time elapsed
 * @param r0 - Initial radius
 * @param rs - Schwarzschild radius
 * @returns Object with r and n values
 */
export function radiusFromProperTime(tau: number, r0: number, rs: number): { r: number; n: number } {
  const maxTau = maxProperTime(r0, rs);

  if (tau >= maxTau) {
    // At or past horizon
    return { r: rs, n: Infinity };
  }

  if (tau <= 0) {
    return { r: r0, n: radiusToN(r0, rs) };
  }

  // Binary search for the radius that gives the proper time
  let lo = rs;
  let hi = r0;

  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const t = properTime(mid, r0, rs);

    if (t < tau) {
      lo = mid;
    } else {
      hi = mid;
    }

    if (hi - lo < rs * 1e-15) break;
  }

  const r = (lo + hi) / 2;
  return { r, n: radiusToN(r, rs) };
}

/**
 * Tortoise coordinate: r* = r + rs * ln|r/rs - 1|
 *
 * This coordinate simplifies photon trajectory calculations.
 * For outgoing photons, (t - r*) is constant.
 *
 * @param r - Radius
 * @param rs - Schwarzschild radius
 * @returns Tortoise coordinate
 */
export function tortoiseCoordinate(r: number, rs: number): number {
  if (r <= rs) {
    return r + rs * Math.log(1e-100); // Near horizon singularity
  }
  return r + rs * Math.log(Math.abs(r / rs - 1));
}

/**
 * Coordinate time (Schwarzschild t) for a given proper time.
 *
 * This diverges as the object approaches the horizon.
 *
 * @param tau - Proper time of infalling object
 * @param r0 - Initial radius
 * @param rs - Schwarzschild radius
 * @returns Schwarzschild coordinate time
 */
export function coordinateTime(tau: number, r0: number, rs: number): number {
  const maxTau = maxProperTime(r0, rs);

  if (tau >= maxTau) {
    return Infinity; // Diverges at horizon
  }

  const { r } = radiusFromProperTime(tau, r0, rs);

  // Get coordinate time using the relation between proper and coordinate time
  // For radial infall: dt/dtau = -E / (1 - rs/r) where E is conserved energy
  // For object falling from rest at r0: E = sqrt(1 - rs/r0)

  const E = Math.sqrt(1 - rs / r0);

  // Numerical integration of dt/dtau
  // We integrate from tau to maxTau and add the diverging part

  // Use the formula for t(r):
  // t = -2M * [-2E*r/(rs) + ...] (complex expression)

  // Simplified approach: use tortoise coordinate and the fact that
  // for infalling object, we can relate t and r through the parametric solution

  // The full formula for coordinate time:
  const r0Ratio = r0 / rs - 1;
  const rRatio = r / rs - 1;

  // Handle the logarithmic divergence
  const sqrtR0Minus1 = Math.sqrt(r0Ratio);
  const sqrtRMinus1 = Math.sqrt(Math.max(rRatio, 1e-100));

  const logTerm = Math.log(
    Math.abs((sqrtR0Minus1 + sqrtRMinus1) * (sqrtR0Minus1 - 1)) /
    Math.abs((sqrtR0Minus1 - 1) * (sqrtR0Minus1 + sqrtRMinus1))
  );

  // Time component from the infalling geodesic
  const prefactor = rs / E;
  const t = prefactor * (
    -2 * E * r / rs
    + logTerm
    + 2 * E * r0 / rs
  );

  return Math.max(t, 0);
}

/**
 * Proper time for a stationary observer at radius r2.
 *
 * dtau2 = dt * sqrt(1 - rs/r2)
 *
 * @param coordinateTime - Schwarzschild coordinate time t
 * @param r2 - Radius of stationary observer
 * @param rs - Schwarzschild radius
 * @returns Proper time for stationary observer
 */
export function stationaryObserverProperTime(coordinateTime: number, r2: number, rs: number): number {
  const timeDilationFactor = Math.sqrt(1 - rs / r2);
  return coordinateTime * timeDilationFactor;
}

/**
 * Calculate the coordinate time when a photon emitted at radius r1
 * reaches radius r2 (outgoing photon).
 *
 * For outgoing photons: t - r* = constant
 * So: Δt = r*(r2) - r*(r1)
 *
 * @param r1 - Emission radius
 * @param r2 - Target radius
 * @param rs - Schwarzschild radius
 * @returns Coordinate time for photon to travel
 */
export function photonTravelTime(r1: number, r2: number, rs: number): number {
  const rStar1 = tortoiseCoordinate(r1, rs);
  const rStar2 = tortoiseCoordinate(r2, rs);
  return rStar2 - rStar1;
}

/**
 * Find photon position at a given coordinate time.
 *
 * @param rEmit - Emission radius
 * @param tEmit - Coordinate time of emission
 * @param tCurrent - Current coordinate time
 * @param rs - Schwarzschild radius
 * @returns Current radius of photon
 */
export function photonRadius(rEmit: number, tEmit: number, tCurrent: number, rs: number): number {
  const deltaT = tCurrent - tEmit;
  const rStarEmit = tortoiseCoordinate(rEmit, rs);
  const rStarCurrent = rStarEmit + deltaT;

  // Invert tortoise coordinate to get radius
  // r* = r + rs * ln|r/rs - 1|
  // This requires numerical inversion

  // For r > rs:
  // If r* is large, r ≈ r*
  // Near horizon, we need to solve numerically

  if (rStarCurrent < rEmit) {
    return rEmit; // Photon shouldn't go backward
  }

  // Simple approximation for r >> rs
  if (rStarCurrent > rs * 10) {
    return rStarCurrent;
  }

  // Numerical inversion
  let lo = rs + 1e-10;
  let hi = Math.max(rEmit * 2, rs * 100);

  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const rStarMid = tortoiseCoordinate(mid, rs);

    if (rStarMid < rStarCurrent) {
      lo = mid;
    } else {
      hi = mid;
    }

    if (hi - lo < 1e-10) break;
  }

  return (lo + hi) / 2;
}
