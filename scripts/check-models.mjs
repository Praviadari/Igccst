// Sanity checks for src/sims/models/newSimModels.js — run: node scripts/check-models.mjs
import {
  ADR_SALTS, adrEntropyOverR, adrCycle, h2IdealWork, amrLiquefier, MCE_MATERIALS,
  SORBENTS, cryosorption, h2GasDensity, co2SubP, co2FrostT, carbonCapture,
} from "../src/sims/models/newSimModels.js";

let fails = 0;
const ok = (cond, msg, val) => { console.log(`${cond ? "OK  " : "FAIL"} ${msg}${val !== undefined ? ` -> ${val}` : ""}`); if (!cond) fails++; };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

// ADR
const faa = ADR_SALTS.FAA;
ok(near(adrEntropyOverR(faa, 0, 10), Math.log(6), 0.01), "FAA high-T entropy = R ln 6", adrEntropyOverR(faa, 0, 10).toFixed(3));
ok(adrEntropyOverR(faa, 3, 4) < adrEntropyOverR(faa, 0, 4), "magnetising lowers entropy");
const c0 = adrCycle({ salt: faa, Bmax: 3, Tbath: 4, Ttarget: 0.05, massG: 300, loadUW: 1, leakUW: 0.2 });
ok(!c0.reachable && near(c0.Tmin, 4 * 0.05 / Math.sqrt(9 + 0.0025), 1e-6), "FAA from 4 K at 3 T cannot reach 50 mK (Tmin = Tbath·b/Beff)", (c0.Tmin * 1000).toFixed(1) + " mK");
const c = adrCycle({ salt: faa, Bmax: 4, Tbath: 4, Ttarget: 0.1, massG: 300, loadUW: 1, leakUW: 0.2 });
ok(near(adrEntropyOverR(faa, c.Bhold, c.T), c.SmagBath, 1e-6), "adiabatic demag conserves entropy");
ok(c.reachable && c.holdHours > 1 && c.holdHours < 500, "hold time plausible (FAA 300 g, 4 T, 100 mK, 1.2 µW)", c.holdHours.toFixed(1) + " h");
ok(c.qRejectJ > 0 && c.qHoldJ > 0, "heats positive", `${c.qRejectJ.toFixed(1)} J rejected, ${c.qHoldJ.toFixed(3)} J hold`);

// H2 liquefaction
const w300 = h2IdealWork({ Tin: 300, T0: 300, paraIn: 0.25 });
ok(near(w300.work / 3600, 3.9, 0.6), "ideal work 300 K → para-LH2 ≈ 3.9 kWh/kg", (w300.work / 3600).toFixed(2));
const amr = amrLiquefier({ mat: MCE_MATERIALS.laves, B: 5, precool: true, kgPerDay: 100, eta: 0.5, spanFactor: 3 });
ok(amr.stages >= 2 && amr.stages <= 6, "AMR stages 77→20 K at 5 T", amr.stages);

// Cryosorption
ok(near(h2GasDensity(1.013, 20.3 + 280), 0.0819, 0.002), "H2 density ~0.082 g/L at 300 K, 1 atm", h2GasDensity(1.013, 300.3).toFixed(4));
ok(near(h2GasDensity(700, 288), 40, 6), "H2 density ~40 g/L at 700 bar", h2GasDensity(700, 288).toFixed(1));
const s77 = cryosorption({ sorbent: SORBENTS.ax21, T: 77, Pbar: 10, bulkDensity: 0.3, voidFraction: 0.7 });
ok(near(s77.excessWt, 4.0, 0.2), "AX-21 77 K / 10 bar ≈ 4 wt%", s77.excessWt.toFixed(2));
const s298 = cryosorption({ sorbent: SORBENTS.ax21, T: 298, Pbar: 100, bulkDensity: 0.3, voidFraction: 0.7 });
ok(s298.excessWt > 0.3 && s298.excessWt < 1.2, "AX-21 298 K / 100 bar ≈ 0.6 wt%", s298.excessWt.toFixed(2));
ok(s77.totalGL > s77.emptyTankGL, "sorbent beats empty tank at 77 K, 10 bar", `${s77.totalGL.toFixed(1)} vs ${s77.emptyTankGL.toFixed(1)} g/L`);

// CO2
ok(near(co2SubP(194.65), 1.013, 0.005), "CO2 sublimes at 194.65 K, 1 atm", co2SubP(194.65).toFixed(3));
ok(near(co2FrostT(0.15), 172, 3), "frost point 15% CO2 at 1 bar ≈ 172 K", co2FrostT(0.15).toFixed(1));
const cc = carbonCapture({ yIn: 0.15, Pbar: 1, Tcold: 154, recovery: 0.8, eta: 0.5 });
ok(near(cc.capture, 0.9, 0.06), "90% capture near 154 K for flue gas", (cc.capture * 100).toFixed(1) + " %");
ok(cc.kWhPerT > 50 && cc.kWhPerT < 2000, "specific energy plausible", cc.kWhPerT.toFixed(0) + " kWh/t");

console.log(fails ? `\n${fails} FAILED` : "\nALL OK");
process.exit(fails ? 1 : 0);
