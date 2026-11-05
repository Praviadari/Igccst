import { useState, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function ThermosFlaskSim() {
  const [hasVacuum, setHasVacuum] = useState(true); // Convection killer
  const [hasSilvering, setHasSilvering] = useState(true); // Radiation killer (mirrored glass / MLI)
  const [neckMaterial, setNeckMaterial] = useState("plastic"); // plastic (low conduction) vs metal (high conduction)
  const [tempDiffK, setTempDiffK] = useState(220); // ΔT between room (300K) and cryogen (80K)

  // 1. Convection Heat Leak (Eliminated by vacuum!)
  // If air in gap: h_conv ~ 12 W/m2·K * A * ΔT (A ~ 0.15 m2)
  const qConvectionW = hasVacuum ? 0.0 : (12 * 0.15 * tempDiffK * 0.05).toFixed(1);

  // 2. Radiation Heat Leak (Mitigated by silvered / mirrored surface)
  // Emissivity: Silvered = 0.03, Plain glass/steel = 0.85
  const eps = hasSilvering ? 0.03 : 0.85;
  const sigma = 5.67e-8;
  const tHot = 300;
  const tCold = Math.max(20, tHot - tempDiffK);
  const qRadiationW = (0.15 * sigma * (Math.pow(tHot, 4) - Math.pow(tCold, 4)) * (eps / (2 - eps))).toFixed(1);

  // 3. Conduction Heat Leak through Neck
  // Plastic/Glass = low k (0.3 W/mK), Metal = high k (15 W/mK)
  const kNeck = neckMaterial === "plastic" ? 0.25 : 16.0;
  const qConductionW = ((kNeck * 0.0003 * tempDiffK) / 0.08).toFixed(1);

  // Total heat leak (Watts)
  const totalHeatW = (parseFloat(qConvectionW) + parseFloat(qRadiationW) + parseFloat(qConductionW)).toFixed(1);

  // Liquid Nitrogen Loss per day (g/day)
  // Latent heat LN2 = 199 kJ/kg
  const lossKgDay = ((parseFloat(totalHeatW) * 86400) / (199 * 1000)).toFixed(2);

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

      const fw = 80;
      const fh = 120;
      const fx = cx - fw / 2;
      const fy = cy - fh / 2 + 10;

      // Outer Wall (Ambient 300K)
      ctx.fillStyle = "rgba(255, 107, 53, 0.1)";
      ctx.strokeStyle = T.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(fx - 14, fy - 10, fw + 28, fh + 20, 10);
      ctx.fill();
      ctx.stroke();

      // Annular Gap: Vacuum (dark) vs Air (with convective swirl particles)
      if (!hasVacuum) {
        // Air filled: convective swirl dots
        ctx.fillStyle = "rgba(255, 107, 53, 0.4)";
        for (let i = 0; i < 8; i++) {
          const sy = fy + ((frame * 1.5 + i * 15) % fh);
          ctx.beginPath();
          ctx.arc(fx - 7, sy, 2, 0, Math.PI * 2);
          ctx.arc(fx + fw + 7, sy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Inner Mirrored Wall (Silver vs Dark)
      ctx.fillStyle = hasSilvering ? "rgba(200, 220, 255, 0.2)" : "rgba(30, 30, 40, 0.8)";
      ctx.strokeStyle = hasSilvering ? T.accent : T.dimText;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(fx, fy, fw, fh, 6);
      ctx.fill();
      ctx.stroke();

      // Liquid Cryogen Pool inside (Cold Blue)
      ctx.fillStyle = "rgba(76, 201, 240, 0.5)";
      ctx.fillRect(fx + 2, fy + 35, fw - 4, fh - 37);

      // Neck Stopper (Top)
      const neckW = 32;
      const neckH = 20;
      ctx.fillStyle = neckMaterial === "plastic" ? T.green : T.gray;
      ctx.strokeStyle = T.white;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - neckW / 2, fy - 16, neckW, neckH);
      ctx.fillRect(cx - neckW / 2, fy - 16, neckW, neckH);

      ctx.fillStyle = T.white;
      ctx.font = `700 6px ${TECH_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText(neckMaterial.toUpperCase(), cx, fy - 4);

      // Thermal Radiation Arrows (Red heat waves from outside trying to get in)
      ctx.strokeStyle = T.red;
      ctx.lineWidth = 1.5;
      for (let y = fy + 15; y < fy + fh - 10; y += 30) {
        ctx.beginPath();
        ctx.moveTo(fx - 25, y);
        ctx.lineTo(fx - 14, y);
        ctx.stroke();

        // If silvered, heat ray bounces back!
        if (hasSilvering) {
          ctx.beginPath();
          ctx.moveTo(fx - 14, y);
          ctx.lineTo(fx - 22, y - 8);
          ctx.stroke();
        } else {
          // Heat ray penetrates into the cold liquid!
          ctx.beginPath();
          ctx.moveTo(fx - 14, y);
          ctx.lineTo(fx + 10, y);
          ctx.stroke();
        }
      }

      // HUD & Diagnostics
      ctx.font = `800 8px ${TECH_FONT}`;
      ctx.textAlign = "left";
      ctx.fillStyle = T.white;
      ctx.fillText(`THERMAL DEWAR PRINCIPLE`, 10, 16);

      ctx.font = `700 8px ${MONO_FONT}`;
      ctx.fillStyle = hasVacuum ? T.green : T.red;
      ctx.fillText(`CONVECTION: ${hasVacuum ? "KILLED (VACUUM)" : "AIR LEAKING"}`, 10, 28);

      ctx.textAlign = "right";
      ctx.fillStyle = hasSilvering ? T.cyan : T.orange;
      ctx.fillText(`RADIATION: ${hasSilvering ? "REFLECTED 97%" : "ABSORBED"}`, W - 10, 16);
      ctx.fillStyle = T.gold;
      ctx.fillText(`TOTAL: ${totalHeatW} W`, W - 10, 28);
    },
    [hasVacuum, hasSilvering, neckMaterial, tempDiffK, totalHeatW],
    { animate: true }
  );

  const buildPrompt = useCallback(
    () => `The Science of the Thermos Flask & Cryogenic Insulation — IGCCST 2026:
ROLE: Science educator explaining everyday thermodynamics to students and conference attendees.
TOPIC: How a vacuum flask stops Conduction, Convection, and Radiation.

FLASK DESIGN:
1. Annular Space: ${hasVacuum ? "High Vacuum (Convection Stopped)" : "Air-Filled (Active Convection)"}
2. Mirrored Coating: ${hasSilvering ? "Silver Mirror (Emissivity ε = 0.03)" : "Uncoated Matte (ε = 0.85)"}
3. Neck Stopper: ${neckMaterial.toUpperCase()} (k = ${kNeck} W/m·K)
4. Thermal Gap (ΔT): ${tempDiffK} K
5. Convection Loss: ${qConvectionW} W
6. Radiation Loss: ${qRadiationW} W
7. Neck Conduction Loss: ${qConductionW} W
8. Total Heat Inleak: ${totalHeatW} W
9. Liquid Cryogen Boil-Off: ${lossKgDay} kg/day

EDUCATIONAL QUESTIONS:
1. James Dewar's Invention: Explain how Sir James Dewar invented the silvered vacuum flask in 1892 to keep liquid oxygen and nitrogen cold.
2. Mirror Reflection: Why does a shiny silver mirror block invisible infrared heat waves just like it reflects visible light?
3. The Space Link: How is this exact same three-barrier principle scaled up into multi-layer insulation (MLI) blankets for satellites and space telescopes like JWST?`,
    [hasVacuum, hasSilvering, neckMaterial, kNeck, tempDiffK, qConvectionW, qRadiationW, qConductionW, totalHeatW, lossKgDay]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={200} maxWidth={280} />

      <PillRow>
        <Pill active={hasVacuum} onClick={() => setHasVacuum(!hasVacuum)} color={T.green}>
          {hasVacuum ? "🛡️ Vacuum ON" : "❌ Air-Filled"}
        </Pill>
        <Pill active={hasSilvering} onClick={() => setHasSilvering(!hasSilvering)} color={T.cyan}>
          {hasSilvering ? "🪞 Silver Mirror ON" : "❌ Plain Glass"}
        </Pill>
        <Pill active={neckMaterial === "plastic"} onClick={() => setNeckMaterial("plastic")} color={T.gold}>
          Plastic Neck
        </Pill>
        <Pill active={neckMaterial === "metal"} onClick={() => setNeckMaterial("metal")} color={T.orange}>
          Metal Neck
        </Pill>
      </PillRow>

      <Slider label="Temperature Difference (ΔT)" value={tempDiffK} onChange={setTempDiffK} min={50} max={280} step={10} unit=" K" color={T.orange} />

      <DataRow>
        <DataBox label="Total Leak" value={`${totalHeatW}`} unit="W" color={parseFloat(totalHeatW) < 5 ? T.green : T.red} />
        <DataBox label="Convection" value={`${qConvectionW}`} unit="W" color={hasVacuum ? T.green : T.red} />
        <DataBox label="Radiation" value={`${qRadiationW}`} unit="W" color={hasSilvering ? T.cyan : T.orange} />
        <DataBox label="Boil-Off" value={`${lossKgDay}`} unit="kg/d" color={T.pink} />
      </DataRow>

      <InfoBox color={T.green}>
        <strong style={{ color: T.green }}>The 3 Battles of Cryogenic Insulation:</strong>
        <br />
        1. **Convection (Air currents):** Killed by pumping air out to create a vacuum.
        <br />
        2. **Radiation (Infrared rays):** Reflected back by shiny silver mirrored surfaces.
        <br />
        3. **Conduction (Physical touch):** Minimized using poor heat conductors (plastics, thin glass, G10).
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.green} />

      <ExportBtn
        simId="thermos_flask"
        getData={() => ({
          hasVacuum,
          hasSilvering,
          neckMaterial,
          tempDiffK,
          qConvectionW,
          qRadiationW,
          qConductionW,
          totalHeatW,
          lossKgDay,
        })}
        color={T.green}
      />
    </div>
  );
}
