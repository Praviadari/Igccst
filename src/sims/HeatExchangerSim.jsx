import { useState, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function HeatExchangerSim() {
  const [flowConfig, setFlowConfig] = useState("counter"); // counter, parallel, cross
  const [fluid, setFluid] = useState("nitrogen"); // nitrogen, helium, hydrogen
  const [tHotIn, setTHotIn] = useState(295); // K
  const [tColdIn, setTColdIn] = useState(80); // K
  const [mHot, setMHot] = useState(1.0); // kg/s
  const [mCold, setMCold] = useState(1.1); // kg/s
  const [ntu, setNtu] = useState(8); // Number of Transfer Units

  // Specific heats approx (kJ/kg·K)
  const cp = {
    nitrogen: 1.04,
    helium: 5.19,
    hydrogen: 14.3,
  }[fluid];

  const cHot = mHot * cp; // kW/K
  const cCold = mCold * cp;
  const cMin = Math.min(cHot, cCold);
  const cMax = Math.max(cHot, cCold);
  const cr = cMin / cMax;

  // Effectiveness calculation based on configuration
  let eff = 0;
  if (flowConfig === "counter") {
    if (cr === 1) {
      eff = ntu / (1 + ntu);
    } else {
      const expTerm = Math.exp(-ntu * (1 - cr));
      eff = (1 - expTerm) / (1 - cr * expTerm);
    }
  } else if (flowConfig === "parallel") {
    eff = (1 - Math.exp(-ntu * (1 + cr))) / (1 + cr);
  } else {
    // Cross-flow unmixed
    eff = 1 - Math.exp((1 / cr) * Math.pow(ntu, 0.22) * (Math.exp(-cr * Math.pow(ntu, 0.78)) - 1));
  }
  eff = Math.min(0.99, Math.max(0.1, eff));

  // Heat duty Q = eff * C_min * (T_hot_in - T_cold_in)
  const qDutyKW = eff * cMin * (tHotIn - tColdIn);
  const tHotOut = tHotIn - qDutyKW / cHot;
  const tColdOut = tColdIn + qDutyKW / cCold;

  // Log Mean Temperature Difference (LMTD)
  const dt1 = flowConfig === "counter" ? tHotIn - tColdOut : tHotIn - tColdIn;
  const dt2 = flowConfig === "counter" ? tHotOut - tColdIn : tHotOut - tColdOut;
  const lmtd = Math.abs(dt1 - dt2) > 0.1 ? (dt1 - dt2) / Math.log(Math.max(0.01, dt1 / Math.max(0.01, dt2))) : dt1;

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

      // Plate-Fin Heat Exchanger Core Box
      const hxX = 35;
      const hxY = 45;
      const hxW = W - 70;
      const hxH = 95;

      ctx.fillStyle = T.glass;
      ctx.strokeStyle = T.glassBorder;
      ctx.lineWidth = 1.5;
      ctx.fillRect(hxX, hxY, hxW, hxH);
      ctx.strokeRect(hxX, hxY, hxW, hxH);

      // Fin Corrugation Pattern
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      for (let x = hxX + 10; x < hxX + hxW; x += 12) {
        ctx.beginPath();
        ctx.moveTo(x, hxY);
        ctx.lineTo(x + 6, hxY + hxH);
        ctx.stroke();
      }

      // Hot Stream Channel (Top)
      const hotY = hxY + 22;
      const hotGrad = ctx.createLinearGradient(hxX, 0, hxX + hxW, 0);
      hotGrad.addColorStop(0, "rgba(255, 77, 109, 0.8)");
      hotGrad.addColorStop(1, flowConfig === "counter" ? "rgba(248, 150, 30, 0.7)" : "rgba(76, 201, 240, 0.6)");
      ctx.strokeStyle = hotGrad;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(hxX - 15, hotY);
      ctx.lineTo(hxX + hxW + 15, hotY);
      ctx.stroke();

      // Cold Stream Channel (Bottom)
      const coldY = hxY + hxH - 22;
      const coldGrad = ctx.createLinearGradient(hxX, 0, hxX + hxW, 0);
      if (flowConfig === "counter") {
        coldGrad.addColorStop(0, "rgba(67, 97, 238, 0.8)");
        coldGrad.addColorStop(1, "rgba(77, 255, 184, 0.8)");
      } else {
        coldGrad.addColorStop(0, "rgba(77, 255, 184, 0.8)");
        coldGrad.addColorStop(1, "rgba(67, 97, 238, 0.8)");
      }
      ctx.strokeStyle = coldGrad;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(hxX - 15, coldY);
      ctx.lineTo(hxX + hxW + 15, coldY);
      ctx.stroke();

      // Animated Particles in Hot Stream (Left to Right)
      const hotOffset = (frame * 2.5) % hxW;
      ctx.fillStyle = T.red;
      ctx.beginPath();
      ctx.arc(hxX + hotOffset, hotY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Animated Particles in Cold Stream (Right to Left for counter, Left to Right for parallel)
      const coldOffset = flowConfig === "counter"
        ? hxW - ((frame * 2.5) % hxW)
        : (frame * 2.5) % hxW;
      ctx.fillStyle = T.cyan;
      ctx.beginPath();
      ctx.arc(hxX + coldOffset, coldY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Heat transfer arrows between hot and cold channels
      ctx.strokeStyle = "rgba(248, 150, 30, 0.5)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 5; i++) {
        const ax = hxX + (hxW / 6) * i;
        ctx.beginPath();
        ctx.moveTo(ax, hotY + 5);
        ctx.lineTo(ax, coldY - 5);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(ax - 2, coldY - 8);
        ctx.lineTo(ax, coldY - 4);
        ctx.lineTo(ax + 2, coldY - 8);
        ctx.stroke();
      }

      // Stream Temperature Labels
      ctx.font = `800 8px ${MONO_FONT}`;
      ctx.textAlign = "left";
      ctx.fillStyle = T.red;
      ctx.fillText(`T_h,in: ${tHotIn}K`, 6, hotY - 8);

      ctx.textAlign = "right";
      ctx.fillStyle = T.orange;
      ctx.fillText(`T_h,out: ${tHotOut.toFixed(0)}K`, W - 6, hotY - 8);

      ctx.textAlign = flowConfig === "counter" ? "right" : "left";
      ctx.fillStyle = T.cyan;
      const coldInX = flowConfig === "counter" ? W - 6 : 6;
      ctx.fillText(`T_c,in: ${tColdIn}K`, coldInX, coldY + 16);

      ctx.textAlign = flowConfig === "counter" ? "left" : "right";
      ctx.fillStyle = T.green;
      const coldOutX = flowConfig === "counter" ? 6 : W - 6;
      ctx.fillText(`T_c,out: ${tColdOut.toFixed(0)}K`, coldOutX, coldY + 16);

      // NTU & Effectiveness badge
      ctx.font = `800 9px ${TECH_FONT}`;
      ctx.fillStyle = T.accent;
      ctx.textAlign = "center";
      ctx.fillText(`PFHX CORE | NTU: ${ntu} | ε: ${(eff * 100).toFixed(1)}%`, cx, H - 12);
    },
    [flowConfig, fluid, tHotIn, tColdIn, mHot, mCold, ntu, eff, tHotOut, tColdOut],
    { animate: true }
  );

  const buildPrompt = useCallback(
    () => `Cryogenic Plate-Fin Heat Exchanger (PFHX) Performance Analysis — IGCCST 2026:
ROLE: Leading heat transfer specialist in multi-stream cryogenic brazed aluminium heat exchangers (BAHX).
CONFERENCE: Indo-German Conference on Cryogenics for Sustainable Technologies.

DESIGN PARAMETERS:
1. Flow Arrangement: ${flowConfig.toUpperCase()}-FLOW
2. Working Medium: ${fluid.toUpperCase()}
3. Hot Inlet Temp: ${tHotIn} K | Hot Outlet: ${tHotOut.toFixed(1)} K
4. Cold Inlet Temp: ${tColdIn} K | Cold Outlet: ${tColdOut.toFixed(1)} K
5. Hot Mass Flow: ${mHot} kg/s | Cold Mass Flow: ${mCold} kg/s
6. Heat Capacity Ratio (Cr): ${cr.toFixed(3)}
7. NTU: ${ntu}
8. Heat Exchanger Effectiveness (ε): ${(eff * 100).toFixed(1)}%
9. Thermal Duty: ${qDutyKW.toFixed(1)} kW
10. Log-Mean Temperature Difference (LMTD): ${lmtd.toFixed(1)} K

THERMODYNAMIC ASSESSMENT:
1. Pinch Point & Second Law: In cryogenic liquefaction, why does a tiny temperature pinch (ΔT_pinch < 2K) dramatically reduce compressor work?
2. Flow Configuration Penalty: Compare counter-flow with parallel and cross-flow in terms of thermodynamic irreversibility (entropy generation rate S_gen).
3. Manufacturing & Reliability: Discuss vacuum brazing of aluminum serrated/perforated fins, thermal stress during rapid cooldown, and Indo-German standardization.`,
    [flowConfig, fluid, tHotIn, tHotOut, tColdIn, tColdOut, mHot, mCold, cr, ntu, eff, qDutyKW, lmtd]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={200} maxWidth={280} />

      <PillRow>
        <Pill active={flowConfig === "counter"} onClick={() => setFlowConfig("counter")} color={T.green}>
          Counter-Flow
        </Pill>
        <Pill active={flowConfig === "parallel"} onClick={() => setFlowConfig("parallel")} color={T.orange}>
          Parallel-Flow
        </Pill>
        <Pill active={flowConfig === "cross"} onClick={() => setFlowConfig("cross")} color={T.purple}>
          Cross-Flow
        </Pill>
      </PillRow>

      <Slider label="NTU (Heat Transfer Units)" value={ntu} onChange={setNtu} min={1} max={20} step={1} unit="" color={T.accent} />
      <Slider label="Hot Stream Inlet T" value={tHotIn} onChange={setTHotIn} min={150} max={350} step={5} unit=" K" color={T.red} />
      <Slider label="Cold Stream Inlet T" value={tColdIn} onChange={setTColdIn} min={20} max={180} step={5} unit=" K" color={T.cyan} />
      <Slider label="Hot Flow Rate" value={mHot} onChange={setMHot} min={0.2} max={3.0} step={0.1} unit=" kg/s" color={T.gold} />

      <DataRow>
        <DataBox label="Effectiveness" value={`${(eff * 100).toFixed(0)}%`} color={T.green} />
        <DataBox label="Q Duty" value={qDutyKW.toFixed(0)} unit="kW" color={T.orange} />
        <DataBox label="T_h,out" value={tHotOut.toFixed(0)} unit="K" color={T.gold} />
        <DataBox label="LMTD" value={lmtd.toFixed(1)} unit="K" color={T.accent} />
      </DataRow>

      <InfoBox color={T.accent}>
        <strong style={{ color: T.accent }}>Cryogenic PFHX Exergy:</strong> Cryogenic plants require heat exchangers with effectiveness &gt; 95% (NTU &gt; 10). Counter-flow arrangements allow the cold stream outlet temperature to exceed the hot stream outlet temperature, minimizing exergy destruction.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.accent} />

      <ExportBtn
        simId="heat_exchanger"
        getData={() => ({
          flowConfig,
          fluid,
          ntu,
          tHotIn,
          tColdIn,
          mHot,
          mCold,
          eff: (eff * 100).toFixed(1),
          qDutyKW: qDutyKW.toFixed(1),
          tHotOut: tHotOut.toFixed(1),
          tColdOut: tColdOut.toFixed(1),
          lmtd: lmtd.toFixed(1),
        })}
        color={T.accent}
      />
    </div>
  );
}
