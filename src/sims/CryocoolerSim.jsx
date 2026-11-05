import { useState, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function CryocoolerSim() {
  const [type, setType] = useState("stirling"); // stirling, pulsetube, gifford
  const [freq, setFreq] = useState(50); // Hz
  const [chargeP, setChargeP] = useState(22); // bar Helium
  const [inputPower, setInputPower] = useState(120); // Watts electrical
  const [tCold, setTCold] = useState(77); // Kelvin target
  const tAmb = 300; // Kelvin

  // Carnot COP and cryogenic efficiency (FOM ~ 8-22% of Carnot)
  const copCarnot = tCold / (tAmb - tCold);
  const fom = type === "stirling" ? 0.18 : type === "pulsetube" ? 0.14 : 0.11;
  const copActual = copCarnot * fom;
  const qCold = (inputPower * copActual).toFixed(2); // Watts cooling
  const specificPower = (inputPower / Math.max(0.1, parseFloat(qCold))).toFixed(1); // W/W

  // Cooldown time approximation (minutes)
  const cooldownMin = Math.max(8, (140 - tCold) * 0.25 * (150 / inputPower)).toFixed(1);

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const canvasTheme = getCanvasTheme();
      const cx = W / 2;
      const cy = H / 2;

      // Deep technical background
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W / 2);
      bg.addColorStop(0, canvasTheme.bgStart);
      bg.addColorStop(1, canvasTheme.bgEnd);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Piston oscillation based on frequency
      const omega = (freq * 0.1) * (frame * 0.1);
      const pistonDisp = Math.sin(omega) * 12;

      // 1. Compressor Cylinder (Left)
      const compX = 55;
      const compY = cy;
      const compW = 40;
      const compH = 70;

      ctx.fillStyle = T.glass;
      ctx.strokeStyle = T.orange;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(compX - compW / 2, compY - compH / 2, compW, compH);

      // Moving Piston
      ctx.fillStyle = "rgba(255, 107, 53, 0.4)";
      ctx.fillRect(compX - compW / 2 + 2, compY - 10 + pistonDisp, compW - 4, 20);
      ctx.strokeStyle = T.orange;
      ctx.strokeRect(compX - compW / 2 + 2, compY - 10 + pistonDisp, compW - 4, 20);

      // Piston rod
      ctx.strokeStyle = T.gray;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(compX, compY - 10 + pistonDisp + 20);
      ctx.lineTo(compX, compY + compH / 2 + 10);
      ctx.stroke();

      ctx.font = `700 7px ${TECH_FONT}`;
      ctx.fillStyle = T.orange;
      ctx.textAlign = "center";
      ctx.fillText("PISTON", compX, compY - compH / 2 - 5);

      // 2. Transfer Line / Split tube
      ctx.strokeStyle = T.cyan;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(compX + compW / 2, compY - 15);
      ctx.lineTo(130, compY - 15);
      ctx.lineTo(130, cy - 45);
      ctx.stroke();

      // 3. Cold Finger / Displacer Column (Center-Right)
      const colX = 175;
      const colY = cy - 45;
      const colW = 34;
      const colH = 100;

      // Cold finger gradient from ambient (top) to cryogenic (bottom)
      const coldGrad = ctx.createLinearGradient(colX, colY, colX, colY + colH);
      coldGrad.addColorStop(0, "rgba(255, 107, 53, 0.3)");
      coldGrad.addColorStop(0.4, "rgba(76, 201, 240, 0.2)");
      coldGrad.addColorStop(1, "rgba(67, 97, 238, 0.6)");

      ctx.fillStyle = coldGrad;
      ctx.strokeStyle = T.glassBorder;
      ctx.lineWidth = 1.5;
      ctx.fillRect(colX - colW / 2, colY, colW, colH);
      ctx.strokeRect(colX - colW / 2, colY, colW, colH);

      // Regenerator Mesh pattern inside
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 0.5;
      for (let y = colY + 10; y < colY + colH - 15; y += 4) {
        ctx.beginPath();
        ctx.moveTo(colX - colW / 2 + 3, y);
        ctx.lineTo(colX + colW / 2 - 3, y);
        ctx.stroke();
      }

      ctx.fillStyle = T.gray;
      ctx.font = `700 6px ${TECH_FONT}`;
      ctx.fillText("REGENERATOR", colX, colY + 45);

      // Cold Tip (Bottom end)
      const tipY = colY + colH;
      ctx.fillStyle = T.accent;
      ctx.beginPath();
      ctx.arc(colX, tipY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Frost particle sparkles at cold tip
      const frostAlpha = Math.max(0.2, (150 - tCold) / 130);
      ctx.fillStyle = `rgba(255, 255, 255, ${frostAlpha})`;
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2 + frame * 0.05;
        const dist = 12 + Math.sin(frame * 0.2 + i) * 3;
        ctx.beginPath();
        ctx.arc(colX + Math.cos(ang) * dist, tipY + Math.sin(ang) * dist, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cold tip temperature HUD
      ctx.font = `800 10px ${MONO_FONT}`;
      ctx.fillStyle = T.accent;
      ctx.textAlign = "left";
      ctx.fillText(`${tCold} K`, colX + 16, tipY + 4);

      // Gas pressure wave animation (pulsing wave in connection line)
      const waveOffset = (frame * 3) % 20;
      ctx.fillStyle = T.cyan;
      ctx.beginPath();
      ctx.arc(80 + waveOffset * 2, compY - 15, 2, 0, Math.PI * 2);
      ctx.fill();

      // Labels
      ctx.font = `700 8px ${TECH_FONT}`;
      ctx.fillStyle = T.dimText;
      ctx.textAlign = "left";
      ctx.fillText(`${type.toUpperCase()} CRYOCOOLER`, 10, 16);
      ctx.fillText(`HE CHARGE: ${chargeP} BAR`, 10, 28);
    },
    [type, freq, chargeP, inputPower, tCold],
    { animate: true }
  );

  const buildPrompt = useCallback(
    () => `Stirling / Pulse Tube Cryocooler Analysis — IGCCST 2026:
ROLE: Leading cryogenic engineer specializing in tactical and space cryocoolers for infrared sensors, superconducting electronics, and quantum computing.
CONFERENCE: Indo-German Conference on Cryogenics for Sustainable Technologies.

PARAMETERS:
1. Architecture: ${type === "stirling" ? "Stirling Free-Piston" : type === "pulsetube" ? "Pulse Tube Cryocooler (PTC)" : "Gifford-McMahon (GM)"}
2. Drive Frequency: ${freq} Hz
3. Mean Helium Charge: ${chargeP} bar
4. Input Electrical Power: ${inputPower} W
5. Cold Tip Operating Temperature: ${tCold} K
6. Carnot Coefficient of Performance: ${copCarnot.toFixed(4)}
7. Actual COP: ${copActual.toFixed(4)}
8. Delivered Cooling Lift: ${qCold} W
9. Specific Power: ${specificPower} W/W
10. Estimated Cooldown Time: ${cooldownMin} min

EXPERT INQUIRY:
1. Regenerator Design: What mesh screens (e.g., stainless steel, phosphor bronze, erbium-nickel ErNi) are optimal across this temperature span?
2. Mechanical vs Pulse Tube: Why do Pulse Tube Cryocoolers offer superior MTBF (>100,000 hours) for space and remote monitoring over kinematic Stirling units?
3. Collaborative R&D: Discuss Indian programs (ISRO, DRDO-SSPL) and German research (Giessen, DLR) advancing tactical linear cryocoolers.`,
    [type, freq, chargeP, inputPower, tCold, copCarnot, copActual, qCold, specificPower, cooldownMin]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={200} maxWidth={280} />

      <PillRow>
        <Pill active={type === "stirling"} onClick={() => setType("stirling")} color={T.orange}>
          Stirling
        </Pill>
        <Pill active={type === "pulsetube"} onClick={() => setType("pulsetube")} color={T.accent}>
          Pulse Tube
        </Pill>
        <Pill active={type === "gifford"} onClick={() => setType("gifford")} color={T.purple}>
          GM Cooler
        </Pill>
      </PillRow>

      <Slider label="Cold Tip Temperature" value={tCold} onChange={setTCold} min={20} max={140} step={2} unit=" K" color={T.accent} />
      <Slider label="Input Electrical Power" value={inputPower} onChange={setInputPower} min={20} max={300} step={5} unit=" W" color={T.orange} />
      <Slider label="Drive Frequency" value={freq} onChange={setFreq} min={25} max={70} step={1} unit=" Hz" color={T.green} />
      <Slider label="Helium Charge Pressure" value={chargeP} onChange={setChargeP} min={10} max={35} step={1} unit=" bar" color={T.gold} />

      <DataRow>
        <DataBox label="Cooling Q_c" value={qCold} unit="W" color={T.green} />
        <DataBox label="Carnot COP" value={copCarnot.toFixed(3)} color={T.accent} />
        <DataBox label="Spec. Power" value={specificPower} unit="W/W" color={T.gold} />
        <DataBox label="Cooldown" value={cooldownMin} unit="min" color={T.cyan} />
      </DataRow>

      <InfoBox color={T.accent}>
        <strong style={{ color: T.accent }}>Regenerative Refrigeration:</strong> Stirling and Pulse Tube coolers compress helium gas at room temperature and expand it in the cold head through a porous matrix regenerator. Specific power (W input per W cooling) escalates rapidly below 80K due to Carnot limitations: COP_Carnot = T_cold / (T_hot - T_cold).
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.accent} />

      <ExportBtn
        simId="cryocooler"
        getData={() => ({
          type,
          tCold,
          inputPower,
          freq,
          chargeP,
          qCold,
          copCarnot: copCarnot.toFixed(4),
          specificPower,
          cooldownMin,
        })}
        color={T.accent}
      />
    </div>
  );
}
