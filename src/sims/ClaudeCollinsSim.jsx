import { useState, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function ClaudeCollinsSim() {
  const [pCompressor, setPCompressor] = useState(16); // bar
  const [stages, setStages] = useState(2); // 1, 2, or 3 expansion engines
  const [expEff, setExpEff] = useState(0.75); // Isentropic efficiency
  const [ln2Precool, setLn2Precool] = useState(true); // Liquid nitrogen precooling (80K)
  const [mFlowGS, setMFlowGS] = useState(50); // Helium mass flow in g/s

  // Claude-Collins Cycle Physics
  // Work extracted by expanders: W_exp = m * cp * T_in * [1 - (P_out/P_in)^((gamma-1)/gamma)] * eta
  // Helium: gamma = 1.667, (gamma-1)/gamma = 0.400, cp = 5.193 kJ/kg·K
  const gammaExp = 0.4;
  const pr = pCompressor / 1.1; // Pressure ratio

  // Precooling temperature entering turbo-expanders
  const tHx1 = ln2Precool ? 78 : 160; // K
  // Temperature drop across expander stage 1
  const dtExp1 = tHx1 * (1 - Math.pow(1 / pr, gammaExp)) * expEff;
  const tOutExp1 = Math.max(25, tHx1 - dtExp1);

  // Expander stage 2 (if present)
  const tInExp2 = stages >= 2 ? tOutExp1 : tHx1;
  const dtExp2 = stages >= 2 ? tInExp2 * (1 - Math.pow(1 / pr, gammaExp)) * expEff * 0.7 : 0;
  const tOutExp2 = stages >= 2 ? Math.max(10, tInExp2 - dtExp2) : tInExp2;

  // Final temperature reaching JT valve
  const tJtIn = stages === 3 ? 9.5 : stages === 2 ? 14.5 : 28.0;

  // Helium liquefaction yield (%)
  // He inversion temperature at 16 bar is ~42K. Below 15K, JT expansion yields high liquid fraction.
  const baseYield = (stages * 0.045) + (ln2Precool ? 0.05 : 0.0) + ((expEff - 0.5) * 0.08);
  const yieldPct = Math.min(22, Math.max(2, baseYield * 100)).toFixed(1);

  // Liquid Helium output rate in Liters/hr (density LHe = 125 g/L)
  const lheLHr = ((mFlowGS * (parseFloat(yieldPct) / 100) * 3600) / 125).toFixed(1);

  // Specific energy consumption (kWh per liter of LHe)
  // Industrial baseline: ~ 0.8 - 1.8 kWh / L
  const secKWhL = Math.max(0.7, (2.4 - stages * 0.45 - (ln2Precool ? 0.35 : 0)) / (expEff / 0.7)).toFixed(2);

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

      // 1. Compressor (Top Left)
      const compX = 35;
      const compY = 40;
      ctx.fillStyle = T.glass;
      ctx.strokeStyle = T.orange;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(compX, compY, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = T.orange;
      ctx.font = `800 6px ${TECH_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText("COMP", compX, compY + 2);

      // High-pressure line down to Heat Exchanger chain
      ctx.strokeStyle = T.red;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(compX + 15, compY);
      ctx.lineTo(85, compY);
      ctx.stroke();

      // 2. Heat Exchanger Cascade (Vertical Stack)
      const hxX = 90;
      const hxW = 34;

      // HX1 (LN2 Precooling Stage)
      const hx1Y = 30;
      const hx1H = 35;
      ctx.fillStyle = ln2Precool ? "rgba(76, 201, 240, 0.3)" : "rgba(255, 107, 53, 0.2)";
      ctx.strokeStyle = ln2Precool ? T.accent : T.glassBorder;
      ctx.strokeRect(hxX, hx1Y, hxW, hx1H);
      ctx.fillRect(hxX, hx1Y, hxW, hx1H);
      ctx.fillStyle = T.white;
      ctx.font = `700 6px ${TECH_FONT}`;
      ctx.fillText(ln2Precool ? "LN2 HX" : "HX-1", hxX + hxW / 2, hx1Y + 18);

      // HX2
      const hx2Y = hx1Y + hx1H + 15;
      const hx2H = 35;
      ctx.fillStyle = "rgba(76, 201, 240, 0.25)";
      ctx.strokeStyle = T.glassBorder;
      ctx.strokeRect(hxX, hx2Y, hxW, hx2H);
      ctx.fillRect(hxX, hx2Y, hxW, hx2H);
      ctx.fillStyle = T.white;
      ctx.fillText("HX-2", hxX + hxW / 2, hx2Y + 18);

      // HX3
      const hx3Y = hx2Y + hx2H + 15;
      const hx3H = 35;
      ctx.fillStyle = "rgba(67, 97, 238, 0.35)";
      ctx.strokeStyle = T.accentDark;
      ctx.strokeRect(hxX, hx3Y, hxW, hx3H);
      ctx.fillRect(hxX, hx3Y, hxW, hx3H);
      ctx.fillStyle = T.white;
      ctx.fillText("HX-3", hxX + hxW / 2, hx3Y + 18);

      // 3. Turbo-Expanders (Right of HX stack)
      const expX = 160;

      // Expander 1
      const exp1Y = hx1Y + hx1H + 6;
      ctx.fillStyle = T.glass;
      ctx.strokeStyle = T.green;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(expX, exp1Y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Spinning rotor symbol
      const rAng = (frame * 0.15);
      ctx.strokeStyle = T.green;
      ctx.beginPath();
      ctx.moveTo(expX - Math.cos(rAng) * 8, exp1Y - Math.sin(rAng) * 8);
      ctx.lineTo(expX + Math.cos(rAng) * 8, exp1Y + Math.sin(rAng) * 8);
      ctx.stroke();

      ctx.fillStyle = T.green;
      ctx.font = `800 6px ${TECH_FONT}`;
      ctx.fillText("E-1", expX, exp1Y - 14);

      // Expander 2 (if active)
      if (stages >= 2) {
        const exp2Y = hx2Y + hx2H + 6;
        ctx.fillStyle = T.glass;
        ctx.strokeStyle = T.green;
        ctx.beginPath();
        ctx.arc(expX, exp2Y, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = T.green;
        ctx.beginPath();
        ctx.moveTo(expX - Math.cos(rAng + 1) * 8, exp2Y - Math.sin(rAng + 1) * 8);
        ctx.lineTo(expX + Math.cos(rAng + 1) * 8, exp2Y + Math.sin(rAng + 1) * 8);
        ctx.stroke();

        ctx.fillStyle = T.green;
        ctx.fillText("E-2", expX, exp2Y - 14);
      }

      // 4. J-T Valve & LHe Receiver at Bottom
      const jtX = hxX + hxW / 2;
      const jtY = hx3Y + hx3H + 12;
      ctx.fillStyle = T.gold;
      ctx.beginPath();
      ctx.moveTo(jtX - 8, jtY - 5);
      ctx.lineTo(jtX + 8, jtY - 5);
      ctx.lineTo(jtX, jtY + 6);
      ctx.closePath();
      ctx.fill();

      // LHe Vessel
      const dewarX = 220;
      const dewarY = H - 35;
      ctx.fillStyle = T.glass;
      ctx.strokeStyle = T.gold;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(dewarX - 25, dewarY - 18, 50, 32);
      ctx.fillRect(dewarX - 25, dewarY - 18, 50, 32);

      // Liquid Helium pool (4.2 K)
      ctx.fillStyle = "rgba(248, 150, 30, 0.4)";
      ctx.fillRect(dewarX - 23, dewarY + 2, 46, 10);
      ctx.fillStyle = T.gold;
      ctx.font = `800 7px ${MONO_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText("LHe 4.2K", dewarX, dewarY + 8);

      // Connecting lines to Dewar
      ctx.strokeStyle = T.cyan;
      ctx.beginPath();
      ctx.moveTo(jtX, jtY + 6);
      ctx.lineTo(jtX, dewarY);
      ctx.lineTo(dewarX - 25, dewarY);
      ctx.stroke();

      // Diagnostics HUD
      ctx.font = `800 8px ${TECH_FONT}`;
      ctx.textAlign = "left";
      ctx.fillStyle = T.gold;
      ctx.fillText(`CLAUDE-COLLINS HELIUM LIQUEFIER`, 10, 16);
      ctx.fillStyle = T.accent;
      ctx.fillText(`P_high: ${pCompressor} bar | JT In: ${tJtIn} K`, 10, 26);
    },
    [pCompressor, stages, expEff, ln2Precool, mFlowGS, tJtIn],
    { animate: true }
  );

  const buildPrompt = useCallback(
    () => `Claude-Collins Helium Liquefier Thermodynamic Analysis — IGCCST 2026:
ROLE: Helium cryogenics lead engineer (CERN/DESY accelerator cryogenics and RRCAT Indore collaborator).
CONFERENCE: Indo-German Conference on Cryogenics for Sustainable Technologies.

PLANT OPERATING STATE:
1. Cycle Architecture: Claude-Collins with ${stages} Turbo-Expander Stage(s)
2. Compressor Delivery Pressure: ${pCompressor} bar
3. Expander Isentropic Efficiency: ${(expEff * 100).toFixed(0)}%
4. Liquid Nitrogen Precooling (80K Stage): ${ln2Precool ? "ACTIVE (LN2 Bath)" : "NONE (Pure He compression)"}
5. Helium Feed Mass Flow: ${mFlowGS} g/s
6. Temperature at JT Inlet: ${tJtIn} K
7. Liquefaction Fraction: ${yieldPct}%
8. Liquid Helium Production: ${lheLHr} L/hr
9. Specific Energy Consumption: ${secKWhL} kWh / Liter LHe

DEEP TECHNICAL INQUIRY:
1. Expansion Engines vs Pure Throttle: Why is it thermodynamically impossible to liquefy helium from ambient temperature using solely Joule-Thomson expansion (maximum inversion temperature T_inv = 45K)?
2. Isentropic Work Recovery: How does the enthalpy extraction (Δh = cp * ΔT) by dynamic gas-bearing turbo-expanders shift the cycle toward the ideal Carnot limit?
3. Collaborative Accelerator Cryogenics: Discuss India's DAE-IUAC and German DESY/FAIR 2K and 4.2K superconducting RF cavity helium refrigeration infrastructure.`,
    [stages, pCompressor, expEff, ln2Precool, mFlowGS, tJtIn, yieldPct, lheLHr, secKWhL]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={200} maxWidth={280} />

      <PillRow>
        <Pill active={stages === 1} onClick={() => setStages(1)} color={T.cyan}>
          1 Expander
        </Pill>
        <Pill active={stages === 2} onClick={() => setStages(2)} color={T.green}>
          2 Expanders
        </Pill>
        <Pill active={stages === 3} onClick={() => setStages(3)} color={T.purple}>
          3 Expanders
        </Pill>
        <Pill active={ln2Precool} onClick={() => setLn2Precool(!ln2Precool)} color={T.accent}>
          {ln2Precool ? "❄ LN2 Precooling ON" : "Precooling OFF"}
        </Pill>
      </PillRow>

      <Slider label="Cycle Pressure (High)" value={pCompressor} onChange={setPCompressor} min={10} max={25} step={1} unit=" bar" color={T.orange} />
      <Slider label="Expander Efficiency" value={expEff} onChange={setExpEff} min={0.55} max={0.88} step={0.01} unit="" color={T.green} />
      <Slider label="Helium Mass Flow" value={mFlowGS} onChange={setMFlowGS} min={10} max={150} step={5} unit=" g/s" color={T.gold} />

      <DataRow>
        <DataBox label="LHe Yield" value={`${yieldPct}%`} color={T.gold} />
        <DataBox label="Production" value={lheLHr} unit="L/h" color={T.accent} />
        <DataBox label="JT Inlet" value={`${tJtIn}K`} color={T.cyan} />
        <DataBox label="SEC" value={secKWhL} unit="kWh/L" color={T.green} />
      </DataRow>

      <InfoBox color={T.gold}>
        <strong style={{ color: T.gold }}>Claude-Collins Cycle:</strong> Helium has an inversion temperature of only 45 K. The Collins cycle incorporates high-speed turbo-expanders (spinning at up to 250,000 RPM on helium gas bearings) to extract mechanical work and cool the stream to &lt; 15 K before final JT expansion to liquid at 4.2 K.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.gold} />

      <ExportBtn
        simId="claude_collins"
        getData={() => ({
          stages,
          pCompressor,
          expEff,
          ln2Precool,
          mFlowGS,
          tJtIn,
          yieldPct,
          lheLHr,
          secKWhL,
        })}
        color={T.gold}
      />
    </div>
  );
}
