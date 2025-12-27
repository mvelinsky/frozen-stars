Improved, but still has bugs. Let me go through:

---

## ✅ Fixed

**Bug 1** - `maxProperTime` now consistent with `properTime` (both use η + sin η)

**Bug 4** - `photonRadius` now checks `deltaT <= 0` instead of mixing coordinates

**Bug 6** - `getPhotonArrivalTime` search capped at `maxTau`

---

## ❌ Still Wrong

### **Bug 2 (partial fix): `coordinateTime` missing offset**

```javascript
return -Math.log(Math.max(maxTau - tau, 1e-100)) * rs / E;
```

At τ = 0, this gives `-ln(maxTau) × rs/E`, which is **negative**. Should be 0.

**Fix:**
```javascript
return Math.log(maxTau / Math.max(maxTau - tau, 1e-100)) * rs / E;
```

Now: τ=0 → ln(1) = 0 ✓, τ→maxTau → ln(∞) = ∞ ✓

---

### **Bug 3 (not fixed): Proper time formula is wrong**

The code uses parameterization r = r₀ cos²(η), but the formula doesn't match.

**Code:**
```javascript
prefactor = (r0/2) * sqrt(r0/(2*rs))
return prefactor * (η + sin(η))
```

**Correct (from Hartle's "Gravity"):**
```javascript
prefactor = r0 * sqrt(r0/rs)
return prefactor * (η + sin(η) * cos(η))
```

Two errors:
1. Prefactor off by factor of **2√2 ≈ 2.83**
2. Term should be **sin(η)cos(η)**, not **sin(η)**

**Corrected `properTime`:**
```javascript
export function properTime(r: number, r0: number, rs: number): number {
  if (r >= r0) return 0;
  if (r <= rs) return maxProperTime(r0, rs);

  const eta = Math.acos(Math.sqrt(r / r0));
  const prefactor = r0 * Math.sqrt(r0 / rs);
  return prefactor * (eta + Math.sin(eta) * Math.cos(eta));
}
```

**Corrected `maxProperTime`:**
```javascript
export function maxProperTime(r0: number, rs: number): number {
  const etaMax = Math.acos(Math.sqrt(rs / r0));
  const prefactor = r0 * Math.sqrt(r0 / rs);
  return prefactor * (etaMax + Math.sin(etaMax) * Math.cos(etaMax));
}
```

---