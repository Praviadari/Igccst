import { useState, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function SuperconductingCableSim() {
  const [cableLengthKm, setCableLengthKm] = useState(5.0); // km
  const [gridVoltageKV, setGridVoltageKV] = useState(66); // kV
  const [currentKA, setCurrentKA] = useState(3.0); // kA (3000 Amperes)
  const [htsMaterial, setHtsMaterial] = useState("ybco"); // ybco (2G HTS), bscco (1G HTS)

  // Power transmitted: P = sqrt(3) * V * I (3-phase power in MVA / MW)
  const powerCapacityMVA = (Math.sqrt(3) * gridVoltageKV * currentKA).toFixed(0);

  // Traditional copper transmission line loss:
  // Resistance of copper ~ 0.03 ohms/km per phase
  // I^2 * R * 3 phases: loss in MW = 3 * (I_kA * 1000)^2 * (0.03 * L_km) / 1e6
  const copperLossMW = (3 * Math.pow(currentKA * 1000, 2) * (0.03 * cableLengthKm) / 1e6).toFixed(1);

  // Superconducting Cable loss:
  // ZERO DC electrical resistance! AC losses are tiny (~ 1-2 W/m) + cryostat heat inleak (~ 2 W/m)
  // Total thermal load = (2 W/m + 1.5 W/m) * L_m
  const cryoThermalLoadKW = (3.5 * cableLengthKm * 1000) / 1000;
  // Refrigerator input power: COP_cryo ~ 0.10 W/W at 77K (10 W electrical per 1 W cooling)
  const cryoCoolingPowerMW = ((cryoThermalLoadKW * 10) / 1000).toFixed(2);

  // Net energy saved by HTS cable compared to copper:
  const netEnergySavedMW = (parseFloat(copperLossMW) - parseFloat(cryoCoolingPowerMW)).toFixed(1);
  const percentSaved = Math.min(99, Math.max(70, ((parseFloat(copperLossMW) - parseFloat(cryoCoolingPowerMW)) / Math.max(0.1, parseFloat(copperLossMW)) * 100))).toFixed(0);

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const canvasTheme = getCanvasTheme();
      const cx = W / 2;
      const cy = H / 2;

      // Dark background
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W / 2);
      bg.addColorStop(0, canvasTheme.bgStart);
      bg.addColorStop(1, canvasTheme.bgEnd);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Left: Concentric Cross-Section of HTS Cable
      const cableX = 85;
      const cableY = cy;

      // Outer Vacuum Cryostat Jacket
      ctx.strokeStyle = T.gray;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cableX, cableY, 48, 0, Math.PI * 2);
      ctx.stroke();

      // MLI Vacuum Annulus
      ctx.strokeStyle = "rgba(248, 150, 30, 0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.arc(cableX, cableY, 42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // High Voltage Dielectric Screen (PPLP layer)
      ctx.fillStyle = "rgba(100, 116, 139, 0.4)";
      ctx.strokeStyle = T.accentDark;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cableX, cableY, 35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // HTS Tape Layer (Glowing superconductor tapes wound in spiral)
      const glow = Math.sin(frame * 0.1) * 0.2 + 0.8;
      ctx.strokeStyle = `rgba(77, 255, 184, ${glow})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cableX, cableY, 24, 0, Math.PI * 2);
      ctx.stroke();

      // Central Liquid Nitrogen Channel (77 K Coolant Core)
      ctx.fillStyle = "rgba(76, 201, 240, 0.7)";
      ctx.beginPath();
      ctx.arc(cableX, cableY, 18, 0, Math.PI * 2);
      ctx.fill();

      // Flowing coolant particles in core
      ctx.fillStyle = T.white;
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2 + frame * 0.05;
        ctx.beginPath();
        ctx.arc(cableX + Math.cos(ang) * 9, cableY + Math.sin(ang) * 9, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = T.white;
      ctx.font = `800 6px ${TECH_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText("LN2 77K", cableX, cableY + 2);
      ctx.fillText("HTS TAPES", cableX, cableY + 58);

      // Right: Comparison Display (1 Compact HTS Pipe vs 10 Overhead Towers)
      const compX = W - 75;
      const compY = cy;

      ctx.strokeStyle = T.glassBorder;
      ctx.fillStyle = T.glass;
      ctx.lineWidth = 1;
      ctx.strokeRect(compX - 45, compY - 55, 90, 110);
      ctx.fillRect(compX - 45, compY - 55, 90, 110);

      ctx.font = `800 7px ${TECH_FONT}`;
      ctx.fillStyle = T.green;
      ctx.fillText("POWER CAPACITY", compX, compY - 42);

      ctx.font = `900 13px ${MONO_FONT}`;
      ctx.fillStyle = T.white;
      ctx.fillText(`${powerCapacityMVA}`, compX, compY - 24);
      ctx.font = `700 7px ${TECH_FONT}`;
      ctx.fillStyle = T.accent;
      ctx.fillText("MEGAWATTS (MW)", compX, compY - 14);

      // Cable diameter badge
      ctx.fillStyle = "rgba(77, 255, 184, 0.15)";
      ctx.strokeStyle = T.green;
      ctx.strokeRect(compX - 35, compY + 2, 70, 20);
      ctx.fillRect(compX - 35, compY + 2, 70, 20);
      ctx.fillStyle = T.green;
      ctx.font = `800 7px ${MONO_FONT}`;
      ctx.fillText("Ø 15 cm BURIED", compX, compY + 14);

      ctx.font = `600 6px ${TECH_FONT}`;
      ctx.fillStyle = T.gray;
      ctx.fillText("Replaces 8x Towers", compX, compY + 36);
      ctx.fillText(`Saved: ${netEnergySavedMW} MW`, compX, compY + 46);

      // Top Header HUD
      ctx.font = `800 8px ${TECH_FONT}`;
      ctx.textAlign = "left";
      ctx.fillStyle = T.green;
      ctx.fillText("SUPERCONDUCTING GRID CABLE (HTS)", 10, 16);
    },
    [cableLengthKm, gridVoltageKV, currentKA, htsMaterial, powerCapacityMVA, netEnergySavedMW],
    { animate: true }
  );

  const buildPrompt = useCallback(
    () => `Cryogenic High-Temperature Superconducting (HTS) Power Cable — IGCCST 2026:
ROLE: Power systems engineer and applied superconductivity grid architect.
CONFERENCE: Indo-German Conference on Cryogenics for Sustainable Technologies.

GRID CABLE CONFIGURATION:
1. Cable Length: ${cableLengthKm} km
2. Nominal Grid Voltage: ${gridVoltageKV} kV (3-Phase AC)
3. Operating Current: ${currentKA} kA (3,000 Amperes per phase)
4. Total Transmitted Power: ${powerCapacityMVA} MVA / MW
5. Superconductor Material: ${htsMaterial.toUpperCase()} (YBCO 2G Tape @ 77K)
6. Traditional Copper Grid Heat Loss: ${copperLossMW} MW
7. Cryo-Cooling Refrigeration Load: ${cryoCoolingPowerMW} MW
8. Net Grid Energy Savings: ${netEnergySavedMW} MW (${percentSaved}% loss reduction)

EXPERT INQUIRY:
1. Zero Resistance Advantage: Explain why high current density (J_c > 10,000 A/cm²) in HTS tapes allows transmitting urban gigawatt-scale power through a narrow 15-cm buried pipe.
2. Cryogenic Sub-Cooling System: How do closed-loop liquid nitrogen circulation stations (operating between 65K and 77K at 5 bar) prevent nitrogen boiling while extracting AC dielectric losses?
3. Urban Substations: Contrast HTS cable projects (e.g., AmpaCity project in Essen, Germany by RWE/Nexans and Indian grid studies) in eliminating massive urban rights-of-way.`,
    [cableLengthKm, gridVoltageKV, currentKA, powerCapacityMVA, htsMaterial, copperLossMW, cryoCoolingPowerMW, netEnergySavedMW, percentSaved]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={200} maxWidth={280} />

      <PillRow>
        <Pill active={htsMaterial === "ybco"} onClick={() => setHtsMaterial("ybco")} color={T.green}>
          YBCO (2G HTS)
        </Pill>
        <Pill active={htsMaterial === "bscco"} onClick={() => setHtsMaterial("bscco")} color={T.accent}>
          BSCCO (1G HTS)
        </Pill>
        <Pill active={gridVoltageKV === 66} onClick={() => setGridVoltageKV(66)} color={T.cyan}>
          66 kV (City)
        </Pill>
        <Pill active={gridVoltageKV === 132} onClick={() => setGridVoltageKV(132)} color={T.gold}>
          132 kV (Regional)
        </Pill>
      </PillRow>

      <Slider label="Cable Transmission Length" value={cableLengthKm} onChange={setCableLengthKm} min={1} max={25} step={1} unit=" km" color={T.accent} />
      <Slider label="Operating Current" value={currentKA} onChange={setCurrentKA} min={1.0} max={6.0} step={0.5} unit=" kA" color={T.green} />

      <DataRow>
        <DataBox label="Power" value={`${powerCapacityMVA}`} unit="MW" color={T.green} />
        <DataBox label="Loss Saved" value={`${netEnergySavedMW}`} unit="MW" color={T.cyan} />
        <DataBox label="Cu Waste" value={`${copperLossMW}`} unit="MW" color={T.orange} />
        <DataBox label="Efficiency" value={`${percentSaved}%`} color={T.gold} />
      </DataRow>

      <InfoBox color={T.green}>
        <strong style={{ color: T.green }}>Powering a Whole City Through a 15cm Pipe:</strong> Traditional copper power lines waste 8–10% of all electricity as wasted heat (I²R). By running electricity through high-temperature superconducting tapes bathed in liquid nitrogen (-196°C), resistance vanishes to zero! A single buried 15 cm pipe can carry over 300 MW, replacing an entire corridor of giant high-voltage steel towers.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.green} />

      <ExportBtn
        simId="superconducting_cable"
        getData={() => ({
          cableLengthKm,
          gridVoltageKV,
          currentKA,
          powerCapacityMVA,
          copperLossMW,
          cryoCoolingPowerMW,
          netEnergySavedMW,
          percentSaved,
        })}
        color={T.green}
      />
    </div>
  );
}
