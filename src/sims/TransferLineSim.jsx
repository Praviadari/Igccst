import { useState, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function TransferLineSim() {
  const [fluid, setFluid] = useState("ln2"); // ln2, lh2, lng
  const [lineLenM, setLineLenM] = useState(50); // meters
  const [innerDiaMm, setInnerDiaMm] = useState(25); // mm
  const [mFlowKgS, setMFlowKgS] = useState(0.4); // kg/s
  const [insulType, setInsulType] = useState("vjl"); // vjl (vacuum jacketed), foam, bare

  const fluidInfo = {
    ln2: { name: "LN2 (77K)", tCryo: 77, rho: 808, visc: 0.00015, color: T.accent },
    lh2: { name: "LH2 (20K)", tCryo: 20, rho: 71, visc: 0.000013, color: T.pink },
    lng: { name: "LNG (111K)", tCryo: 111, rho: 450, visc: 0.00012, color: T.cyan },
  }[fluid];

  const tAmb = 295; // K
  const deltaT = tAmb - fluidInfo.tCryo;

  // Heat leak rate per meter [W/m]
  const heatLeakPerM = insulType === "vjl" ? 0.8 : insulType === "foam" ? 18.0 : 95.0;
  const totalHeatLeakW = heatLeakPerM * lineLenM;

  // Hydrodynamic calculations (Darcy-Weisbach pressure drop)
  // v = m / (rho * A)
  const pipeAreaM2 = Math.PI * Math.pow(innerDiaMm * 1e-3 / 2, 2);
  const flowVelocity = mFlowKgS / (fluidInfo.rho * pipeAreaM2);
  const reynolds = (fluidInfo.rho * flowVelocity * (innerDiaMm * 1e-3)) / fluidInfo.visc;
  // Friction factor (turbulent approx)
  const frictionF = reynolds > 4000 ? 0.316 / Math.pow(reynolds, 0.25) : 0.035;
  // ΔP = f * (L/D) * (rho * v^2 / 2) [Pa]
  const pressDropKPa = (frictionF * (lineLenM / (innerDiaMm * 1e-3)) * (fluidInfo.rho * flowVelocity * flowVelocity / 2)) / 1000;

  // Thermal contraction: Stainless steel contraction from 300K to 77K is ~ 3.0 mm per meter (ΔL/L ≈ 0.30%)
  const contractionCoeff = fluid === "lh2" ? 0.0033 : 0.0030;
  const totalContractionMm = (lineLenM * contractionCoeff * 1000).toFixed(1);

  // Cool-down time estimate (minutes for warm line to reach single-phase liquid flow)
  // Pipe mass (SS304, wall 1.5mm, density 8000 kg/m3)
  const pipeMassKg = Math.PI * (innerDiaMm * 1e-3) * 0.0015 * lineLenM * 8000;
  const cooldownMin = Math.max(1.5, (pipeMassKg * 480 * deltaT) / (mFlowKgS * 200000 * 60)).toFixed(1);

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

      // Vacuum-Jacketed Line (Horizontal Cross-Section)
      const lineX = 30;
      const lineY = cy - 15;
      const lineW = W - 60;
      const lineH = 34;

      // Outer Vacuum Jacket (Stainless Steel)
      ctx.fillStyle = T.glass;
      ctx.strokeStyle = T.gray;
      ctx.lineWidth = 2;
      ctx.strokeRect(lineX, lineY, lineW, lineH);
      ctx.fillRect(lineX, lineY, lineW, lineH);

      // Bellows / Expansion joint indicator (Center)
      const belX = cx;
      ctx.strokeStyle = T.gold;
      ctx.lineWidth = 1.5;
      for (let i = -10; i <= 10; i += 4) {
        ctx.beginPath();
        ctx.moveTo(belX + i, lineY - 3);
        ctx.lineTo(belX + i, lineY + lineH + 3);
        ctx.stroke();
      }
      ctx.fillStyle = T.gold;
      ctx.font = `700 6px ${TECH_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText("BELLOWS", belX, lineY - 7);

      // Annular Vacuum Space with MLI
      if (insulType === "vjl") {
        ctx.strokeStyle = "rgba(248, 150, 30, 0.4)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(lineX + 3, lineY + 4, lineW - 6, lineH - 8);
        ctx.setLineDash([]);
      }

      // Inner Cryogenic Fluid Core
      const innerY = lineY + 9;
      const innerH = lineH - 18;

      // Cool-down gradient along the length (Cold blue propagating to warm orange)
      const fluidGrad = ctx.createLinearGradient(lineX, 0, lineX + lineW, 0);
      fluidGrad.addColorStop(0, fluidInfo.color);
      fluidGrad.addColorStop(0.7, `${fluidInfo.color}80`);
      fluidGrad.addColorStop(1, "rgba(255, 107, 53, 0.6)");
      ctx.fillStyle = fluidGrad;
      ctx.fillRect(lineX + 6, innerY, lineW - 12, innerH);

      // Flowing fluid particles
      ctx.fillStyle = T.white;
      for (let i = 0; i < 7; i++) {
        const px = lineX + 10 + ((frame * 3 + i * 35) % (lineW - 20));
        ctx.beginPath();
        ctx.arc(px, innerY + innerH / 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Heat Inleak arrows entering through insulation
      ctx.strokeStyle = "rgba(255, 77, 109, 0.6)";
      ctx.lineWidth = 1;
      for (let x = lineX + 30; x < lineX + lineW - 20; x += 45) {
        // From top
        ctx.beginPath();
        ctx.moveTo(x, lineY - 12);
        ctx.lineTo(x, lineY + 2);
        ctx.stroke();

        // From bottom
        ctx.beginPath();
        ctx.moveTo(x, lineY + lineH + 12);
        ctx.lineTo(x, lineY + lineH - 2);
        ctx.stroke();
      }

      // Contraction indicator arrows at ends
      ctx.strokeStyle = T.cyan;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lineX - 12, lineY + lineH / 2);
      ctx.lineTo(lineX - 2, lineY + lineH / 2);
      ctx.moveTo(lineX + lineW + 12, lineY + lineH / 2);
      ctx.lineTo(lineX + lineW + 2, lineY + lineH / 2);
      ctx.stroke();

      // HUD
      ctx.font = `800 8px ${TECH_FONT}`;
      ctx.textAlign = "left";
      ctx.fillStyle = fluidInfo.color;
      ctx.fillText(`${fluidInfo.name} TRANSFER LINE`, 10, 16);

      ctx.font = `700 8px ${MONO_FONT}`;
      ctx.fillStyle = T.dimText;
      ctx.fillText(`L = ${lineLenM}m | ID = ${innerDiaMm}mm | v = ${flowVelocity.toFixed(1)} m/s`, 10, 26);

      ctx.textAlign = "right";
      ctx.fillStyle = T.cyan;
      ctx.fillText(`ΔL: -${totalContractionMm} mm`, W - 10, 16);
      ctx.fillText(`ΔP: ${pressDropKPa.toFixed(1)} kPa`, W - 10, 26);
    },
    [fluid, lineLenM, innerDiaMm, mFlowKgS, insulType, fluidInfo, flowVelocity, pressDropKPa, totalContractionMm],
    { animate: true }
  );

  const buildPrompt = useCallback(
    () => `Cryogenic Transfer Line Hydraulics & Thermal Contraction — IGCCST 2026:
ROLE: Lead cryogenic pipeline infrastructure engineer (ISRO Launch Pad propellant loading & LNG import jetty specialist).
INSTITUTION: Indo-German Conference on Cryogenics for Sustainable Technologies.

LINE PARAMETERS:
1. Working Cryogen: ${fluidInfo.name} (${fluidInfo.tCryo} K)
2. Transfer Line Length: ${lineLenM} m
3. Inner Pipe Diameter: ${innerDiaMm} mm
4. Mass Flow Rate: ${mFlowKgS} kg/s (Velocity: ${flowVelocity.toFixed(2)} m/s, Re: ${reynolds.toFixed(0)})
5. Insulation System: ${insulType.toUpperCase()} (Heat leak: ${heatLeakPerM} W/m, Total: ${totalHeatLeakW.toFixed(0)} W)
6. Total Friction Pressure Drop: ${pressDropKPa.toFixed(2)} kPa
7. Thermal Contraction (300K -> ${fluidInfo.tCryo}K): -${totalContractionMm} mm
8. Line Chill-Down Time: ${cooldownMin} min

OPERATIONAL QUESTIONS:
1. Two-Phase Flow Instabilities: Discuss geysering, density wave oscillations, and thermal acoustic oscillations (TAO) during line chill-down.
2. Contraction Anchoring: How are multi-convolution Inconel/SS316 expansion bellows and internal G10 low-friction sliding spacers designed to absorb ${totalContractionMm} mm of shrinkage?
3. Collaborative Cryo Infrastructure: Compare vacuum jacketed piping (VJP) designs by German (Messer, Linde) and Indian (Inox India, Godrej Aerospace) manufacturers.`,
    [fluidInfo, lineLenM, innerDiaMm, mFlowKgS, flowVelocity, reynolds, insulType, heatLeakPerM, totalHeatLeakW, pressDropKPa, totalContractionMm, cooldownMin]
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
        <Pill active={fluid === "lng"} onClick={() => setFluid("lng")} color={T.cyan}>
          LNG (111K)
        </Pill>
        <Pill active={insulType === "vjl"} onClick={() => setInsulType("vjl")} color={T.green}>
          VJP (Vac)
        </Pill>
        <Pill active={insulType === "foam"} onClick={() => setInsulType("foam")} color={T.orange}>
          PIR Foam
        </Pill>
      </PillRow>

      <Slider label="Transfer Line Length" value={lineLenM} onChange={setLineLenM} min={10} max={150} step={5} unit=" m" color={T.accent} />
      <Slider label="Inner Pipe Diameter" value={innerDiaMm} onChange={setInnerDiaMm} min={15} max={80} step={5} unit=" mm" color={T.orange} />
      <Slider label="Liquid Flow Rate" value={mFlowKgS} onChange={setMFlowKgS} min={0.1} max={2.0} step={0.1} unit=" kg/s" color={T.cyan} />

      <DataRow>
        <DataBox label="Heat Leak" value={totalHeatLeakW.toFixed(0)} unit="W" color={T.orange} />
        <DataBox label="ΔP Drop" value={pressDropKPa.toFixed(1)} unit="kPa" color={T.accent} />
        <DataBox label="Shrinkage" value={`-${totalContractionMm}`} unit="mm" color={T.pink} />
        <DataBox label="Cooldown" value={cooldownMin} unit="min" color={T.green} />
      </DataRow>

      <InfoBox color={T.accent}>
        <strong style={{ color: T.accent }}>Vacuum-Jacketed Piping (VJP):</strong> Cryogenic pipelines contract significantly upon cooling (~3 mm per meter for stainless steel). Bellows expansion joints absorb thermal shrinkage while double-wall vacuum insulation maintains thermal inleak below 1 W/m.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.accent} />

      <ExportBtn
        simId="transfer_line"
        getData={() => ({
          fluid,
          lineLenM,
          innerDiaMm,
          mFlowKgS,
          insulType,
          totalHeatLeakW: totalHeatLeakW.toFixed(1),
          pressDropKPa: pressDropKPa.toFixed(2),
          totalContractionMm,
          cooldownMin,
        })}
        color={T.accent}
      />
    </div>
  );
}
