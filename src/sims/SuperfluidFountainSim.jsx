import { useState, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function SuperfluidFountainSim() {
  const [tempK, setTempK] = useState(1.6); // Kelvin (1.0 to 2.8 K)
  const [heaterPowerMW, setHeaterPowerMW] = useState(25); // mW
  const [showRollinFilm, setShowRollinFilm] = useState(true);

  // Lambda point transition of Liquid Helium-4 is at 2.17 K
  const tLambda = 2.17;
  const isSuperfluid = tempK < tLambda;

  // Two-fluid model (Tisza & Landau):
  // Superfluid fraction rho_s / rho = 1 - (T / T_lambda)^5.6
  const superfluidFraction = isSuperfluid
    ? Math.min(1.0, Math.max(0, 1 - Math.pow(tempK / tLambda, 5.6)))
    : 0;

  // Fountain height (London thermomechanical equation: ΔP = rho * S * ΔT)
  // Height h = ΔP / (rho * g)
  const fountainHeightMm = isSuperfluid && heaterPowerMW > 0
    ? Math.min(65, (superfluidFraction * (heaterPowerMW / 10) * 18)).toFixed(1)
    : "0.0";

  // Viscosity: exactly 0 for the superfluid component! Normal component has small viscosity
  const effectiveViscosityUPoise = isSuperfluid ? (1 - superfluidFraction) * 20 : 33;

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

      // Glass Bath Vessel (Cryostat)
      const bathW = 150;
      const bathH = 110;
      const bathX = cx - bathW / 2;
      const bathY = cy - 25;

      ctx.fillStyle = "rgba(248, 150, 30, 0.05)";
      ctx.strokeStyle = T.glassBorder;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bathX, bathY, bathW, bathH);

      // Helium Liquid Pool in Bath
      const liqLevelY = bathY + 45;
      ctx.fillStyle = isSuperfluid ? "rgba(77, 255, 184, 0.25)" : "rgba(248, 150, 30, 0.3)";
      ctx.fillRect(bathX + 2, liqLevelY, bathW - 4, bathH - 47);

      // Fountain Tube Assembly (Central Glass Capillary with Nozzle)
      const tubeW = 22;
      const tubeH = 65;
      const tubeX = cx - tubeW / 2;
      const tubeY = liqLevelY - 20;

      ctx.strokeStyle = T.white;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(tubeX, tubeY, tubeW, tubeH);

      // Porous Plug (Fine Carborundum powder at bottom of tube)
      const plugH = 12;
      const plugY = tubeY + tubeH - plugH;
      ctx.fillStyle = "rgba(100, 116, 139, 0.8)";
      ctx.fillRect(tubeX + 1, plugY, tubeW - 2, plugH);
      ctx.fillStyle = T.white;
      ctx.font = `600 5px ${TECH_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText("PLUG", cx, plugY + 8);

      // Tiny capillary nozzle at the top
      ctx.beginPath();
      ctx.moveTo(cx - 3, tubeY);
      ctx.lineTo(cx - 1.5, tubeY - 14);
      ctx.lineTo(cx + 1.5, tubeY - 14);
      ctx.lineTo(cx + 3, tubeY);
      ctx.stroke();

      // Mini heater resistor inside tube
      ctx.strokeStyle = heaterPowerMW > 0 ? T.red : T.dimText;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 6, plugY - 8);
      ctx.lineTo(cx + 6, plugY - 8);
      ctx.stroke();

      // Fountain Spray Jet (When superfluid + heater on)
      const fH = parseFloat(fountainHeightMm);
      if (fH > 0) {
        ctx.strokeStyle = T.green;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, tubeY - 14);
        ctx.lineTo(cx, tubeY - 14 - fH);
        ctx.stroke();

        // Droplet arcs cascading back down
        ctx.fillStyle = T.green;
        for (let i = 0; i < 8; i++) {
          const t = (frame * 0.1 + i * 0.4) % 1;
          const arcX = cx + (i % 2 === 0 ? -1 : 1) * Math.sin(t * Math.PI) * (20 + i * 2);
          const arcY = tubeY - 14 - fH * (1 - t * t) + t * (fH + 30);
          ctx.beginPath();
          ctx.arc(arcX, arcY, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Rollin Creeping Film on walls (Beaker overflow effect)
      if (isSuperfluid && showRollinFilm) {
        ctx.strokeStyle = "rgba(77, 255, 184, 0.8)";
        ctx.lineWidth = 2;
        // Creeping up the left side of the tube
        ctx.beginPath();
        ctx.moveTo(bathX + 2, liqLevelY);
        ctx.lineTo(bathX + 2, bathY + 2);
        ctx.lineTo(bathX + 12, bathY + 2);
        ctx.stroke();

        // Hanging drop falling from rim
        const dripY = bathY + 2 + ((frame * 1.5) % 35);
        ctx.fillStyle = T.green;
        ctx.beginPath();
        ctx.arc(bathX + 12, dripY, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // HUD & Diagnostics
      ctx.font = `800 9px ${TECH_FONT}`;
      ctx.textAlign = "left";
      ctx.fillStyle = isSuperfluid ? T.green : T.orange;
      ctx.fillText(
        isSuperfluid ? `● HELIUM II SUPERFLUID (ZERO VISCOSITY)` : `▲ HELIUM I (NORMAL VISCOUS LIQUID)`,
        10,
        18
      );

      ctx.font = `700 8px ${MONO_FONT}`;
      ctx.fillStyle = T.dimText;
      ctx.fillText(`T_lambda = 2.17 K | Superfluid: ${(superfluidFraction * 100).toFixed(0)}%`, 10, 30);

      ctx.textAlign = "right";
      ctx.fillStyle = T.green;
      ctx.fillText(`Jet: ${fountainHeightMm} mm`, W - 10, 18);
    },
    [tempK, heaterPowerMW, showRollinFilm, isSuperfluid, superfluidFraction, fountainHeightMm],
    { animate: true }
  );

  const buildPrompt = useCallback(
    () => `Superfluid Helium-4 Fountain Effect & Rollin Film — IGCCST 2026:
ROLE: Quantum fluids physicist explaining macroscopic quantum phenomena to students.
CONFERENCE: Indo-German Conference on Cryogenics for Sustainable Technologies, IIT Kharagpur.

STATE PARAMETERS:
1. Liquid Temperature: ${tempK} K (Lambda Transition Point T_lambda: 2.17 K)
2. State: ${isSuperfluid ? "He II Superfluid (Macroscopic Quantum State)" : "He I Normal Liquid"}
3. Superfluid Component Fraction (ρ_s / ρ): ${(superfluidFraction * 100).toFixed(1)}%
4. Effective Dynamic Viscosity: ${effectiveViscosityUPoise.toFixed(1)} μPoise (Superfluid component = ZERO)
5. Heater Power Applied: ${heaterPowerMW} mW
6. Superfluid Fountain Height: ${fountainHeightMm} mm
7. Rollin Creeping Film: ${showRollinFilm ? "ENABLED (Wall-climbing monolayer)" : "DISABLED"}

EXPLANATION INQUIRY:
1. Thermomechanical (Fountain) Effect: Explain London's equation (ΔP = ρ·S·ΔT). Why does a tiny temperature difference across porous powder produce huge osmotic pressure that propels liquid helium into the air?
2. Zero Viscosity: Why does the superfluid component flow through sub-micron pores with zero friction while normal liquid is completely blocked?
3. Rollin Film: How does quantum mechanics allow liquid helium to climb vertical container walls against gravity?`,
    [tempK, isSuperfluid, superfluidFraction, effectiveViscosityUPoise, heaterPowerMW, fountainHeightMm, showRollinFilm]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={200} maxWidth={280} />

      <PillRow>
        <Pill active={tempK === 1.6} onClick={() => setTempK(1.6)} color={T.green}>
          1.6K (Superfluid)
        </Pill>
        <Pill active={tempK === 2.17} onClick={() => setTempK(2.17)} color={T.gold}>
          2.17K (Lambda Point)
        </Pill>
        <Pill active={tempK === 2.6} onClick={() => setTempK(2.6)} color={T.orange}>
          2.6K (Normal Liquid)
        </Pill>
        <Pill active={showRollinFilm} onClick={() => setShowRollinFilm(!showRollinFilm)} color={T.cyan}>
          {showRollinFilm ? "🌊 Creeping Film ON" : "Film OFF"}
        </Pill>
      </PillRow>

      <Slider label="Liquid Helium Temperature" value={tempK} onChange={setTempK} min={1.0} max={2.8} step={0.05} unit=" K" color={tempK < 2.17 ? T.green : T.orange} />
      <Slider label="Heater Power" value={heaterPowerMW} onChange={setHeaterPowerMW} min={0} max={50} step={5} unit=" mW" color={T.red} />

      <DataRow>
        <DataBox label="Superfluid" value={`${(superfluidFraction * 100).toFixed(0)}%`} color={isSuperfluid ? T.green : T.dimText} />
        <DataBox label="Jet Height" value={`${fountainHeightMm}`} unit="mm" color={T.cyan} />
        <DataBox label="Viscosity" value={isSuperfluid ? "0 μP" : "33 μP"} color={isSuperfluid ? T.purple : T.orange} />
        <DataBox label="Phase" value={isSuperfluid ? "He II" : "He I"} color={isSuperfluid ? T.green : T.orange} />
      </DataRow>

      <InfoBox color={T.green}>
        <strong style={{ color: T.green }}>The Superfluid Fountain Effect:</strong> Below 2.17 K, Helium-4 transitions into a quantum superfluid (Helium II) with <strong>zero viscosity</strong>. When heat is applied inside a porous tube, superfluid helium rushes through the pores toward the warmth with zero friction, building thermomechanical osmotic pressure that shoots a fountain out of the nozzle! Above 2.17 K, the fountain stops instantly.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.green} />

      <ExportBtn
        simId="superfluid_fountain"
        getData={() => ({
          tempK,
          isSuperfluid,
          superfluidFraction: (superfluidFraction * 100).toFixed(1),
          heaterPowerMW,
          fountainHeightMm,
          effectiveViscosityUPoise: effectiveViscosityUPoise.toFixed(1),
        })}
        color={T.green}
      />
    </div>
  );
}
