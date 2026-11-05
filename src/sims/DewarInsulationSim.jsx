import { useState, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme, prng } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function DewarInsulationSim() {
  const [fluid, setFluid] = useState("ln2"); // ln2, lhe, lh2
  const [volumeL, setVolumeL] = useState(50); // liters
  const [vacLog, setVacLog] = useState(-4); // 10^-4 mbar
  const [mliLayers, setMliLayers] = useState(30); // 0 to 60 layers
  const [neckMat, setNeckMat] = useState("g10"); // g10, ss304, ti

  // Fluid thermophysical properties
  const fluidData = {
    ln2: { name: "LN2", tBoil: 77.36, hfg: 199.1, rho: 0.808, color: T.accent },
    lhe: { name: "LHe", tBoil: 4.22, hfg: 20.9, rho: 0.125, color: T.gold },
    lh2: { name: "LH2", tBoil: 20.28, hfg: 445.6, rho: 0.071, color: T.pink },
  }[fluid];

  const tAmb = 295; // K
  const deltaT = tAmb - fluidData.tBoil;
  const vacPress = Math.pow(10, vacLog); // mbar

  // Neck tube thermal conductivity average [W/m·K]
  const kNeck = neckMat === "g10" ? 0.35 : neckMat === "ss304" ? 11.0 : 5.5;
  // Neck conduction: Q_neck = k * A/L * ΔT (assume L=0.15m, wall t=0.5mm, D=30mm)
  const aNeck = Math.PI * 0.03 * 0.0005;
  const qNeckWatts = (kNeck * aNeck * deltaT) / 0.15;

  // Radiation heat transfer with MLI: Q_rad = sigma * A * (T_h^4 - T_c^4) / ((N+1) * (2/eps - 1))
  const dewarRadius = Math.cbrt((volumeL * 1e-3 * 3) / (4 * Math.PI));
  const dewarArea = 4 * Math.PI * dewarRadius * dewarRadius;
  const sigma = 5.67e-8;
  const effEps = 0.04 / (mliLayers + 1);
  const qRadWatts = dewarArea * sigma * (Math.pow(tAmb, 4) - Math.pow(fluidData.tBoil, 4)) * effEps;

  // Residual gas conduction in molecular regime: Q_gas ∝ P_vac * A * ΔT
  // At P < 10^-3 mbar, molecular conduction dominates: q = const * P * ΔT
  const qGasWatts = dewarArea * (vacPress * 100) * 0.8 * (deltaT / Math.sqrt(tAmb));

  // Total heat leak (Watts)
  const qTotalWatts = qNeckWatts + qRadWatts + qGasWatts;

  // Liquid mass in kg
  const liqMassKg = volumeL * fluidData.rho;
  // Boil-off rate in liters per day
  const evapKgSec = qTotalWatts / (fluidData.hfg * 1000);
  const evapLDay = (evapKgSec * 86400) / fluidData.rho;
  const borPctDay = (evapLDay / volumeL) * 100;
  const holdTimeDays = Math.max(0.2, (volumeL * 0.95) / Math.max(0.01, evapLDay)).toFixed(1);

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const canvasTheme = getCanvasTheme();
      const cx = W / 2;
      const cy = H / 2 + 10;

      // Dark background
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W / 2);
      bg.addColorStop(0, canvasTheme.bgStart);
      bg.addColorStop(1, canvasTheme.bgEnd);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const dr = 50;

      // 1. Outer Vessel
      ctx.strokeStyle = T.gray;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, dr + 16, 0, Math.PI * 2);
      ctx.stroke();

      // Outer vessel neck
      ctx.strokeRect(cx - 16, cy - dr - 35, 32, 22);

      // 2. MLI Blankets in Vacuum Space
      const numLines = Math.min(8, Math.max(1, Math.floor(mliLayers / 7)));
      ctx.lineWidth = 0.8;
      for (let i = 1; i <= numLines; i++) {
        const rad = dr + 2 + (12 / (numLines + 1)) * i;
        ctx.strokeStyle = i % 2 === 0 ? T.gold : "rgba(248, 150, 30, 0.4)";
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 3. Inner Cryogenic Vessel
      ctx.strokeStyle = fluidData.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, dr, 0, Math.PI * 2);
      ctx.stroke();

      // Inner liquid
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, dr - 2, 0, Math.PI * 2);
      ctx.clip();

      const fillH = dr * 1.5;
      ctx.fillStyle = `${fluidData.color}45`;
      ctx.fillRect(cx - dr, cy + dr - fillH, dr * 2, fillH);

      // Rising bubbles
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      for (let i = 0; i < 5; i++) {
        const bx = cx - 25 + prng(frame, i * 2) * 50;
        const by = cy + dr - 10 - ((frame * 1.5 + i * 12) % fillH);
        ctx.beginPath();
        ctx.arc(bx, by, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 4. Thin-Walled Neck Tube
      ctx.strokeStyle = neckMat === "g10" ? T.green : neckMat === "ss304" ? T.gray : T.cyan;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - dr);
      ctx.lineTo(cx - 10, cy - dr - 32);
      ctx.moveTo(cx + 10, cy - dr);
      ctx.lineTo(cx + 10, cy - dr - 32);
      ctx.stroke();

      // Conduction arrows in neck
      ctx.strokeStyle = T.red;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 14, cy - dr - 28);
      ctx.lineTo(cx - 14, cy - dr - 5);
      ctx.stroke();

      // Vapor venting plume from top
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      for (let i = 0; i < 3; i++) {
        const vy = cy - dr - 36 - ((frame * 1.2 + i * 8) % 18);
        ctx.beginPath();
        ctx.arc(cx, vy, 2.5 + i, 0, Math.PI * 2);
        ctx.fill();
      }

      // HUD & Diagnostics
      ctx.font = `800 8px ${TECH_FONT}`;
      ctx.textAlign = "left";
      ctx.fillStyle = fluidData.color;
      ctx.fillText(`${fluidData.name} DEWAR (${volumeL}L)`, 10, 16);

      ctx.font = `700 8px ${MONO_FONT}`;
      ctx.fillStyle = vacLog < -3 ? T.green : T.red;
      ctx.fillText(`VAC: 10^${vacLog} mbar`, 10, 28);

      ctx.textAlign = "right";
      ctx.fillStyle = T.gold;
      ctx.fillText(`MLI: ${mliLayers} L`, W - 10, 16);
      ctx.fillText(`NECK: ${neckMat.toUpperCase()}`, W - 10, 28);
    },
    [fluid, volumeL, vacLog, mliLayers, neckMat, fluidData],
    { animate: true }
  );

  const buildPrompt = useCallback(
    () => `Cryogenic Dewar & Vacuum Insulation Thermal Performance — IGCCST 2026:
ROLE: Specialist in cryogenic storage vessel engineering and thermal insulation physics.
VENUE: Indo-German Conference on Cryogenics for Sustainable Technologies, IIT Kharagpur.

DEWAR SPECIFICATIONS:
1. Cryogen Stored: ${fluidData.name} (${fluidData.tBoil} K, Latent Heat: ${fluidData.hfg} kJ/kg)
2. Capacity: ${volumeL} Liters (${liqMassKg.toFixed(1)} kg)
3. Annular Vacuum Level: 10^${vacLog} mbar (${vacPress.toExponential(1)} mbar)
4. Multi-Layer Insulation (MLI): ${mliLayers} layers
5. Neck Material: ${neckMat.toUpperCase()} (k = ${kNeck} W/m·K)
6. Radiation Heat Leak: ${qRadWatts.toFixed(3)} W (${(qRadWatts / qTotalWatts * 100).toFixed(0)}%)
7. Solid Conduction (Neck): ${qNeckWatts.toFixed(3)} W (${(qNeckWatts / qTotalWatts * 100).toFixed(0)}%)
8. Residual Gas Conduction: ${qGasWatts.toFixed(3)} W (${(qGasWatts / qTotalWatts * 100).toFixed(0)}%)
9. Total Heat Leak: ${qTotalWatts.toFixed(3)} W
10. Boil-Off Rate: ${borPctDay.toFixed(2)} %/day (${evapLDay.toFixed(2)} L/day)
11. Safe Hold Time: ${holdTimeDays} days

ANALYSIS TOPICS:
1. Vacuum Degradation: Discuss the crossover from free-molecular (Knudsen) regime to continuum conduction when vacuum degrades from 10^-4 to 10^-1 mbar.
2. Getters & Adsorbents: How do chemical getters and cryogenic molecular sieves (Zeolite 13X / activated charcoal) maintain dynamic vacuum over 10-year lifespans?
3. Collaborative Fabrication: Contrast Indian (InoxCVA, VRV) and German (Cryotherm, Linde) vacuum vessel engineering standards.`,
    [fluidData, volumeL, liqMassKg, vacLog, vacPress, mliLayers, neckMat, kNeck, qRadWatts, qNeckWatts, qGasWatts, qTotalWatts, borPctDay, evapLDay, holdTimeDays]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={200} maxWidth={280} />

      <PillRow>
        <Pill active={fluid === "ln2"} onClick={() => setFluid("ln2")} color={T.accent}>
          LN2 (77K)
        </Pill>
        <Pill active={fluid === "lh2"} onClick={() => setFluid("lh2")} color={T.pink}>
          LH2 (20K)
        </Pill>
        <Pill active={fluid === "lhe"} onClick={() => setFluid("lhe")} color={T.gold}>
          LHe (4.2K)
        </Pill>
        <Pill active={neckMat === "g10"} onClick={() => setNeckMat("g10")} color={T.green}>
          G10 Neck
        </Pill>
        <Pill active={neckMat === "ss304"} onClick={() => setNeckMat("ss304")} color={T.gray}>
          SS304
        </Pill>
      </PillRow>

      <Slider label="MLI Reflective Layers" value={mliLayers} onChange={setMliLayers} min={0} max={60} step={5} unit=" layers" color={T.gold} />
      <Slider label="Vacuum Level (log10 mbar)" value={vacLog} onChange={setVacLog} min={-6} max={-1} step={0.5} unit=" mbar" color={T.cyan} />
      <Slider label="Dewar Volume" value={volumeL} onChange={setVolumeL} min={10} max={250} step={10} unit=" L" color={T.accent} />

      <DataRow>
        <DataBox label="Heat Leak" value={qTotalWatts.toFixed(2)} unit="W" color={T.orange} />
        <DataBox label="BOR" value={borPctDay.toFixed(1)} unit="%/d" color={borPctDay < 1 ? T.green : T.red} />
        <DataBox label="Loss" value={evapLDay.toFixed(2)} unit="L/d" color={T.pink} />
        <DataBox label="Hold Time" value={holdTimeDays} unit="days" color={T.cyan} />
      </DataRow>

      <InfoBox color={T.gold}>
        <strong style={{ color: T.gold }}>Dewar Thermal Isolation:</strong> Heat enters via radiation (reduced by aluminized Mylar MLI in high vacuum), neck conduction (mitigated using low-conductivity G10 glass-epoxy composites), and residual gas collisions. Below 10⁻⁴ mbar, gas conduction is virtually suppressed.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.gold} />

      <ExportBtn
        simId="dewar_insulation"
        getData={() => ({
          fluid,
          volumeL,
          vacLog,
          mliLayers,
          neckMat,
          qTotalWatts: qTotalWatts.toFixed(3),
          borPctDay: borPctDay.toFixed(2),
          evapLDay: evapLDay.toFixed(2),
          holdTimeDays,
        })}
        color={T.gold}
      />
    </div>
  );
}
