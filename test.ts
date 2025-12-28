import { BlackHoleEngine } from "./src/engine/BlackHoleEngine";
import { createUnits } from "./src/engine/units";
import { nToRadius } from "./src/engine/physics";

let units = createUnits(10)

let engine = new BlackHoleEngine({
  nFaller: 0,      // starts 1×rs above horizon (r = 2rs)
  nObserver: -1,   // observer 10×rs above horizon (r = 11rs)
});

let rObserver = nToRadius(engine.cfg.nObserver);  // 11
let rFaller = nToRadius(engine.cfg.nFaller);      // 2


console.log(`Black hole mass: ${units.M_solar} M☉`);
console.log(`Schwarzschild radius: ${units.rs_km.toFixed(1)} km`);
console.log(`Observer distance: ${units.distanceToKm(rObserver).toFixed(0)} km`);
console.log(`Faller starts at: ${units.distanceToKm(rFaller).toFixed(0)} km`);
console.log(`Fall time: ${units.tauToSeconds(engine.tauMax).toFixed(6)} s`);

console.log("taumax", engine.tauMax);
console.log(engine.getState(2.8));
