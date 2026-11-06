import React, { useState, useMemo } from "react";
import { T, useCanvas } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn, ChallengeBox } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function HeliumRecoverySim() {
  const [mode, setMode] = useState("closed_loop"); // "vented", "closed_loop"
  const [labBoiloffLitersDay, setLabBoiloffLitersDay] = useState(25);
  const [recoveryEfficiencyPct, setRecoveryEfficiencyPct] = useState(95);

  // Helium cost ~ $35 - $60 per liquid liter
  const hePricePerLiter = 45;

  const gasExpandedM3 = useMemo(() => {
    // 1 L of LHe expands into ~750 L (0.75 m3) of gas at STP
    return (labBoiloffLitersDay * 0.75).toFixed(1);
  }, [labBoiloffLitersDay]);

  const recoveredLitersDay = useMemo(() => {
    if (mode === "vented") return "0.0";
    return ((labBoiloffLitersDay * recoveryEfficiencyPct) / 100).toFixed(1);
  }, [mode, labBoiloffLitersDay, recoveryEfficiencyPct]);

  const annualSavingsUSD = useMemo(() => {
    const recoveredPerDay = parseFloat(recoveredLitersDay);
    return (recoveredPerDay * 365 * hePricePerLiter).toLocaleString();
  }, [recoveredLitersDay]);

  const draw = (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, width, height);

    // Lab Cryostat (Source of boil-off) on Left
    const cryoX = 15;
    const cryoY = 70;
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.roundRect(cryoX, cryoY, 45, 75, 6);
    ctx.fill();
    ctx.strokeStyle = "#475569";
    ctx.stroke();

    ctx.fillStyle = "#0284c7";
    ctx.fillRect(cryoX + 5, cryoY + 35, 35, 35);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 8px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("CRYOSTAT", cryoX + 22, cryoY + 18);
    ctx.fillText("4.2 K LHe", cryoX + 22, cryoY + 30);

    const time = Date.now() * 0.003;

    if (mode === "vented") {
      // Vented exhaust line going UP into space
      ctx.strokeStyle = T.red;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cryoX + 22, cryoY);
      ctx.lineTo(cryoX + 22, 20);
      ctx.lineTo(width - 40, 20);
      ctx.stroke();

      // Escaping gas molecules escaping to space
      ctx.fillStyle = T.gold;
      for (let i = 0; i < 8; i++) {
        const ex = cryoX + 22 + ((i * 28 + time * 45) % (width - 70));
        ctx.beginPath();
        ctx.arc(ex, 20, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = T.red;
      ctx.font = "bold 10px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("🚀 VENTED TO ATMOSPHERE (ESCAPES TO SPACE FOREVER!)", width / 2, 45);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "9px system-ui";
      ctx.fillText(`Annual Cost Wasted: $${((labBoiloffLitersDay * 365 * hePricePerLiter)).toLocaleString()}`, width / 2, 60);
    } else {
      // Closed Loop Flow: Cryostat -> Gas Balloon -> Compressor -> Purifier -> Liquefier
      // Gas Balloon
      const balX = 90;
      const balY = 60;
      ctx.fillStyle = "#f59e0b22";
      ctx.beginPath();
      ctx.arc(balX, balY, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = T.gold;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = T.gold;
      ctx.font = "bold 8px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("BALLOON", balX, balY - 4);
      ctx.fillText(`${gasExpandedM3} m³/d`, balX, balY + 8);

      // Compressor
      const compX = 145;
      const compY = 75;
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.roundRect(compX, compY, 32, 32, 4);
      ctx.fill();
      ctx.strokeStyle = "#64748b";
      ctx.stroke();
      ctx.fillStyle = "#f1f5f9";
      ctx.font = "bold 7px system-ui";
      ctx.fillText("COMPRESS", compX + 16, compY + 14);
      ctx.fillText("200 bar", compX + 16, compY + 24);

      // 77K LN2 Purifier Trap
      const trapX = 195;
      const trapY = 70;
      ctx.fillStyle = "#0284c733";
      ctx.beginPath();
      ctx.roundRect(trapX, trapY, 30, 42, 4);
      ctx.fill();
      ctx.strokeStyle = T.cyan;
      ctx.stroke();
      ctx.fillStyle = T.cyan;
      ctx.fillText("77K TRAP", trapX + 15, trapY + 16);
      ctx.fillText("<1 ppm", trapX + 15, trapY + 28);

      // Liquefier Return Dewar
      const liqX = 242;
      const liqY = 65;
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.roundRect(liqX, liqY, 30, 52, 6);
      ctx.fill();
      ctx.strokeStyle = T.green;
      ctx.stroke();
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(liqX + 3, liqY + 25, 24, 24);
      ctx.fillStyle = T.green;
      ctx.fillText("4.2K RECYC", liqX + 15, liqY + 14);

      // Connecting pipes
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cryoX + 45, cryoY + 20);
      ctx.lineTo(balX - 26, balY);
      ctx.moveTo(balX + 26, balY);
      ctx.lineTo(compX, compY + 16);
      ctx.moveTo(compX + 32, compY + 16);
      ctx.lineTo(trapX, trapY + 16);
      ctx.moveTo(trapX + 30, trapY + 16);
      ctx.lineTo(liqX, liqY + 16);
      ctx.stroke();

      // Flow dots
      ctx.fillStyle = T.green;
      for (let i = 0; i < 5; i++) {
        const dotX = cryoX + 45 + ((i * 45 + time * 35) % (liqX - cryoX - 45));
        ctx.beginPath();
        ctx.arc(dotX, balY + 15, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = T.green;
      ctx.font = "bold 10px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(`♻️ RECYCLING ${recoveryEfficiencyPct}% HELIUM (SAVING $${annualSavingsUSD}/YR)`, width / 2, 35);
    }

    // Legend
    ctx.fillStyle = "#ffffff33";
    ctx.font = "9px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(`Boiloff: ${labBoiloffLitersDay} L/day | Gas: ${gasExpandedM3} m³/day`, 15, height - 12);
  };

  const canvasRef = useCanvas(draw, [mode, labBoiloffLitersDay, recoveryEfficiencyPct, gasExpandedM3, annualSavingsUSD]);

  const buildPrompt = useMemo(
    () => () => `HELIUM CONSERVATION & CLOSED-LOOP RECOVERY SYSTEM:
1. Operational Mode: ${mode === "closed_loop" ? "Closed-Loop Recovery & Re-liquefaction" : "Direct Atmospheric Venting (Lost to Space)"}
2. Liquid Helium Boil-Off Rate: ${labBoiloffLitersDay} Liters/day (Expands into ${gasExpandedM3} m³ gas/day)
3. Recovery Efficiency: ${recoveryEfficiencyPct}%
4. Recovered Liquid Helium: ${recoveredLitersDay} Liters/day
5. Annual Economic Value Saved: $${annualSavingsUSD} USD/year (at $45/L baseline)

TECHNICAL QUESTIONS:
1. Non-Renewable Geochemical Origin: Why is Helium on Earth irreplaceable, formed only by deep alpha-decay of Uranium and Thorium trapped inside natural gas domes (e.g. Hugoton-Panhandle, Qatar)? Why does vented helium inevitably achieve Jean's escape velocity and leak permanently into interplanetary space?
2. 77K Cryogenic Charcoal Purification: How does an activated charcoal bed submersed in liquid nitrogen (77 K) utilize cryogenic physisorption to selectively scrub air contaminants (N2, O2, moisture, hydrocarbons) down to sub-ppm levels before sending helium into 4.2 K liquefaction turbines?
3. Global Helium Supply Vulnerability: Discuss the impact of recurring global helium shortages (Helium Shortage 4.0) on healthcare (MRI scanners) and quantum science, and explain why major institutes (e.g., DESY, CERN, TIFR) mandate 95%+ recovery loops.`,
    [mode, labBoiloffLitersDay, gasExpandedM3, recoveryEfficiencyPct, recoveredLitersDay, annualSavingsUSD]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={190} maxWidth={280} />

      <ChallengeBox
        title="Zero-Loss Helium Challenge"
        goal="Switch to Closed-Loop recovery and recycle ≥ 20 Liters/day to save over $30,000 annually!"
        isCompleted={mode === "closed_loop" && parseFloat(recoveredLitersDay) >= 20}
        hint="Select 'Closed-Loop Recovery' and set lab boil-off to 25+ L/day with 95% efficiency."
        color={T.green}
      />

      <PillRow>
        <Pill active={mode === "closed_loop"} onClick={() => setMode("closed_loop")} color={T.green}>
          Closed-Loop Recovery (95%)
        </Pill>
        <Pill active={mode === "vented"} onClick={() => setMode("vented")} color={T.red}>
          Atmospheric Vent (0%)
        </Pill>
      </PillRow>

      <Slider label="Lab Liquid Helium Boil-Off" value={labBoiloffLitersDay} onChange={setLabBoiloffLitersDay} min={5} max={60} step={5} unit=" L/day" color={T.cyan} />
      {mode === "closed_loop" && (
        <Slider label="Recovery System Efficiency" value={recoveryEfficiencyPct} onChange={setRecoveryEfficiencyPct} min={80} max={99} step={1} unit="%" color={T.green} />
      )}

      <DataRow>
        <DataBox label="Gas Volume" value={`${gasExpandedM3}`} unit="m³/d" color={T.gold} />
        <DataBox label="Recovered" value={`${recoveredLitersDay}`} unit="L/d" color={mode === "closed_loop" ? T.green : T.red} />
        <DataBox label="Annual Value" value={`$${annualSavingsUSD}`} color={T.accent} />
        <DataBox label="Status" value={mode === "closed_loop" ? "RECYCLING" : "LOST"} color={mode === "closed_loop" ? T.green : T.red} />
      </DataRow>

      <InfoBox color={mode === "closed_loop" ? T.green : T.red}>
        <strong style={{ color: mode === "closed_loop" ? T.green : T.red }}>Helium is Vanishing from Earth:</strong> Unlike nitrogen or oxygen, helium cannot be pulled from the air! It is a finite subterranean resource created over millions of years by radioactive decay. Because helium is lighter than air, any vented helium floats to the top of our atmosphere and escapes into outer space forever! Modern hospitals, quantum computing labs, and MRI centers use giant recovery balloons and 77K cryogenic cold traps to recapture and re-liquefy over 95% of their helium.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={mode === "closed_loop" ? T.green : T.red} />

      <ExportBtn
        simId="helium_recovery"
        getData={() => ({
          mode,
          labBoiloffLitersDay,
          gasExpandedM3,
          recoveryEfficiencyPct,
          recoveredLitersDay,
          annualSavingsUSD,
        })}
      />
    </div>
  );
}
