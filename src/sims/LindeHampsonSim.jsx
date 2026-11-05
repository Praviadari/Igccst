import { useState, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme, prng } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function LindeHampsonSim() {
  const [gas, setGas] = useState("nitrogen"); // nitrogen, hydrogen, helium
  const [pIn, setPIn] = useState(150); // atm
  const [pOut, setPOut] = useState(1.2); // atm
  const [tIn, setTIn] = useState(295); // K
  const [hxEff, setHxEff] = useState(0.92);

  // Gas properties
  const gasProps = {
    nitrogen: { name: "Nitrogen (N2)", tInv: 621, tBoil: 77.36, muJT: 0.24, cp: 1.04, rhoLiq: 0.808, hfg: 199.1, color: T.accent },
    hydrogen: { name: "Hydrogen (H2)", tInv: 202, tBoil: 20.28, muJT: -0.03, cp: 14.3, rhoLiq: 0.071, hfg: 445.6, color: T.pink },
    helium: { name: "Helium (He)", tInv: 45, tBoil: 4.22, muJT: -0.06, cp: 5.19, rhoLiq: 0.125, hfg: 20.9, color: T.gold },
  }[gas];

  const dp = Math.max(0, pIn - pOut);
  // Real JT coefficient depends on T relative to T_inversion
  const belowInversion = tIn < gasProps.tInv;
  const effectiveMu = belowInversion ? gasProps.muJT : -Math.abs(gasProps.muJT);
  const deltaT = effectiveMu * dp * hxEff;
  const tCold = Math.max(gasProps.tBoil, tIn - Math.abs(deltaT));

  // Yield fraction y = (h1 - h2)/(h1 - h_liq)
  const canLiquefy = belowInversion && effectiveMu > 0 && pIn > 30;
  const rawYield = canLiquefy ? Math.min(0.22, Math.max(0, ((pIn - 20) / 200) * 0.16 * hxEff)) : 0;
  const yieldPct = (rawYield * 100).toFixed(1);
  const compPowerKW = ((pIn / pOut) * 0.18 * (pIn / 100)).toFixed(1);
  const liquidOutLHr = (rawYield * 120 * (pIn / 100)).toFixed(1);
  const cop = canLiquefy && parseFloat(compPowerKW) > 0 ? (rawYield * 3.5 / (parseFloat(compPowerKW) * 0.1 + 0.1)).toFixed(2) : "0.00";

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

      // Schematic Layout
      // Compressor (Left)
      const compX = 40;
      const compY = 80;
      ctx.fillStyle = T.glass;
      ctx.strokeStyle = T.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(compX, compY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = T.orange;
      ctx.font = `800 8px ${TECH_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText("COMP", compX, compY + 3);

      // Aftercooler
      ctx.strokeStyle = T.gray;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(compX + 18, compY);
      ctx.lineTo(compX + 45, compY);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 107, 53, 0.2)";
      ctx.strokeRect(compX + 45, compY - 10, 24, 20);
      ctx.fillRect(compX + 45, compY - 10, 24, 20);
      ctx.fillStyle = T.white;
      ctx.font = `700 6px ${MONO_FONT}`;
      ctx.fillText("COOL", compX + 57, compY + 3);

      // Counter-flow Heat Exchanger (Center tall rectangle)
      const hxX = 130;
      const hxY = 40;
      const hxW = 46;
      const hxH = 100;

      const hxGrad = ctx.createLinearGradient(hxX, hxY, hxX, hxY + hxH);
      hxGrad.addColorStop(0, "rgba(255, 77, 109, 0.25)");
      hxGrad.addColorStop(1, "rgba(76, 201, 240, 0.3)");
      ctx.fillStyle = hxGrad;
      ctx.strokeStyle = T.glassBorder;
      ctx.lineWidth = 1;
      ctx.fillRect(hxX, hxY, hxW, hxH);
      ctx.strokeRect(hxX, hxY, hxW, hxH);

      ctx.fillStyle = T.gray;
      ctx.font = `700 7px ${TECH_FONT}`;
      ctx.fillText("HX (PFHX)", hxX + hxW / 2, hxY - 4);

      // Connecting pipe from cooler to HX top
      ctx.strokeStyle = T.red;
      ctx.beginPath();
      ctx.moveTo(compX + 69, compY);
      ctx.lineTo(hxX + 12, compY);
      ctx.lineTo(hxX + 12, hxY);
      ctx.stroke();

      // Flow arrows through HX
      ctx.strokeStyle = T.orange;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(hxX + 12, hxY);
      ctx.lineTo(hxX + 12, hxY + hxH);
      ctx.stroke();

      // Return path through HX
      ctx.strokeStyle = T.cyan;
      ctx.beginPath();
      ctx.moveTo(hxX + 34, hxY + hxH);
      ctx.lineTo(hxX + 34, hxY);
      ctx.stroke();
      ctx.setLineDash([]);

      // JT Valve (Triangle) below HX
      const jtX = hxX + 12;
      const jtY = hxY + hxH + 15;
      ctx.fillStyle = T.pink;
      ctx.beginPath();
      ctx.moveTo(jtX - 8, jtY - 7);
      ctx.lineTo(jtX + 8, jtY - 7);
      ctx.lineTo(jtX, jtY + 7);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = T.white;
      ctx.font = `800 6px ${TECH_FONT}`;
      ctx.fillText("J-T", jtX, jtY - 10);

      // Separator / Liquid Receiver (Bottom)
      const sepX = 185;
      const sepY = 168;
      ctx.strokeStyle = gasProps.color;
      ctx.fillStyle = T.glass;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(sepX - 25, sepY - 20, 50, 26, 6);
      ctx.fill();
      ctx.stroke();

      // Liquid pool in separator
      if (canLiquefy) {
        ctx.fillStyle = `${gasProps.color}50`;
        const liqH = Math.min(18, 5 + rawYield * 70);
        ctx.beginPath();
        ctx.roundRect(sepX - 23, sepY + 6 - liqH, 46, liqH, [0, 0, 4, 4]);
        ctx.fill();

        // Droplets from JT valve into separator
        for (let i = 0; i < 4; i++) {
          const dy = ((frame * 2 + i * 8) % 25);
          ctx.fillStyle = gasProps.color;
          ctx.beginPath();
          ctx.arc(jtX + (sepX - jtX) * 0.4, jtY + 8 + dy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Connecting from JT to Separator
      ctx.strokeStyle = T.cyan;
      ctx.beginPath();
      ctx.moveTo(jtX, jtY + 7);
      ctx.lineTo(jtX, sepY - 6);
      ctx.lineTo(sepX - 25, sepY - 6);
      ctx.stroke();

      // Gas return line from Separator top back to HX return
      ctx.strokeStyle = T.cyan;
      ctx.beginPath();
      ctx.moveTo(sepX, sepY - 20);
      ctx.lineTo(sepX, hxY + hxH + 6);
      ctx.lineTo(hxX + 34, hxY + hxH + 6);
      ctx.lineTo(hxX + 34, hxY + hxH);
      ctx.stroke();

      // Low-pressure return back to compressor inlet
      ctx.beginPath();
      ctx.moveTo(hxX + 34, hxY);
      ctx.lineTo(hxX + 34, 25);
      ctx.lineTo(compX, 25);
      ctx.lineTo(compX, compY - 18);
      ctx.stroke();

      // Status text
      ctx.textAlign = "left";
      ctx.font = `800 9px ${TECH_FONT}`;
      ctx.fillStyle = belowInversion ? T.green : T.red;
      ctx.fillText(belowInversion ? `● T < T_inv (${gasProps.tInv}K) - COOLING` : `▲ T > T_inv - HEATING!`, 10, H - 10);

      // Gas badge
      ctx.textAlign = "right";
      ctx.fillStyle = gasProps.color;
      ctx.font = `700 8px ${MONO_FONT}`;
      ctx.fillText(gasProps.name, W - 10, 16);
    },
    [gas, pIn, pOut, tIn, hxEff, belowInversion, canLiquefy, rawYield, gasProps],
    { animate: true }
  );

  const buildPrompt = useCallback(
    () => `Linde-Hampson Gas Liquefaction Simulation — IGCCST 2026:
ROLE: You are an authority on cryogenic process engineering, liquefaction thermodynamic cycles, and sustainable technologies.
AFFILIATION: Cryogenic Engineering Centre, IIT Kharagpur & German cryogenics consortium.

INPUT CONDITIONS:
1. Working fluid: ${gasProps.name}
2. Maximum Inversion Temp (T_inv): ${gasProps.tInv} K
3. Normal Boiling Point: ${gasProps.tBoil} K
4. Compressor Outlet Pressure: ${pIn} atm
5. Return Pressure: ${pOut} atm
6. Feed Temperature: ${tIn} K
7. Heat Exchanger Effectiveness: ${(hxEff * 100).toFixed(0)}%
8. Joule-Thomson Drop (ΔT): ${deltaT.toFixed(1)} K
9. Calculated Liquid Yield: ${yieldPct}%
10. Theoretical COP: ${cop}

ANALYSIS REQUEST:
1. Thermodynamic feasibility: Is the inlet temperature below the maximum Joule-Thomson inversion curve? Why does Hydrogen/Helium require pre-cooling (e.g., via liquid nitrogen or Claude cycle)?
2. Exergy efficiency: Where do the major irreversibilities occur (compressor, JT throttle valve, heat exchanger pinches)?
3. Industrial Scale-Up: Compare this simple Linde-Hampson cycle with Claude and dual-pressure Linde systems for sustainable industrial production. Reference Indo-German clean energy collaboration.`,
    [gasProps, pIn, pOut, tIn, hxEff, deltaT, yieldPct, cop]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={200} maxWidth={280} />
      <PillRow>
        <Pill active={gas === "nitrogen"} onClick={() => setGas("nitrogen")} color={T.accent}>
          N2 (77K)
        </Pill>
        <Pill active={gas === "hydrogen"} onClick={() => setGas("hydrogen")} color={T.pink}>
          H2 (20K)
        </Pill>
        <Pill active={gas === "helium"} onClick={() => setGas("helium")} color={T.gold}>
          He (4.2K)
        </Pill>
      </PillRow>

      <Slider label="Compressor Pressure (P_high)" value={pIn} onChange={setPIn} min={20} max={220} step={5} unit=" atm" color={T.orange} />
      <Slider label="Return Pressure (P_low)" value={pOut} onChange={setPOut} min={1.0} max={5.0} step={0.2} unit=" atm" color={T.cyan} />
      <Slider label="Inlet Temperature" value={tIn} onChange={setTIn} min={40} max={320} step={5} unit=" K" color={T.red} />
      <Slider label="HX Effectiveness" value={hxEff} onChange={setHxEff} min={0.75} max={0.99} step={0.01} unit="" color={T.green} />

      <DataRow>
        <DataBox label="J-T ΔT" value={deltaT.toFixed(1)} unit="K" color={belowInversion ? T.cyan : T.red} />
        <DataBox label="Yield" value={yieldPct} unit="%" color={parseFloat(yieldPct) > 0 ? T.green : T.gray} />
        <DataBox label="Liq. Out" value={liquidOutLHr} unit="L/h" color={T.accent} />
        <DataBox label="COP" value={cop} color={T.gold} />
      </DataRow>

      <InfoBox color={gasProps.color}>
        <strong style={{ color: gasProps.color }}>Joule-Thomson Throttling:</strong> A gas only cools upon expansion if its initial temperature is below its maximum inversion temperature (N2: 621K, H2: 202K, He: 45K). Below inversion, intermolecular attractive forces cause cooling during isenthalpic pressure drop (h1 = h2).
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.accent} />

      <ExportBtn
        simId="linde_hampson"
        getData={() => ({
          gas,
          pIn,
          pOut,
          tIn,
          hxEff,
          deltaT: deltaT.toFixed(2),
          yieldPct,
          liquidOutLHr,
          cop,
        })}
        color={T.accent}
      />
    </div>
  );
}
