export const G = 6.674e-11;        // m³/(kg·s²)
export const c = 299792458;        // m/s
export const M_SUN = 1.989e30;     // kg

export function createUnits(M_solar: number) {
  const M_kg = M_solar * M_SUN;
  const rs_m = 2 * G * M_kg / (c * c);
  const timeScale = rs_m / c;  // converts geometric time → seconds

  return {
    M_solar,
    rs_km: rs_m / 1000,

    // Converters
    tauToSeconds: (tau: number) => tau * timeScale,
    distanceToKm: (r_over_rs: number) => r_over_rs * rs_m / 1000,
  };
}