import { useState, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function RegenerativeCoolingSim() {
  const [coolant, setCoolant] = useState("lh2"); // lh2 (20K), lch4 (111K)
  const [chamberPressBar, setChamberPressBar] = useState(80); // bar (CE-20 is ~60-80 bar)
  const [wallThicknessMm, setWallThicknessMm] = useState(1.0); // mm copper wall
  const [coolantFlowKgS, setCoolantFlowKgS] = useState(18); // kg/s

  const coolantData = {
    lh2: { name: "Liquid Hydrogen (LH2)", tIn: 22, cp: 14.3, engine: "ISRO CE-20 (LVM3)", color: T.pink },
    lch4: { name: "Liquid Methane (LCH4)", tIn: 112, cp: 3.5, engine: "Next-Gen ISRO Methalox", color: T.gold },
  }[coolant];

  // Flame gas temperature inside combustion chamber (°C / K)
  const flameTempK = 3600; // ~3,300°C
  // Heat flux at throat: q_dot = h_gas * (T_aw - T_wg) [MW/m2]
  // In high pressure rocket throats, q_dot reaches 40-80 MW/m2!
  const heatFluxMWM2 = Math.min(85, Math.max(25, (chamberPressBar * 0.55) / (wallThicknessMm * 0.6))).toFixed(1);

  // Copper wall hot-gas side temperature (°C)
  // Max safe limit for Narloy-Z / CuCrZr copper alloy is ~650°C (923 K)
  const wallTempC = Math.max(380, Math.min(950, 420 + (parseFloat(heatFluxMWM2) * 5.2 * wallThicknessMm) - (coolantFlowKgS * 6.5))).toFixed(0);
  const isWallSafe = parseFloat(wallTempC) < 650;
  const isMelting = parseFloat(wallTempC) > 850;

  // Coolant temperature rise exiting the cooling jacket (K)
  // ΔT = Q / (m_dot * cp)
  const coolantTempOutK = (coolantData.tIn + (parseFloat(heatFluxMWM2) * 280) / (coolantFlowKgS * coolantData.cp)).toFixed(0);

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

      // 1. Blazing Rocket Flame Core (Left Center to Right)
      // Nozzle hourglass contour (Converging-Diverging de Laval Nozzle)
      const throatX = cx;
      const throatR = 26; // Throat radius
      const inletR = 48; // Chamber radius
      const exitR = 44; // Expansion nozzle radius

      const leftX = 35;
      const rightX = W - 35;

      // Draw Rocket Fire (3,600 K white-orange flame)
      const flameGrad = ctx.createLinearGradient(leftX, 0, rightX, 0);
      flameGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)"); // White-hot combustion
      flameGrad.addColorStop(0.5, "rgba(255, 107, 53, 0.9)"); // Orange sonic throat
      flameGrad.addColorStop(1, "rgba(247, 37, 133, 0.8)"); // Supersonic exhaust
      ctx.fillStyle = flameGrad;

      ctx.beginPath();
      ctx.moveTo(leftX, cy - inletR);
      ctx.bezierCurveTo(leftX + 45, cy - inletR, throatX - 25, cy - throatR, throatX, cy - throatR);
      ctx.bezierCurveTo(throatX + 25, cy - throatR, rightX - 35, cy - exitR, rightX, cy - exitR);
      ctx.lineTo(rightX, cy + exitR);
      ctx.bezierCurveTo(rightX - 35, cy + exitR, throatX + 25, cy + throatR, throatX, cy + throatR);
      ctx.bezierCurveTo(throatX - 25, cy + throatR, leftX + 45, cy + inletR, leftX, cy + inletR);
      ctx.closePath();
      ctx.fill();

      // Flame exhaust shock diamonds / ripples
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const sx = throatX + 18 + i * 20;
        const sw = 10 + Math.sin(frame * 0.2 + i) * 2;
        ctx.beginPath();
        ctx.moveTo(sx - sw, cy);
        ctx.lineTo(sx, cy - 8);
        ctx.lineTo(sx + sw, cy);
        ctx.lineTo(sx, cy + 8);
        ctx.closePath();
        ctx.stroke();
      }

      ctx.fillStyle = T.white;
      ctx.font = `900 8px ${TECH_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText("FLAME: 3,600 K", leftX + 35, cy + 3);

      // 2. Copper Alloy Liner Wall (Top & Bottom)
      const wallColor = isMelting ? T.red : isWallSafe ? T.gold : T.orange;
      ctx.strokeStyle = wallColor;
      ctx.lineWidth = Math.max(3, wallThicknessMm * 3.5);

      // Top wall
      ctx.beginPath();
      ctx.moveTo(leftX, cy - inletR);
      ctx.bezierCurveTo(leftX + 45, cy - inletR, throatX - 25, cy - throatR, throatX, cy - throatR);
      ctx.bezierCurveTo(throatX + 25, cy - throatR, rightX - 35, cy - exitR, rightX, cy - exitR);
      ctx.stroke();

      // Bottom wall
      ctx.beginPath();
      ctx.moveTo(leftX, cy + inletR);
      ctx.bezierCurveTo(leftX + 45, cy + inletR, throatX - 25, cy + throatR, throatX, cy + throatR);
      ctx.bezierCurveTo(throatX + 25, cy + throatR, rightX - 35, cy + exitR, rightX, cy + exitR);
      ctx.stroke();

      // 3. Cryogenic Cooling Channels (Flowing from Right to Left counter-current)
      const channelOffset = 8 + wallThicknessMm * 3.5;
      ctx.strokeStyle = coolantData.color;
      ctx.lineWidth = 4;
      ctx.setLineDash([6, 3]);

      // Top cooling channel
      ctx.beginPath();
      ctx.moveTo(rightX, cy - exitR - channelOffset);
      ctx.bezierCurveTo(rightX - 35, cy - exitR - channelOffset, throatX + 25, cy - throatR - channelOffset, throatX, cy - throatR - channelOffset);
      ctx.bezierCurveTo(throatX - 25, cy - throatR - channelOffset, leftX + 45, cy - inletR - channelOffset, leftX, cy - inletR - channelOffset);
      ctx.stroke();

      // Bottom cooling channel
      ctx.beginPath();
      ctx.moveTo(rightX, cy + exitR + channelOffset);
      ctx.bezierCurveTo(rightX - 35, cy + exitR + channelOffset, throatX + 25, cy + throatR + channelOffset, throatX, cy + throatR + channelOffset);
      ctx.bezierCurveTo(throatX - 25, cy + throatR + channelOffset, leftX + 45, cy + inletR + channelOffset, leftX, cy + inletR + channelOffset);
      ctx.stroke();
      ctx.setLineDash([]);

      // Flowing coolant particles (moving right to left)
      ctx.fillStyle = T.white;
      const cOffset = (frame * 3) % (rightX - leftX);
      ctx.beginPath();
      ctx.arc(rightX - cOffset, cy - throatR - channelOffset, 2, 0, Math.PI * 2);
      ctx.arc(rightX - cOffset, cy + throatR + channelOffset, 2, 0, Math.PI * 2);
      ctx.fill();

      // Extreme Heat Flux Arrows (Perpendicular into the wall at the throat)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 1.5;
      // Top arrow
      ctx.beginPath();
      ctx.moveTo(throatX, cy - 10);
      ctx.lineTo(throatX, cy - throatR - 2);
      ctx.stroke();
      // Bottom arrow
      ctx.beginPath();
      ctx.moveTo(throatX, cy + 10);
      ctx.lineTo(throatX, cy + throatR + 2);
      ctx.stroke();

      // Diagnostics & Status
      ctx.font = `800 8px ${TECH_FONT}`;
      ctx.textAlign = "left";
      ctx.fillStyle = coolantData.color;
      ctx.fillText(coolantData.engine, 10, 16);

      ctx.font = `800 9px ${MONO_FONT}`;
      ctx.fillStyle = isMelting ? T.red : isWallSafe ? T.green : T.orange;
      ctx.fillText(`WALL: ${wallTempC}°C (${isWallSafe ? "SAFE" : isMelting ? "MELTING!" : "MARGINAL"})`, 10, H - 10);

      ctx.textAlign = "right";
      ctx.fillStyle = T.orange;
      ctx.fillText(`q: ${heatFluxMWM2} MW/m²`, W - 10, 16);
      ctx.fillStyle = T.cyan;
      ctx.fillText(`Coolant Out: ${coolantTempOutK} K`, W - 10, 28);
    },
    [coolant, chamberPressBar, wallThicknessMm, coolantFlowKgS, coolantData, heatFluxMWM2, wallTempC, isWallSafe, isMelting, coolantTempOutK],
    { animate: true }
  );

  const buildPrompt = useCallback(
    () => `Cryogenic Rocket Engine Thrust Chamber Regenerative Cooling — IGCCST 2026:
ROLE: Liquid rocket engine combustion and thermal management specialist (ISRO LPSC & DLR Lampoldshausen consultant).
CONFERENCE: Indo-German Conference on Cryogenics for Sustainable Technologies.

CHAMBER OPERATING PARAMETERS:
1. Engine Architecture: ${coolantData.engine}
2. Combustion Pressure (P_c): ${chamberPressBar} bar (Gas Temp: ${flameTempK} K / ~3,327°C)
3. Regenerative Coolant: ${coolantData.name} (Inlet: ${coolantData.tIn} K)
4. Coolant Mass Flow: ${coolantFlowKgS} kg/s (Coolant Exit Temp: ${coolantTempOutK} K)
5. Copper Chamber Wall Thickness: ${wallThicknessMm} mm
6. Peak Throat Heat Flux: ${heatFluxMWM2} MW/m²
7. Maximum Inner Wall Temperature: ${wallTempC} °C
8. Structural Safety Status: ${isWallSafe ? "SAFE (Below 650°C yield margin)" : isMelting ? "CRITICAL FAILURE (Wall melting/blistering)" : "MARGINAL OVERHEATING"}

TECHNICAL ANALYSIS:
1. Bartz Heat Transfer Correlation: How does the sonic throat convergence concentrate turbulent convective gas-side heat transfer ($q > 50\,\text{MW/m}^2$), exceeding solar surface heat flux?
2. Supercritical Fluid Behavior: In the micro-cooling channels, why does hydrogen or methane transition into a supercritical state ($P > P_c$), bypassing two-phase boiling burnout (CHF)?
3. ISRO CE-20 Indigenous Mastery: Discuss how India's Liquid Propulsion Systems Centre (LPSC) mastered regenerative brazing of milled CuCrZr channels with electroformed nickel jackets for the GSLV Mk-III / LVM3 cryogenic stage.`,
    [coolantData, chamberPressBar, flameTempK, coolantFlowKgS, coolantTempOutK, wallThicknessMm, heatFluxMWM2, wallTempC, isWallSafe, isMelting]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={200} maxWidth={280} />

      <PillRow>
        <Pill active={coolant === "lh2"} onClick={() => setCoolant("lh2")} color={T.pink}>
          LH2 (20K ISRO CE-20)
        </Pill>
        <Pill active={coolant === "lch4"} onClick={() => setCoolant("lch4")} color={T.gold}>
          Methane (111K Methalox)
        </Pill>
      </PillRow>

      <Slider label="Combustion Chamber Pressure" value={chamberPressBar} onChange={setChamberPressBar} min={40} max={150} step={5} unit=" bar" color={T.orange} />
      <Slider label="Coolant Mass Flow Rate" value={coolantFlowKgS} onChange={setCoolantFlowKgS} min={8} max={35} step={1} unit=" kg/s" color={T.cyan} />
      <Slider label="Copper Wall Thickness" value={wallThicknessMm} onChange={setWallThicknessMm} min={0.6} max={2.2} step={0.1} unit=" mm" color={T.gold} />

      <DataRow>
        <DataBox label="Wall Temp" value={`${wallTempC}°C`} color={isWallSafe ? T.green : T.red} />
        <DataBox label="Heat Flux" value={`${heatFluxMWM2}`} unit="MW/m²" color={T.orange} />
        <DataBox label="Coolant Out" value={`${coolantTempOutK}K`} color={T.cyan} />
        <DataBox label="Status" value={isWallSafe ? "SAFE" : "MELT!"} color={isWallSafe ? T.green : T.red} />
      </DataRow>

      <InfoBox color={T.orange}>
        <strong style={{ color: T.orange }}>How Rocket Engines Survive 3,500°C:</strong> Inside a rocket engine, the flame is hot enough to vaporize copper! To prevent the nozzle from instantly melting, the cryogenic fuel (liquid hydrogen at -253°C) is pumped at high velocity through hundreds of micro-channels milled right into the nozzle wall. The cryogenic fluid pulls heat out faster than the flame can melt the metal, warming the fuel for better combustion.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.orange} />

      <ExportBtn
        simId="regenerative_cooling"
        getData={() => ({
          coolant,
          chamberPressBar,
          coolantFlowKgS,
          wallThicknessMm,
          heatFluxMWM2,
          wallTempC,
          coolantTempOutK,
          isWallSafe,
        })}
        color={T.orange}
      />
    </div>
  );
}
