export interface TimeScale {
  exponent: number;
  seconds: number;
  label: string;
  reference: string;
}

export const timeScales: TimeScale[] = [
  // Planck scale
  { exponent: -44, seconds: 1e-44, label: "1 Planck time", reference: "smallest meaningful time" },
  { exponent: -43, seconds: 1e-43, label: "10 Planck times", reference: "quantum gravity regime" },
  { exponent: -42, seconds: 1e-42, label: "100 Planck times", reference: "spacetime foam fluctuations" },
  { exponent: -41, seconds: 1e-41, label: "10⁻⁴¹ seconds", reference: "quantum geometry effects" },
  { exponent: -40, seconds: 1e-40, label: "10⁻⁴⁰ seconds", reference: "string vibration timescale" },

  // Post-Planck
  { exponent: -39, seconds: 1e-39, label: "10⁻³⁹ seconds", reference: "grand unification scale" },
  { exponent: -38, seconds: 1e-38, label: "10⁻³⁸ seconds", reference: "electroweak unification" },
  { exponent: -37, seconds: 1e-37, label: "10⁻³⁷ seconds", reference: "inflation epoch begins" },
  { exponent: -36, seconds: 1e-36, label: "10⁻³⁶ seconds", reference: "cosmic inflation" },
  { exponent: -35, seconds: 1e-35, label: "10⁻³⁵ seconds", reference: "inflation ends" },

  // Quark era
  { exponent: -34, seconds: 1e-34, label: "10⁻³⁴ seconds", reference: "quark-gluon plasma forms" },
  { exponent: -33, seconds: 1e-33, label: "10⁻³³ seconds", reference: "quarks and gluons free" },
  { exponent: -32, seconds: 1e-32, label: "10⁻³² seconds", reference: "strong force separates" },
  { exponent: -31, seconds: 1e-31, label: "10⁻³¹ seconds", reference: "universe cools rapidly" },
  { exponent: -30, seconds: 1e-30, label: "10⁻³⁰ seconds", reference: "particle soup expanding" },

   // Particle physics timescales
  { exponent: -29, seconds: 1e-29, label: "10⁻²⁹ seconds", reference: "Higgs field active" },
  { exponent: -28, seconds: 1e-28, label: "10⁻²⁸ seconds", reference: "particles gaining mass" },
  { exponent: -27, seconds: 1e-27, label: "10⁻²⁷ seconds", reference: "top quark lifetime" },
  { exponent: -26, seconds: 1e-26, label: "10⁻²⁶ seconds", reference: "Higgs boson lifetime" },

  // Planck scale and beyond
  { exponent: -25, seconds: 1e-25, label: "10⁻²⁵ seconds", reference: "light crosses a quark" },
  { exponent: -24, seconds: 1e-24, label: "1 yoctosecond", reference: "light crosses a proton" },
  { exponent: -23, seconds: 1e-23, label: "10 yoctoseconds", reference: "light crosses a nucleus" },
  { exponent: -22, seconds: 1e-22, label: "100 yoctoseconds", reference: "strong force interaction" },

  // Zepto
  { exponent: -21, seconds: 1e-21, label: "1 zeptosecond", reference: "photon crosses hydrogen atom" },
  { exponent: -20, seconds: 1e-20, label: "10 zeptoseconds", reference: "W/Z boson lifetime" },
  { exponent: -19, seconds: 1e-19, label: "100 zeptoseconds", reference: "light crosses an atom" },

  // Atto
  { exponent: -18, seconds: 1e-18, label: "1 attosecond", reference: "electron orbits nucleus" },
  { exponent: -17, seconds: 1e-17, label: "10 attoseconds", reference: "fastest measured event" },
  { exponent: -16, seconds: 1e-16, label: "100 attoseconds", reference: "electron transition" },


  // Femto
  { exponent: -15, seconds: 1e-15, label: "1 femtosecond", reference: "light crosses a proton" },
  { exponent: -14, seconds: 1e-14, label: "10 femtoseconds", reference: "fastest chemical reaction" },
  { exponent: -13, seconds: 1e-13, label: "100 femtoseconds", reference: "molecular vibration" },

  // Pico
  { exponent: -12, seconds: 1e-12, label: "1 picosecond", reference: "light travels 0.3mm" },
  { exponent: -11, seconds: 1e-11, label: "10 picoseconds", reference: "fastest transistor switch" },
  { exponent: -10, seconds: 1e-10, label: "100 picoseconds", reference: "light travels 3cm" },

  // Nano
  { exponent: -9, seconds: 1e-9, label: "1 nanosecond", reference: "light travels 30cm" },
  { exponent: -8, seconds: 1e-8, label: "10 nanoseconds", reference: "one CPU cycle" },
  { exponent: -7, seconds: 1e-7, label: "100 nanoseconds", reference: "RAM access time" },

  // Micro
  { exponent: -6, seconds: 1e-6, label: "1 microsecond", reference: "sound travels 0.3mm" },
  { exponent: -5, seconds: 1e-5, label: "10 microseconds", reference: "camera flash starts" },
  { exponent: -4, seconds: 1e-4, label: "100 microseconds", reference: "human nerve impulse" },

  // Milli
  { exponent: -3, seconds: 1e-3, label: "1 millisecond", reference: "housefly wingbeat" },
  { exponent: -2, seconds: 1e-2, label: "10 milliseconds", reference: "blink of an eye" },
  { exponent: -1, seconds: 1e-1, label: "100 milliseconds", reference: "human reaction time" },

  // Seconds
  { exponent: 0, seconds: 1, label: "1 second", reference: "one heartbeat" },
  { exponent: 1, seconds: 10, label: "10 seconds", reference: "deep breath" },
  { exponent: 2, seconds: 100, label: "2 minutes", reference: "brushing teeth" },

  // Minutes
  { exponent: 3, seconds: 1e3, label: "17 minutes", reference: "coffee break" },
  { exponent: 4, seconds: 1e4, label: "3 hours", reference: "long movie" },
  { exponent: 5, seconds: 1e5, label: "28 hours", reference: "one day" },

  // Days
  { exponent: 6, seconds: 1e6, label: "12 days", reference: "two weeks vacation" },
  { exponent: 7, seconds: 1e7, label: "4 months", reference: "one season" },
  { exponent: 8, seconds: 1e8, label: "3 years", reference: "college degree" },

  // Human life
  { exponent: 9, seconds: 1e9, label: "32 years", reference: "one generation" },
  { exponent: 10, seconds: 1e10, label: "320 years", reference: "Greenland shark lifespan" },
  { exponent: 11, seconds: 1e11, label: "3,200 years", reference: "oldest bristlecone pine" },

  // History
  { exponent: 12, seconds: 1e12, label: "32,000 years", reference: "one precession cycle" },
  { exponent: 13, seconds: 1e13, label: "320,000 years", reference: "three glacial cycles" },
  { exponent: 14, seconds: 1e14, label: "3 million years", reference: "day gets 1 minute longer" },

  // Evolution
  { exponent: 15, seconds: 1e15, label: "32 million years", reference: "5km asteroid likely hits Earth" },
  { exponent: 16, seconds: 1e16, label: "320 million years", reference: "new supercontinent forms" },
  { exponent: 17, seconds: 1e17, label: "3 billion years", reference: "oceans boil away" },

  // Cosmological
  { exponent: 18, seconds: 1e18, label: "32 billion years", reference: "2× age of universe" },
  { exponent: 19, seconds: 1e19, label: "320 billion years", reference: "Sun long dead" },
  { exponent: 20, seconds: 1e20, label: "3 trillion years", reference: "galaxies drift apart" },

  // Stellar era ends
  { exponent: 21, seconds: 1e21, label: "32 trillion years", reference: "star formation slows" },
  { exponent: 22, seconds: 1e22, label: "320 trillion years", reference: "last stars dying" },
  { exponent: 23, seconds: 1e23, label: "3 quadrillion years", reference: "last red dwarf dies" },

  // Degenerate era
  { exponent: 24, seconds: 1e24, label: "10²⁴ seconds", reference: "only stellar remnants" },
  { exponent: 25, seconds: 1e25, label: "10²⁵ seconds", reference: "white dwarfs cooling" },
  { exponent: 26, seconds: 1e26, label: "10²⁶ seconds", reference: "planets detach from stars" },
  { exponent: 27, seconds: 1e27, label: "10²⁷ seconds", reference: "galaxies dissolve" },
  { exponent: 28, seconds: 1e28, label: "10²⁸ seconds", reference: "stars ejected from galaxies" },
  { exponent: 29, seconds: 1e29, label: "10²⁹ seconds", reference: "dead stars scatter" },
  { exponent: 30, seconds: 1e30, label: "10³⁰ seconds", reference: "only black holes remain" },

  // Black hole era begins
  { exponent: 31, seconds: 1e31, label: "10³¹ seconds", reference: "black holes dominate" },
  { exponent: 32, seconds: 1e32, label: "10³² seconds", reference: "neutron stars frozen" },
  { exponent: 33, seconds: 1e33, label: "10³³ seconds", reference: "white dwarfs become black" },
  { exponent: 34, seconds: 1e34, label: "10³⁴ seconds", reference: "universe is dark" },
  { exponent: 35, seconds: 1e35, label: "10³⁵ seconds", reference: "atoms may decay" },
  { exponent: 36, seconds: 1e36, label: "10³⁶ seconds", reference: "proton half-life (low est.)" },
  { exponent: 37, seconds: 1e37, label: "10³⁷ seconds", reference: "protons decaying" },
  { exponent: 38, seconds: 1e38, label: "10³⁸ seconds", reference: "matter dissolving" },
  { exponent: 39, seconds: 1e39, label: "10³⁹ seconds", reference: "proton decay completing" },
  { exponent: 40, seconds: 1e40, label: "10⁴⁰ seconds", reference: "all matter gone" },

  // Black hole evaporation
  { exponent: 41, seconds: 1e41, label: "10⁴¹ seconds", reference: "only black holes left" },
  { exponent: 42, seconds: 1e42, label: "10⁴² seconds", reference: "smallest BHs shrinking" },
  { exponent: 43, seconds: 1e43, label: "10⁴³ seconds", reference: "Moon-mass BH evaporates" },
  { exponent: 44, seconds: 1e44, label: "10⁴⁴ seconds", reference: "Earth-mass BH evaporates" },
  { exponent: 45, seconds: 1e45, label: "10⁴⁵ seconds", reference: "Jupiter-mass BH evaporates" },
  { exponent: 46, seconds: 1e46, label: "10⁴⁶ seconds", reference: "BH evaporation continues" },
  { exponent: 47, seconds: 1e47, label: "10⁴⁷ seconds", reference: "sub-solar BHs gone" },
  { exponent: 48, seconds: 1e48, label: "10⁴⁸ seconds", reference: "Sun-mass BH half-evaporated" },
  { exponent: 49, seconds: 1e49, label: "10⁴⁹ seconds", reference: "small stellar BHs gone" },
  { exponent: 50, seconds: 1e50, label: "10⁵⁰ seconds", reference: "typical stellar BHs fading" },

  // Stellar black holes die
  { exponent: 51, seconds: 1e51, label: "10⁵¹ seconds", reference: "large stellar BHs fading" },
  { exponent: 52, seconds: 1e52, label: "10⁵² seconds", reference: "stellar BHs nearly gone" },
  { exponent: 53, seconds: 1e53, label: "10⁵³ seconds", reference: "last stellar BH evaporates" },
  { exponent: 54, seconds: 1e54, label: "10⁵⁴ seconds", reference: "only supermassive BHs left" },
  { exponent: 55, seconds: 1e55, label: "10⁵⁵ seconds", reference: "small galactic BHs fading" },
  { exponent: 56, seconds: 1e56, label: "10⁵⁶ seconds", reference: "galactic BHs shrinking" },
  { exponent: 57, seconds: 1e57, label: "10⁵⁷ seconds", reference: "million-solar-mass BHs die" },
  { exponent: 58, seconds: 1e58, label: "10⁵⁸ seconds", reference: "Sgr A*-size BHs dying" },
  { exponent: 59, seconds: 1e59, label: "10⁵⁹ seconds", reference: "large galactic BHs fading" },
  { exponent: 60, seconds: 1e60, label: "10⁶⁰ seconds", reference: "billion-solar-mass BHs die" },

  // Supermassive black holes die
  { exponent: 61, seconds: 1e61, label: "10⁶¹ seconds", reference: "largest BHs shrinking" },
  { exponent: 62, seconds: 1e62, label: "10⁶² seconds", reference: "TON 618-class BHs fading" },
  { exponent: 63, seconds: 1e63, label: "10⁶³ seconds", reference: "super-giants evaporating" },
  { exponent: 64, seconds: 1e64, label: "10⁶⁴ seconds", reference: "ultra-massive BHs dying" },
  { exponent: 65, seconds: 1e65, label: "10⁶⁵ seconds", reference: "last giants fading" },
  { exponent: 66, seconds: 1e66, label: "10⁶⁶ seconds", reference: "largest BHs nearly gone" },
  { exponent: 67, seconds: 1e67, label: "10⁶⁷ seconds", reference: "last black hole evaporates" },

  // Dark era
  { exponent: 68, seconds: 1e68, label: "10⁶⁸ seconds", reference: "only photons and particles" },
  { exponent: 69, seconds: 1e69, label: "10⁶⁹ seconds", reference: "universe approaches heat death" },
  { exponent: 70, seconds: 1e70, label: "10⁷⁰ seconds", reference: "particles drifting apart" },
  { exponent: 71, seconds: 1e71, label: "10⁷¹ seconds", reference: "emptiness expands" },
  { exponent: 72, seconds: 1e72, label: "10⁷² seconds", reference: "quantum fluctuations only" },
  { exponent: 73, seconds: 1e73, label: "10⁷³ seconds", reference: "time loses meaning" },
  { exponent: 74, seconds: 1e74, label: "10⁷⁴ seconds", reference: "eternal darkness" },
  { exponent: 75, seconds: 1e75, label: "10⁷⁵ seconds", reference: "heat death continues" },
  { exponent: 76, seconds: 1e76, label: "10⁷⁶ seconds", reference: "maximum entropy approached" },
  { exponent: 77, seconds: 1e77, label: "10⁷⁷ seconds", reference: "nothing happens" },
  { exponent: 78, seconds: 1e78, label: "10⁷⁸ seconds", reference: "still nothing" },
  { exponent: 79, seconds: 1e79, label: "10⁷⁹ seconds", reference: "absolute stillness" },
  { exponent: 80, seconds: 1e80, label: "10⁸⁰ seconds", reference: "number of atoms that existed" },

  // Approaching infinity
  { exponent: 81, seconds: 1e81, label: "10⁸¹ seconds", reference: "beyond comprehension" },
  { exponent: 82, seconds: 1e82, label: "10⁸² seconds", reference: "eternity stretches" },
  { exponent: 83, seconds: 1e83, label: "10⁸³ seconds", reference: "waiting for fluctuation" },
  { exponent: 84, seconds: 1e84, label: "10⁸⁴ seconds", reference: "quantum tunneling events" },
  { exponent: 85, seconds: 1e85, label: "10⁸⁵ seconds", reference: "rare vacuum fluctuations" },
  { exponent: 86, seconds: 1e86, label: "10⁸⁶ seconds", reference: "Boltzmann brain timescale" },
  { exponent: 87, seconds: 1e87, label: "10⁸⁷ seconds", reference: "spontaneous atoms possible" },
  { exponent: 88, seconds: 1e88, label: "10⁸⁸ seconds", reference: "random particles appear" },
  { exponent: 89, seconds: 1e89, label: "10⁸⁹ seconds", reference: "quantum resurrection?" },
  { exponent: 90, seconds: 1e90, label: "10⁹⁰ seconds", reference: "entropy fluctuations" },

  // Poincaré recurrence approaches
  { exponent: 91, seconds: 1e91, label: "10⁹¹ seconds", reference: "impossible odds tick by" },
  { exponent: 92, seconds: 1e92, label: "10⁹² seconds", reference: "waiting for recurrence" },
  { exponent: 93, seconds: 1e93, label: "10⁹³ seconds", reference: "entropy occasionally dips" },
  { exponent: 94, seconds: 1e94, label: "10⁹⁴ seconds", reference: "random order from chaos" },
  { exponent: 95, seconds: 1e95, label: "10⁹⁵ seconds", reference: "toward Poincaré time" },
  { exponent: 96, seconds: 1e96, label: "10⁹⁶ seconds", reference: "universe might reset" },
  { exponent: 97, seconds: 1e97, label: "10⁹⁷ seconds", reference: "all configurations possible" },
  { exponent: 98, seconds: 1e98, label: "10⁹⁸ seconds", reference: "approaching googol" },
  { exponent: 99, seconds: 1e99, label: "10⁹⁹ seconds", reference: "one order below googol" },

  // Googol
  { exponent: 100, seconds: 1e100, label: "1 googol seconds", reference: "googol reached" },

  // Beyond googol (to googol years)
  { exponent: 101, seconds: 1e101, label: "10¹⁰¹ seconds", reference: "10 googol seconds" },
  { exponent: 102, seconds: 1e102, label: "10¹⁰² seconds", reference: "100 googol seconds" },
  { exponent: 103, seconds: 1e103, label: "10¹⁰³ seconds", reference: "1000 googol seconds" },
  { exponent: 104, seconds: 1e104, label: "10¹⁰⁴ seconds", reference: "Poincaré recurrence near" },
  { exponent: 105, seconds: 1e105, label: "10¹⁰⁵ seconds", reference: "universe may repeat" },
  { exponent: 106, seconds: 1e106, label: "10¹⁰⁶ seconds", reference: "cycle might begin again" },
  { exponent: 107, seconds: 1e107, label: "1 googol years", reference: "∞ for all purposes" },
];