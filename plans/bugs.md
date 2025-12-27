## **Bug 1: `maxProperTime` inconsistent with `properTime`**

```javascript
// maxProperTime uses only:
etaMax = acos(sqrt(rs/r0))
return prefactor * etaMax

// properTime uses:
eta = acos(sqrt(r/r0))
term2 = sqrt((r/r0) * (1 - r/r0))
return prefactor * (eta + term2)
```

At r = rs, these should give the same answer, but:
- `properTime(rs)` = prefactor × (acos(√(rs/r0)) + √((rs/r0)(1-rs/r0)))
- `maxProperTime` = prefactor × acos(√(rs/r0))

**Missing term2 in maxProperTime!**

---

## **Bug 2: `coordinateTime` log formula is broken**

```javascript
const logTerm = Math.log(
  Math.abs((sqrtR0Minus1 + sqrtRMinus1) * (sqrtR0Minus1 - 1)) /
  Math.abs((sqrtR0Minus1 - 1) * (sqrtR0Minus1 + sqrtRMinus1))
);
```

Look at this carefully:
- Numerator: `(a + b) * (a - 1)`
- Denominator: `(a - 1) * (a + b)`

**They're identical!** This always equals log(1) = 0. The divergence at the horizon is completely missing.

The correct formula should have terms that go to infinity as r → rs.

---

## **Bug 3: Prefactor might be wrong**

The standard formula for proper time of radial freefall from rest:

```
τ(r) = √(r0³/rs) × [arccos(√(r/r0)) + √((r/r0)(1-r/r0))]
```

The code has:
```javascript
prefactor = sqrt(r0^3 / (8 * (rs/2))) = sqrt(r0^3 / (4*rs))
```

That's `√(r0³/(4rs))` instead of `√(r0³/rs)`. **Off by factor of 2.**

---

## **Bug 4: `photonRadius` coordinate mixing**

```javascript
if (rStarCurrent < rEmit) {
  return rEmit;
}
```

This compares tortoise coordinate (`rStarCurrent`) with regular radius (`rEmit`). Should be:

```javascript
if (rStarCurrent < rStarEmit) {
  return rEmit;
}
```

Though actually this case shouldn't occur if deltaT > 0.

---

## **Bug 5: Not using n-based math throughout**

The spec said to use n everywhere for precision, but the implementation:
- Does all calculations with r
- Converts to n only at the end

Near the horizon, when r - rs < 10⁻¹⁵ × rs, JavaScript can't distinguish r from rs. The whole point of n was to avoid this.

---

## **Bug 6: `getPhotonArrivalTime` search range**

```javascript
let hi = this.maxTau * 2; // Search beyond proper time
```

But `getPhotonPosition` clamps `tauCurrent` to `maxTau`, so half the search range gives identical results. The logic still probably works but it's wasteful and confusing.

---

## **Verdict**

The architecture is clean, but the core physics is broken. The coordinate time won't diverge (bug 2), and proper time calculations are off by factor of 2 (bug 3) and internally inconsistent (bug 1).
