import React, { useState, useMemo } from "react";
import { T, useCanvas } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function OrthoParaSim() {
  const [catalyst, setCatalyst] = useState("fe2o3"); // "none", "charcoal", "fe2o3"
  const [daysStored, setDaysStored] = useState(5);

  const catProps = useMemo(() => {
    switch (catalyst) {
      case "none":
        return {
          name: "No Catalyst (Spontaneous Flip)",
          rateConstantDay: 0.012, // slow conversion rate
          initialParaPct: 25, // room temp normal hydrogen
          color: T.red,
          desc: "Slow spin conversion releases 703 kJ/kg heat, boiling off 50% of tank in a week!",
        };
      case "charcoal":
        return {
          name: "Activated Carbon Bed",
          rateConstantDay: 0.45,
          initialParaPct: 75,
          color: T.gold,
          desc: "Paramagnetic surface sites speed up spin flipping to moderate levels.",
        };
      case "fe2o3":
      default:
        return {
          name: "Ferric Oxide (Fe₂O₃ Catalyst)",
          rateConstantDay: 2.5, // near instantaneous in liquefier
          initialParaPct: 98,
          color: T.green,
          desc: "Industrial magnetic catalyst converts >98% to para at 20 K before filling tank.",
        };
    }
  }, [catalyst]);

  // Equilibrium at 20.3K is 99.8% para
  // Fraction remaining as ortho:
  // Ortho(t) = Ortho_0 * exp(-k * t)
  const ortho0 = (100 - catProps.initialParaPct) / 100;
  const currentOrtho = ortho0 * Math.exp(-catProps.rateConstantDay * daysStored);
  const currentParaPct = (100 - currentOrtho * 100).toFixed(1);

  // Heat released from ortho->para: 703 kJ/kg total from 100% ortho to 100% para
  // Delta ortho converted:
  const orthoConverted = ortho0 - currentOrtho;
  const heatReleasedKJkg = orthoConverted * 703;
  // Latent heat of LH2: 446 kJ/kg
  // Boil-off mass fraction = heatReleased / 446
  const boilOffPct = Math.min(65, (heatReleasedKJkg / 446) * 100).toFixed(1);
  const tankLevelPct = Math.max(0, 100 - parseFloat(boilOffPct)).toFixed(1);

  const draw = (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, width, height);

    // Liquid Hydrogen Tank (Dewar Cutaway)
    const tankX = 25;
    const tankY = 20;
    const tankW = 100;
    const tankH = 135;

    // Outer vacuum jacket
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.roundRect(tankX, tankY, tankW, tankH, 12);
    ctx.fill();
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner liquid volume
    const liquidH = (parseFloat(tankLevelPct) / 100) * (tankH - 24);
    const liquidY = tankY + tankH - 12 - liquidH;

    // Liquid fill
    const liqGrad = ctx.createLinearGradient(0, liquidY, 0, liquidY + liquidH);
    liqGrad.addColorStop(0, "#38bdf888");
    liqGrad.addColorStop(1, "#0284c7bb");
    ctx.fillStyle = liqGrad;
    ctx.beginPath();
    ctx.roundRect(tankX + 8, liquidY, tankW - 16, liquidH, [0, 0, 8, 8]);
    ctx.fill();

    // Boil-off gas bubbles escaping
    const time = Date.now() * 0.003;
    if (parseFloat(boilOffPct) > 5) {
      ctx.fillStyle = "#ffffff99";
      for (let i = 0; i < 8; i++) {
        const bx = tankX + 16 + ((i * 11 + time * 15) % (tankW - 32));
        const by = liquidY + ((i * 17 - time * 25) % Math.max(10, liquidH));
        ctx.beginPath();
        ctx.arc(bx, by, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Molecular Spin Visualizer on Right Side
    const molX = 145;
    const molY = 30;
    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.roundRect(molX, molY, width - molX - 15, 125, 8);
    ctx.fill();
    ctx.strokeStyle = "#374151";
    ctx.stroke();

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 9px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("NUCLEAR SPIN ISOMERS", molX + (width - molX - 15) / 2, molY + 16);

    // Ortho molecule (parallel spins, high energy)
    const oY = molY + 45;
    ctx.fillStyle = T.red;
    ctx.beginPath();
    ctx.arc(molX + 25, oY, 8, 0, Math.PI * 2);
    ctx.arc(molX + 45, oY, 8, 0, Math.PI * 2);
    ctx.fill();
    // Arrows (parallel)
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(molX + 25, oY + 4); ctx.lineTo(molX + 25, oY - 4);
    ctx.moveTo(molX + 45, oY + 4); ctx.lineTo(molX + 45, oY - 4);
    ctx.stroke();

    ctx.font = "8px system-ui";
    ctx.textAlign = "left";
    ctx.fillStyle = T.red;
    ctx.fillText("ORTHO-H₂ (↑↑)", molX + 58, oY - 2);
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("High energy triplet", molX + 58, oY + 8);

    // Para molecule (anti-parallel spins, ground state)
    const pY = molY + 90;
    ctx.fillStyle = T.green;
    ctx.beginPath();
    ctx.arc(molX + 25, pY, 8, 0, Math.PI * 2);
    ctx.arc(molX + 45, pY, 8, 0, Math.PI * 2);
    ctx.fill();
    // Arrows (anti-parallel)
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(molX + 25, pY + 4); ctx.lineTo(molX + 25, pY - 4);
    ctx.moveTo(molX + 45, pY - 4); ctx.lineTo(molX + 45, pY + 4);
    ctx.stroke();

    ctx.fillStyle = T.green;
    ctx.fillText("PARA-H₂ (↑↓)", molX + 58, pY - 2);
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Ground state singlet", molX + 58, pY + 8);

    // Bottom tank status
    ctx.fillStyle = "#ffffff44";
    ctx.font = "9px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(`Stored: ${daysStored} Days | Self-Boiloff: -${boilOffPct}%`, 15, height - 12);
  };

  const canvasRef = useCanvas(draw, [catalyst, daysStored, tankLevelPct, boilOffPct, currentParaPct]);

  const buildPrompt = useMemo(
    () => () => `ORTHO-TO-PARA HYDROGEN QUANTUM SPIN ISOMER CONVERSION:
1. Catalyst Strategy: ${catProps.name}
2. Storage Duration: ${daysStored} days
3. Para-Hydrogen Concentration: ${currentParaPct}% (Ortho: ${(100 - parseFloat(currentParaPct)).toFixed(1)}%)
4. Cumulative Self-Boiloff Loss: ${boilOffPct}% of tank volume
5. Heat of Conversion vs Latent Heat: Ortho->Para releases 703 kJ/kg vs Latent Heat of LH2 = 446 kJ/kg!

TECHNICAL QUESTIONS:
1. Quantum Mechanical Basis: Why is the ortho-to-para transition optically and radiative forbidden by nuclear spin symmetry selection rules (Fermi-Dirac statistics of identical protons), requiring an external inhomogeneous magnetic field or paramagnetic surface site (e.g., Fe3+ / Ni) to perturb the spin state?
2. The Self-Boiling Paradox: In a 100% adiabatic (perfectly insulated, zero heat leak) dewar, why will unconverted liquid hydrogen spontaneously boil off more than 50% of its liquid inventory over 10 days solely through nuclear spin relaxation?
3. Cryogenic Plant Implementation: Describe how modern hydrogen liquefaction plants (Linde Leuna, Air Liquide) integrate ortho-para catalyst beds directly inside multi-stage brazed aluminum plate-fin heat exchangers (BAHX) at temperature levels of 77 K and 20 K.`,
    [catProps, daysStored, currentParaPct, boilOffPct]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={190} maxWidth={280} />

      <PillRow>
        <Pill active={catalyst === "fe2o3"} onClick={() => setCatalyst("fe2o3")} color={T.green}>
          Fe₂O₃ Catalyst (98%)
        </Pill>
        <Pill active={catalyst === "charcoal"} onClick={() => setCatalyst("charcoal")} color={T.gold}>
          Charcoal Bed
        </Pill>
        <Pill active={catalyst === "none"} onClick={() => setCatalyst("none")} color={T.red}>
          No Catalyst (Raw)
        </Pill>
      </PillRow>

      <Slider label="Days in Closed Cryogenic Storage" value={daysStored} onChange={setDaysStored} min={1} max={30} step={1} unit=" Days" color={T.cyan} />

      <DataRow>
        <DataBox label="Tank Level" value={`${tankLevelPct}%`} color={parseFloat(tankLevelPct) > 85 ? T.green : T.red} />
        <DataBox label="Self-Boiloff" value={`${boilOffPct}%`} color={parseFloat(boilOffPct) < 10 ? T.green : T.red} />
        <DataBox label="Para Fraction" value={`${currentParaPct}%`} color={T.cyan} />
        <DataBox label="Status" value={parseFloat(boilOffPct) > 25 ? "BOILING OFF" : "STABLE"} color={parseFloat(boilOffPct) > 25 ? T.red : T.green} />
      </DataRow>

      <InfoBox color={catProps.color}>
        <strong style={{ color: catProps.color }}>The Quantum Time-Bomb in Liquid Hydrogen:</strong> Hydrogen molecules exist in two nuclear spin forms: <em>Ortho</em> (proton spins parallel) and <em>Para</em> (proton spins opposite). At room temperature, hydrogen is 75% Ortho. But at liquid hydrogen temperatures (-253°C), it wants to be 100% Para! As it slowly flips, it releases <strong>703 kJ/kg of heat</strong> — far more than the heat needed to boil the liquid (446 kJ/kg)! Without an iron oxide catalyst bed during liquefaction, the liquid hydrogen boils itself away even inside a perfect thermos!
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={catProps.color} />

      <ExportBtn
        simId="ortho_para_hydrogen"
        getData={() => ({
          catalyst,
          catName: catProps.name,
          daysStored,
          tankLevelPct,
          boilOffPct,
          currentParaPct,
          orthoConvertedPct: (ortho0 - currentOrtho) * 100,
        })}
      />
    </div>
  );
}
