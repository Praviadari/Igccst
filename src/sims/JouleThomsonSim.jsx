import React, { useState, useMemo } from "react";
import { T, useCanvas } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function JouleThomsonSim() {
  const [gas, setGas] = useState("n2"); // "n2", "h2", "he"
  const [inletTempK, setInletTempK] = useState(295);
  const [inletPressBar, setInletPressBar] = useState(150);

  const gasProps = useMemo(() => {
    switch (gas) {
      case "h2":
        return {
          name: "Hydrogen (H₂)",
          maxInversionK: 202,
          color: T.pink,
          muRoom: -0.03, // heats at 300K
          a_vdw: 0.245,
          b_vdw: 0.0266,
          desc: "H₂ heats up upon expansion at room temp! Must be precooked below 202 K.",
        };
      case "he":
        return {
          name: "Helium (He)",
          maxInversionK: 45,
          color: T.purple,
          muRoom: -0.06, // heats strongly at 300K
          a_vdw: 0.034,
          b_vdw: 0.0237,
          desc: "Helium heats up unless precooked below 45 K with liquid hydrogen/nitrogen.",
        };
      case "n2":
      default:
        return {
          name: "Nitrogen (N₂)",
          maxInversionK: 621,
          color: T.cyan,
          muRoom: 0.25, // cools nicely at 300K
          a_vdw: 1.39,
          b_vdw: 0.0391,
          desc: "N₂ cools directly when throttled from room temperature (Inversion: 621 K).",
        };
    }
  }, [gas]);

  // Simplified van der Waals / empirical JT coefficient:
  // mu_JT ~ (2a / (R*T) - b) / Cp
  // Inversion when 2a / (R*T) = b => T_inv_max ~ 2a / (R*b)
  const isCooling = inletTempK < gasProps.maxInversionK;

  // Approximate temperature drop or rise across throttle:
  // Delta T = mu_JT * (P_out - P_in), where P_out = 1 bar
  const deltaP = 1 - inletPressBar; // negative
  const muEffective = useMemo(() => {
    const ratio = inletTempK / gasProps.maxInversionK;
    // Normalized curve: mu > 0 when ratio < 1, mu < 0 when ratio > 1
    return (1 - ratio) * 0.45;
  }, [inletTempK, gasProps]);

  const deltaTK = useMemo(() => {
    return (muEffective * deltaP).toFixed(1);
  }, [muEffective, deltaP]);

  const outletTempK = useMemo(() => {
    const tout = inletTempK + parseFloat(deltaTK);
    return Math.max(4, tout).toFixed(1);
  }, [inletTempK, deltaTK]);

  const draw = (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, width, height);

    // Left Pipe (High Pressure)
    const midY = 70;
    const pipeH = 50;

    // Inlet pipe
    const gradIn = ctx.createLinearGradient(15, 0, 110, 0);
    gradIn.addColorStop(0, "#1e293b");
    gradIn.addColorStop(1, "#334155");
    ctx.fillStyle = gradIn;
    ctx.fillRect(15, midY - pipeH / 2, 95, pipeH);
    ctx.strokeStyle = "#475569";
    ctx.strokeRect(15, midY - pipeH / 2, 95, pipeH);

    // Throttle Orifice Plate (Nozzle)
    ctx.fillStyle = "#64748b";
    ctx.fillRect(110, midY - pipeH / 2, 10, 16);
    ctx.fillRect(110, midY + pipeH / 2 - 16, 10, 16);

    // Outlet Pipe (Low Pressure)
    const gradOut = ctx.createLinearGradient(120, 0, 265, 0);
    gradOut.addColorStop(0, isCooling ? "#0284c722" : "#ef444422");
    gradOut.addColorStop(1, isCooling ? "#0369a144" : "#b91c1c44");
    ctx.fillStyle = gradOut;
    ctx.fillRect(120, midY - pipeH / 2, 145, pipeH);
    ctx.strokeStyle = "#475569";
    ctx.strokeRect(120, midY - pipeH / 2, 145, pipeH);

    // Gas stream particles
    const time = Date.now() * 0.003;
    // Inlet stream (dense dots)
    ctx.fillStyle = "#94a3b8";
    for (let i = 0; i < 35; i++) {
      const px = 20 + ((i * 13 + time * 40) % 85);
      const py = midY - pipeH / 2 + 8 + ((i * 17) % (pipeH - 16));
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Jet / expansion plume through throttle orifice
    ctx.fillStyle = isCooling ? T.cyan : T.red;
    for (let i = 0; i < 25; i++) {
      const px = 122 + ((i * 19 + time * 90) % 138);
      const spread = (px - 120) * 0.16;
      const py = midY + Math.sin(i * 1.5 + time * 2) * spread;
      ctx.beginPath();
      ctx.arc(px, py, isCooling ? 2 : 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pressure & Temp Labels on diagram
    ctx.font = "bold 9px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(`P₁ = ${inletPressBar} bar`, 60, midY - pipeH / 2 - 8);
    ctx.fillText(`T₁ = ${inletTempK} K`, 60, midY + pipeH / 2 + 16);

    ctx.fillStyle = isCooling ? T.cyan : T.red;
    ctx.fillText(`P₂ = 1 bar (Expanded)`, 195, midY - pipeH / 2 - 8);
    ctx.fillText(`T₂ = ${outletTempK} K (${deltaTK > 0 ? "+" : ""}${deltaTK} K)`, 195, midY + pipeH / 2 + 16);

    // Inversion Zone Status Badge
    const badgeY = height - 35;
    ctx.fillStyle = isCooling ? "#064e3b" : "#7f1d1d";
    ctx.beginPath();
    ctx.roundRect(20, badgeY, width - 40, 24, 4);
    ctx.fill();
    ctx.strokeStyle = isCooling ? T.green : T.red;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(
      isCooling
        ? `✅ INSIDE INVERSION CURVE: GAS COOLS (ΔT = ${deltaTK} K)`
        : `⚠️ OUTSIDE INVERSION CURVE: GAS HEATS UP! (ΔT = +${deltaTK} K)`,
      width / 2,
      badgeY + 16
    );
  };

  const canvasRef = useCanvas(draw, [gas, inletTempK, inletPressBar, isCooling, deltaTK, outletTempK]);

  const buildPrompt = useMemo(
    () => () => `JOULE-THOMSON EXPANSION & INVERSION ANALYSIS:
1. Working Fluid: ${gasProps.name}
2. Maximum Inversion Temperature: ${gasProps.maxInversionK} K
3. Inlet Conditions: T1 = ${inletTempK} K, P1 = ${inletPressBar} bar
4. Outlet Conditions: T2 = ${outletTempK} K, P2 = 1.0 bar (ΔT = ${deltaTK} K)
5. Operating Regime: ${isCooling ? "COOLING (μ_JT > 0, attractive van der Waals forces dominate)" : "HEATING (μ_JT < 0, repulsive co-volume dominates)"}

TECHNICAL QUESTIONS:
1. Mathematical Derivation: Derive the Joule-Thomson coefficient from the first law and cyclic relation: μ_JT = (1/Cp) * [T * (∂V/∂T)_P - V]. How does this rigorously explain why ideal gases experience zero temperature change (μ_JT = 0)?
2. Inversion Curve Physics: Explain intermolecular forces during isenthalpic throttling. Why does the kinetic energy decrease during expansion below T_inv (doing work against attractive van der Waals potentials), but increase above T_inv due to molecular repulsion?
3. Cryogenic Plant Design: Why must hydrogen liquefiers (such as those at Linde or ISRO) use liquid nitrogen pre-cooling stages down to 65 K before allowing the hydrogen to enter the final Joule-Thomson expansion valve?`,
    [gasProps, inletTempK, inletPressBar, outletTempK, deltaTK, isCooling]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={190} maxWidth={280} />

      <PillRow>
        <Pill active={gas === "n2"} onClick={() => { setGas("n2"); setInletTempK(295); }} color={T.cyan}>
          Nitrogen (N₂)
        </Pill>
        <Pill active={gas === "h2"} onClick={() => setGas("h2")} color={T.pink}>
          Hydrogen (H₂)
        </Pill>
        <Pill active={gas === "he"} onClick={() => setGas("he")} color={T.purple}>
          Helium (He)
        </Pill>
      </PillRow>

      <Slider label="Inlet Gas Temperature" value={inletTempK} onChange={setInletTempK} min={25} max={350} step={5} unit=" K" color={isCooling ? T.cyan : T.red} />
      <Slider label="Inlet Supply Pressure" value={inletPressBar} onChange={setInletPressBar} min={20} max={220} step={10} unit=" bar" color={T.gold} />

      <DataRow>
        <DataBox label="Outlet Temp" value={`${outletTempK}K`} color={isCooling ? T.cyan : T.red} />
        <DataBox label="Temp Shift" value={`${deltaTK > 0 ? "+" : ""}${deltaTK}K`} color={isCooling ? T.green : T.red} />
        <DataBox label="Max Inversion" value={`${gasProps.maxInversionK}K`} color={T.gold} />
        <DataBox label="Regime" value={isCooling ? "COOLING" : "HEATING"} color={isCooling ? T.green : T.red} />
      </DataRow>

      <InfoBox color={gasProps.color}>
        <strong style={{ color: gasProps.color }}>The Counter-Intuitive Throttling Secret:</strong> When you open a gas valve, you might expect the gas to always cool down. But that only happens if the starting temperature is below the <strong>Inversion Temperature</strong>! Nitrogen cools even at room temperature (inversion is 621 K). But Hydrogen (202 K) and Helium (45 K) actually <em>HEAT UP</em> when expanded at room temperature! Cryogenic engineers must pre-cool them with liquid nitrogen before throttling, or they will boil off violently!
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={gasProps.color} />

      <ExportBtn
        simId="joule_thomson"
        getData={() => ({
          gas,
          inletTempK,
          inletPressBar,
          outletTempK,
          deltaTK,
          maxInversionK: gasProps.maxInversionK,
          isCooling,
        })}
      />
    </div>
  );
}
