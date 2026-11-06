import { useState, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn, ChallengeBox } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function SuperconductorSim() {
  const [material, setMaterial] = useState("ybco"); // ybco, bscco, mgb2
  const [tempK, setTempK] = useState(65); // Operating temperature in Kelvin
  const [fieldTesla, setFieldTesla] = useState(1.2); // Applied B-field in Tesla
  const [currentDensity, setCurrentDensity] = useState(2500); // A/cm2

  // Material physics constants
  const matData = {
    ybco: { name: "YBCO (YBa2Cu3O7)", tc: 93, bc2: 120, jc0: 25000, color: T.accent },
    bscco: { name: "BSCCO (Bi-2223)", tc: 110, bc2: 100, jc0: 18000, color: T.purple },
    mgb2: { name: "Magnesium Diboride (MgB2)", tc: 39, bc2: 40, jc0: 30000, color: T.gold },
  }[material];

  // Superconducting status: T < Tc, B < Bc2(T), J < Jc(T,B)
  const isTempSafe = tempK < matData.tc;
  // Critical field Bc2(T) = Bc2(0) * (1 - (T/Tc)^2)
  const bc2T = isTempSafe ? matData.bc2 * (1 - Math.pow(tempK / matData.tc, 2)) : 0;
  const isFieldSafe = isTempSafe && fieldTesla < bc2T;

  // Critical current density Jc(T, B) = Jc0 * (1 - T/Tc) * exp(-B / B0)
  const jc = isFieldSafe ? Math.max(0, matData.jc0 * (1 - tempK / matData.tc) * Math.exp(-fieldTesla / 4.0)) : 0;
  const isCurrentSafe = isFieldSafe && currentDensity < jc;

  // Is fully superconducting?
  const isSuperconducting = isTempSafe && isFieldSafe && isCurrentSafe;

  // Levitation height / gap in mm (Meissner flux exclusion)
  // Higher B and Jc gives higher repulsive force
  const levitationGapMm = isSuperconducting
    ? Math.min(22, Math.max(2, (1 - tempK / matData.tc) * fieldTesla * 12)).toFixed(1)
    : "0.0";

  // Repulsive levitation force (Newtons for 50mm disc)
  const levForceN = isSuperconducting ? (fieldTesla * fieldTesla * 2.5 * (1 - tempK / matData.tc)).toFixed(1) : "0.0";

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

      // Superconductor Disc (Base, inside liquid cryogen tray)
      const scX = cx;
      const scY = cy + 30;
      const scW = 90;
      const scH = 22;

      // Cryogen container
      ctx.fillStyle = "rgba(76, 201, 240, 0.15)";
      ctx.strokeStyle = T.glassBorder;
      ctx.lineWidth = 1;
      ctx.fillRect(scX - scW / 2 - 12, scY - 8, scW + 24, scH + 20);
      ctx.strokeRect(scX - scW / 2 - 12, scY - 8, scW + 24, scH + 20);

      // Superconductor Puck
      const scColor = isSuperconducting ? matData.color : T.red;
      ctx.fillStyle = isSuperconducting ? "rgba(67, 97, 238, 0.5)" : "rgba(255, 77, 109, 0.3)";
      ctx.strokeStyle = scColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(scX - scW / 2, scY, scW, scH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = T.white;
      ctx.font = `800 7px ${TECH_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText(material.toUpperCase(), scX, scY + 14);

      // Liquid nitrogen vapor/frost bubbling
      if (tempK < 78) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        for (let i = 0; i < 6; i++) {
          const vx = scX - scW / 2 + (i * 18) + Math.sin(frame * 0.1 + i) * 3;
          const vy = scY - 5 - ((frame * 1.5 + i * 8) % 20);
          ctx.beginPath();
          ctx.arc(vx, vy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Permanent Magnet (Floating above SC disc)
      const gapPx = parseFloat(levitationGapMm) * 3;
      const magY = isSuperconducting ? scY - 20 - gapPx : scY - 14;
      const magW = 50;
      const magH = 16;

      // Magnet North / South poles
      ctx.fillStyle = T.red;
      ctx.fillRect(scX - magW / 2, magY - magH / 2, magW / 2, magH);
      ctx.fillStyle = T.accent;
      ctx.fillRect(scX, magY - magH / 2, magW / 2, magH);

      ctx.strokeStyle = T.white;
      ctx.lineWidth = 1;
      ctx.strokeRect(scX - magW / 2, magY - magH / 2, magW, magH);

      ctx.fillStyle = T.white;
      ctx.font = `800 7px ${MONO_FONT}`;
      ctx.fillText("N", scX - magW / 4, magY + 3);
      ctx.fillText("S", scX + magW / 4, magY + 3);

      // Magnetic field lines (Meissner effect expulsion when superconducting)
      ctx.strokeStyle = isSuperconducting ? "rgba(77, 255, 184, 0.5)" : "rgba(255, 77, 109, 0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 2]);

      for (let offset of [-20, -10, 10, 20]) {
        ctx.beginPath();
        if (isSuperconducting) {
          // Field lines bend around the SC disc (flux exclusion)
          ctx.moveTo(scX + offset, magY - magH / 2);
          ctx.bezierCurveTo(
            scX + offset * 2.2, magY - 30,
            scX + offset * 2.8, scY + 30,
            scX + offset * 1.5, scY + scH + 10
          );
        } else {
          // Field penetrates the normal material
          ctx.moveTo(scX + offset, magY - magH / 2);
          ctx.lineTo(scX + offset, scY + scH + 10);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Status HUD
      ctx.font = `800 9px ${TECH_FONT}`;
      ctx.textAlign = "left";
      ctx.fillStyle = isSuperconducting ? T.green : T.red;
      ctx.fillText(isSuperconducting ? `● MEISSNER STATE (LEV: ${levitationGapMm}mm)` : `▲ NORMAL STATE (RESISTIVE)`, 10, 18);

      ctx.font = `700 8px ${MONO_FONT}`;
      ctx.fillStyle = T.dimText;
      ctx.fillText(`Tc: ${matData.tc} K | Bc2: ${bc2T.toFixed(0)} T`, 10, 30);
    },
    [material, tempK, fieldTesla, currentDensity, isSuperconducting, levitationGapMm, matData, bc2T],
    { animate: true }
  );

  const buildPrompt = useCallback(
    () => `Superconducting Magnetic Levitation & Cooling — IGCCST 2026:
ROLE: Principal Investigator in applied superconductivity and cryogenic magnet systems.
CONFERENCE: Indo-German Conference on Cryogenics for Sustainable Technologies, IIT Kharagpur.

OPERATIONAL PARAMETERS:
1. Superconductor: ${matData.name}
2. Critical Temperature (Tc): ${matData.tc} K
3. Operating Temperature: ${tempK} K (${(tempK / matData.tc * 100).toFixed(0)}% of Tc)
4. Applied B-Field: ${fieldTesla} T (Upper Critical Field Bc2: ${bc2T.toFixed(1)} T)
5. Operating Current Density: ${currentDensity} A/cm² (Critical Jc: ${jc.toFixed(0)} A/cm²)
6. State: ${isSuperconducting ? "SUPERCONDUCTING (Zero DC Resistance)" : "NORMAL CONDUCTING"}
7. Levitation Height: ${levitationGapMm} mm
8. Levitation Force: ${levForceN} N

EXPERT INQUIRY:
1. Meissner vs Flux Pinning: Why is type-II flux pinning (vortex lattice locking) necessary for stable levitation and lateral stability, contrasting with pure diamagnetic Meissner expulsion?
2. Thermal Stability & Quench Protection: What happens during a thermal quench (runaway normal-zone propagation)? How do copper or aluminum stabilizer jackets protect the tape/wire?
3. Collaborative Frontiers: Highlight Indo-German high-field magnet research (e.g., FAIR accelerator facility at GSI Darmstadt and DAE/DST India consortium).`,
    [matData, tempK, fieldTesla, currentDensity, isSuperconducting, levitationGapMm, levForceN, bc2T, jc]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={200} maxWidth={280} />

      <ChallengeBox
        title="Meissner Levitation Challenge"
        goal="Cool YBCO below 93 K to achieve zero electrical resistance and lock into quantum levitation!"
        isCompleted={isSuperconducting && parseFloat(levitationGapMm) > 5}
        hint="Keep temperature below Tc (93 K) and applied field below critical Bc2 (120 T)."
        color={T.accent}
      />

      <PillRow>
        <Pill active={material === "ybco"} onClick={() => setMaterial("ybco")} color={T.accent}>
          YBCO (93K)
        </Pill>
        <Pill active={material === "bscco"} onClick={() => setMaterial("bscco")} color={T.purple}>
          BSCCO (110K)
        </Pill>
        <Pill active={material === "mgb2"} onClick={() => setMaterial("mgb2")} color={T.gold}>
          MgB2 (39K)
        </Pill>
      </PillRow>

      <Slider label="Operating Temperature" value={tempK} onChange={setTempK} min={4} max={120} step={1} unit=" K" color={tempK < matData.tc ? T.accent : T.red} />
      <Slider label="Applied Magnetic Field" value={fieldTesla} onChange={setFieldTesla} min={0.1} max={5.0} step={0.1} unit=" T" color={T.green} />
      <Slider label="Transport Current Density" value={currentDensity} onChange={setCurrentDensity} min={100} max={10000} step={100} unit=" A/cm²" color={T.orange} />

      <DataRow>
        <DataBox label="State" value={isSuperconducting ? "SC" : "NORMAL"} color={isSuperconducting ? T.green : T.red} />
        <DataBox label="Lev. Gap" value={levitationGapMm} unit="mm" color={T.cyan} />
        <DataBox label="Force" value={levForceN} unit="N" color={T.accent} />
        <DataBox label="J_c" value={jc.toFixed(0)} unit="A/cm²" color={T.gold} />
      </DataRow>

      <InfoBox color={matData.color}>
        <strong style={{ color: matData.color }}>Superconductivity & Flux Pinning:</strong> Below Tc and Bc2, Type-II superconductors completely expel magnetic fields (Meissner effect) and pin magnetic flux lines in defect nano-centers. This provides passive, self-stabilizing levitation for frictionless bearings and MagLev trains.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={matData.color} />

      <ExportBtn
        simId="superconductor"
        getData={() => ({
          material,
          tempK,
          fieldTesla,
          currentDensity,
          isSuperconducting,
          levitationGapMm,
          levForceN,
          jc: jc.toFixed(0),
        })}
        color={matData.color}
      />
    </div>
  );
}
