// ═══════════════════════════════════════
// Physics models for the four sims added from the IGCCST 2026 abstract booklet:
// ADR, magnetocaloric H2 liquefaction, cryosorption H2 storage, cryogenic carbon capture.
// Pure functions (no React) so they can be checked with `node scripts/check-models.mjs`.
// Textbook models for teaching, not design tools.
// ═══════════════════════════════════════

export const R = 8.314; // J/(mol·K)
const MU_B_OVER_K = 0.6717; // Bohr magneton / Boltzmann constant, K per tesla

// ─── 1. ADIABATIC DEMAGNETIZATION REFRIGERATOR ───
// Ideal paramagnet with an internal (interaction) field b: B_eff = sqrt(B² + b²).
// Molar entropy depends only on y = g·μB·B_eff / (kB·T) (Brillouin model), so an
// adiabatic field change keeps B_eff/T constant: T_f = T_i · B_eff,f / B_eff,i.
export const ADR_SALTS = {
  FAA: { name: "FAA (ferric ammonium alum)", J: 2.5, g: 2, b: 0.05, molarMass: 482, perMol: 1, note: "Workhorse salt for 50–100 mK space ADRs" },
  CPA: { name: "CPA (chromic potassium alum)", J: 1.5, g: 2, b: 0.018, molarMass: 499, perMol: 1, note: "Weaker interactions, reaches lower T (<30 mK)" },
  GGG: { name: "GGG (gadolinium gallium garnet)", J: 3.5, g: 2, b: 0.35, molarMass: 337, perMol: 1, note: "Dense, robust upper stage for 0.3–1 K (molar mass per Gd ion)" },
};

const coth = (x) => (Math.abs(x) < 1e-8 ? 1 / x : Math.cosh(x) / Math.sinh(x));

/** Molar magnetic entropy S/R of a spin-J paramagnet at field B (T) and temperature T (K). */
export function adrEntropyOverR(salt, B, T) {
  const Beff = Math.sqrt(B * B + salt.b * salt.b);
  const y = (salt.g * MU_B_OVER_K * Beff) / T;
  const n = 2 * salt.J + 1;
  if (y < 1e-6) return Math.log(n);
  // ln Z, written to avoid overflow: Z = sinh(n y/2) / sinh(y/2)
  const a = (n * y) / 2;
  const c = y / 2;
  const lnSinh = (x) => (x > 20 ? x - Math.log(2) : Math.log(Math.sinh(x)));
  const lnZ = lnSinh(a) - lnSinh(c);
  const dlnZ = (n / 2) * coth(a) - 0.5 * coth(c);
  return lnZ - y * dlnZ;
}

/**
 * One-shot ADR cycle: magnetise at the bath, demagnetise to the target, then regulate
 * the field down to zero to hold the target temperature against the heat load.
 */
export function adrCycle({ salt, Bmax, Tbath, Ttarget, massG, loadUW, leakUW }) {
  const moles = (massG / salt.molarMass) * salt.perMol;
  const BeffMax = Math.sqrt(Bmax * Bmax + salt.b * salt.b);
  const Tmin = Tbath * (salt.b / BeffMax); // demagnetise all the way to B = 0
  const reachable = Ttarget > Tmin * 1.0001;
  const T = Math.max(Ttarget, Tmin * 1.0001);
  const BeffHold = (BeffMax * T) / Tbath;
  const Bhold = Math.sqrt(Math.max(0, BeffHold * BeffHold - salt.b * salt.b));
  const S0bath = adrEntropyOverR(salt, 0, Tbath);
  const SmagBath = adrEntropyOverR(salt, Bmax, Tbath);
  const ShighT = adrEntropyOverR(salt, Bhold, T); // = SmagBath (adiabatic)
  const S0T = adrEntropyOverR(salt, 0, T);
  // Heat dumped to the bath while magnetising (isothermal): Q = T·ΔS
  const qRejectJ = moles * R * Tbath * (S0bath - SmagBath);
  // Cooling capacity while holding T by ramping B from Bhold to 0
  const qHoldJ = moles * R * T * (S0T - ShighT);
  const loadW = (loadUW + leakUW) * 1e-6;
  const holdHours = qHoldJ / loadW / 3600;
  const entropyFractionRemoved = 1 - SmagBath / S0bath;
  return { moles, Tmin, reachable, T, Bhold, S0bath, SmagBath, S0T, qRejectJ, qHoldJ, holdHours, entropyFractionRemoved };
}

// Heat-switch OFF-state leak into the cold stage (illustrative values from the
// IGCCST 2026 abstracts OP04 / PP26 and common ADR practice).
export const HEAT_SWITCHES = {
  sc_al: { name: "Superconducting (Al)", leakUW: 0.2, note: "No moving parts; κon/κoff grows as T falls (PP26)" },
  mr: { name: "Magnetoresistive (W)", leakUW: 0.5, note: "Field-switched; switching ratio ~24,000 at 4.3 K, 3 T (OP04)" },
  gas_gap: { name: "Gas-gap", leakUW: 2.0, note: "Simple and robust; larger OFF leak" },
};

// ─── 2. MAGNETOCALORIC (AMR) HYDROGEN LIQUEFACTION ───
// Ideal minimum work to liquefy normal H2 from 300 K, 1 bar to para-LH2 ≈ 3.9 kWh/kg.
// From LN2-precooled (77 K) feed the remaining ideal work is computed below.
export const H2 = { cp: 10.5, latent: 446, Tnbp: 20.3, orthoParaHeat: 527 }; // kJ/kg·K, kJ/kg, K, kJ/kg (full o→p)

/** Ideal work (kJ/kg) to cool H2 gas from Tin to NBP, condense, and convert to ~para, rejecting at T0. */
export function h2IdealWork({ Tin, T0, paraIn }) {
  const { cp, latent, Tnbp, orthoParaHeat } = H2;
  const sensible = cp * (T0 * Math.log(Tin / Tnbp) - (Tin - Tnbp));
  const condense = latent * (T0 / Tnbp - 1);
  const opHeat = orthoParaHeat * Math.max(0, 0.998 - paraIn);
  const Tmid = Math.sqrt(Tin * Tnbp); // conversion heat removed spread over the cooldown
  const conversion = opHeat * (T0 / Tmid - 1);
  const heatRemoved = cp * (Tin - Tnbp) + latent + opHeat;
  return { work: sensible + condense + conversion, heatRemoved };
}

export const MCE_MATERIALS = {
  laves: { name: "Laves phases (RAl₂, RNi₂)", a: 2.4, note: "Rare-earth intermetallics, Tc tuned by composition" },
  holmium: { name: "Elemental holmium", a: 1.9, note: "Large moment, several transitions between 20 and 132 K" },
  rga2: { name: "RGa₂ (HoGa₂, DyGa₂)", a: 2.1, note: "ΔS up to 26 J/kg·K at 8 T reported (PP01)" },
};

/** Adiabatic temperature change per stage (K) — simple B^(2/3) scaling near Tc. */
export const mceDeltaTad = (mat, B) => mat.a * Math.pow(B, 2 / 3);

export function amrLiquefier({ mat, B, precool, kgPerDay, eta, spanFactor }) {
  const Tin = precool ? 77 : 300;
  const T0 = Tin; // reject heat at the precooling temperature
  const ideal = h2IdealWork({ Tin, T0, paraIn: precool ? 0.5 : 0.25 });
  const dTad = mceDeltaTad(mat, B);
  const span = Tin - H2.Tnbp;
  const stages = Math.max(1, Math.ceil(span / (dTad * spanFactor)));
  const kWhPerKgIdeal = ideal.work / 3600;
  const kWhPerKg = kWhPerKgIdeal / eta;
  const powerKW = (kWhPerKg * kgPerDay) / 24;
  const coolingKW = (ideal.heatRemoved * kgPerDay) / 86400;
  return { Tin, ideal, dTad, span, stages, kWhPerKgIdeal, kWhPerKg, powerKW, coolingKW };
}

// ─── 3. CRYOSORPTION HYDROGEN STORAGE ───
// Langmuir isotherm on activated carbon (AX-21 class), K = K0·exp(E/RT).
// Calibrated so excess uptake ≈ 4 wt% at 77 K / 10 bar and ≈ 0.6 wt% at 298 K / 100 bar.
export const SORBENTS = {
  ax21: { name: "Activated carbon (AX-21 class)", nmaxWt: 6.0, E: 4400, K77: 0.2 },
  mof5: { name: "MOF-5", nmaxWt: 7.5, E: 4000, K77: 0.12 },
  coconut: { name: "Coconut-shell carbon", nmaxWt: 3.2, E: 5200, K77: 0.35 },
};

/** H2 gas density (kg/m³) from a van der Waals estimate — fine for a teaching model. */
export function h2GasDensity(Pbar, T) {
  const a = 0.02476, b = 2.661e-5; // Pa·m⁶/mol², m³/mol
  const P = Pbar * 1e5;
  let v = (R * T) / P; // ideal start, m³/mol
  for (let i = 0; i < 50; i++) v = b + (R * T) / (P + a / (v * v));
  return 0.002016 / v;
}

export function cryosorption({ sorbent, T, Pbar, bulkDensity, voidFraction }) {
  const K = sorbent.K77 * Math.exp((sorbent.E / R) * (1 / T - 1 / 77));
  const theta = (K * Pbar) / (1 + K * Pbar);
  const excessWt = sorbent.nmaxWt * theta; // g H2 per 100 g sorbent
  const rhoGas = h2GasDensity(Pbar, T); // kg/m³ = g/L
  const adsorbedGL = (excessWt / 100) * bulkDensity * 1000; // g per L of tank
  const totalGL = adsorbedGL + rhoGas * voidFraction;
  const emptyTankGL = rhoGas;
  const molesPerL = adsorbedGL / 2.016;
  const chargeHeatKJperL = (molesPerL * sorbent.E) / 1000; // heat released on charging
  return { K, theta, excessWt, rhoGas, adsorbedGL, totalGL, emptyTankGL, chargeHeatKJperL };
}

// ─── 4. CRYOGENIC CARBON CAPTURE (DESUBLIMATION) ───
// CO2 sublimation curve from Clausius–Clapeyron through the triple point (216.6 K, 5.185 bar)
// and the normal sublimation point (194.7 K, 1.013 bar) → B ≈ 3144 K (ΔH_sub ≈ 26 kJ/mol).
const CO2_TT = 216.58, CO2_PT = 5.185;
const CO2_B = Math.log(CO2_PT / 1.01325) / (1 / 194.65 - 1 / CO2_TT);
export const co2SubP = (T) => CO2_PT * Math.exp(-CO2_B * (1 / T - 1 / CO2_TT)); // bar
export const co2FrostT = (pPartialBar) => 1 / (1 / CO2_TT - Math.log(pPartialBar / CO2_PT) / CO2_B);

export function carbonCapture({ yIn, Pbar, Tcold, recovery, eta }) {
  const pIn = yIn * Pbar;
  const Tfrost = pIn >= CO2_PT ? CO2_TT : co2FrostT(pIn);
  const yOut = Math.min(yIn, co2SubP(Tcold) / Pbar);
  const ratioIn = yIn / (1 - yIn), ratioOut = yOut / (1 - yOut);
  const capture = Tcold < Tfrost ? Math.max(0, 1 - ratioOut / ratioIn) : 0;
  // Energy per tonne of CO2 captured (per mole of feed basis)
  const cpGas = 29.5; // J/mol·K, flue gas average
  const sensible = cpGas * (300 - Tcold) * (1 - recovery); // J per mol feed
  const captured = yIn * capture; // mol CO2 captured per mol feed
  const sub = 26100 * captured; // J (latent of desublimation)
  const coolJ = sensible + sub;
  const Tavg = (Tcold + Math.min(Tfrost, 300)) / 2;
  const workJ = (coolJ * (300 / Tavg - 1)) / eta;
  const kgCO2 = captured * 0.044;
  const kWhPerT = kgCO2 > 0 ? (workJ / 3.6e6) / (kgCO2 / 1000) : Infinity;
  return { pIn, Tfrost, yOut, capture, kWhPerT, coolJ, captured };
}
