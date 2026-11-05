import React, { useState, useMemo } from "react";
import { T, useCanvas } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function MRIQuenchSim() {
  const [fieldStrength, setFieldStrength] = useState("3t"); // "1.5t", "3t"
  const [isQuenching, setIsQuenching] = useState(false);
  const [quenchProgress, setQuenchProgress] = useState(0); // 0 to 100%

  const mriProps = useMemo(() => {
    switch (fieldStrength) {
      case "1.5t":
        return {
          name: "1.5 Tesla Clinical MRI",
          fieldT: 1.5,
          currentAmps: 650,
          storedEnergyMJ: 1.8,
          heliumLiters: 1500,
          color: T.cyan,
        };
      case "3t":
      default:
        return {
          name: "3.0 Tesla High-Field MRI",
          fieldT: 3.0,
          currentAmps: 1200,
          storedEnergyMJ: 4.5,
          heliumLiters: 2000,
          color: T.purple,
        };
    }
  }, [fieldStrength]);

  // Dynamic values during quench
  const remainingFieldT = isQuenching
    ? Math.max(0, mriProps.fieldT * (1 - quenchProgress / 100)).toFixed(2)
    : mriProps.fieldT.toFixed(2);

  const coilTempK = isQuenching
    ? (4.2 + (quenchProgress / 100) * 120).toFixed(0)
    : "4.2";

  const boiloffFlowKgS = isQuenching && quenchProgress < 85
    ? (12 + (quenchProgress / 50) * 25).toFixed(0)
    : "0.0";

  const triggerQuench = () => {
    setIsQuenching(true);
    setQuenchProgress(0);
  };

  const resetMRI = () => {
    setIsQuenching(false);
    setQuenchProgress(0);
  };

  const draw = (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2 + 10;
    const outerR = 60;
    const boreR = 26;

    // Quench exhaust chimney on top
    const pipeW = 20;
    const pipeH = 32;
    ctx.fillStyle = "#334155";
    ctx.fillRect(centerX - pipeW / 2, 8, pipeW, pipeH);
    ctx.strokeStyle = "#64748b";
    ctx.strokeRect(centerX - pipeW / 2, 8, pipeW, pipeH);

    // If quenching, show explosive cryogenic helium vapor cloud shooting out of chimney!
    const time = Date.now() * 0.005;
    if (isQuenching && quenchProgress < 95) {
      ctx.fillStyle = "#ffffffcc";
      for (let i = 0; i < 24; i++) {
        const spread = (i * 13) % 28 - 14;
        const py = 8 - ((i * 7 + time * 60) % 35);
        const r = 3 + (i % 5);
        ctx.beginPath();
        ctx.arc(centerX + spread, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Outer MRI Cryostat Donut
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Liquid Helium Reservoir Layer
    const heColor = isQuenching ? "#ef444444" : "#0284c755";
    ctx.fillStyle = heColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerR - 6, 0, Math.PI * 2);
    ctx.fill();

    // NbTi Superconducting Coils (Rings)
    ctx.strokeStyle = isQuenching ? T.red : T.cyan;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerR - 16, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Patient Bore
    ctx.fillStyle = "#090d16";
    ctx.beginPath();
    ctx.arc(centerX, centerY, boreR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Magnetic field lines inside the bore
    if (parseFloat(remainingFieldT) > 0.1) {
      const fieldAlpha = Math.min(1, parseFloat(remainingFieldT) / mriProps.fieldT);
      ctx.strokeStyle = `rgba(168, 85, 247, ${fieldAlpha * 0.8})`;
      ctx.lineWidth = 1.5;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(centerX - 16, centerY + i * 8);
        ctx.lineTo(centerX + 16, centerY + i * 8);
        ctx.stroke();
      }

      ctx.fillStyle = T.purple;
      ctx.font = "bold 9px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(`${remainingFieldT} T`, centerX, centerY + 3);
    } else {
      ctx.fillStyle = T.red;
      ctx.font = "bold 9px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("0.0 T (DEAD)", centerX, centerY + 3);
    }

    // Quench or Persistent Status Banner
    if (isQuenching) {
      ctx.fillStyle = quenchProgress < 85 ? T.red : "#e2e8f0";
      ctx.font = "bold 10px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(
        quenchProgress < 85
          ? `⚠️ QUENCHING! BOILING LHe: ${boiloffFlowKgS} kg/s`
          : "💥 QUENCH COMPLETE: ALL HELIUM VENTED",
        width / 2,
        height - 10
      );

      setQuenchProgress((p) => (p < 100 ? p + 0.8 : 100));
    } else {
      ctx.fillStyle = T.green;
      ctx.font = "bold 10px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("🟢 PERSISTENT MODE: 0 WATTS WALL POWER", width / 2, height - 10);
    }
  };

  const canvasRef = useCanvas(draw, [fieldStrength, isQuenching, quenchProgress, remainingFieldT, boiloffFlowKgS, mriProps]);

  const buildPrompt = useMemo(
    () => () => `MRI SUPERCONDUCTING MAGNET PERSISTENT CURRENT & THERMAL QUENCH:
1. Scanner Specification: ${mriProps.name} (${mriProps.fieldT} Tesla)
2. Operating Current: ${mriProps.currentAmps} Amperes (Circulating in persistent closed loop)
3. Stored Magnetic Field Energy: ${mriProps.storedEnergyMJ} MegaJoules (E = 0.5 * L * I^2)
4. Magnet Status: ${isQuenching ? `QUENCHED (${quenchProgress.toFixed(0)}% complete, Peak Temp: ${coilTempK} K)` : "Superconducting at 4.2 K in Liquid Helium"}
5. Helium Loss: ${isQuenching ? `${mriProps.heliumLiters} Liters vented into atmosphere` : "Zero boil-off (cryocooler recondenser)"}

TECHNICAL QUESTIONS:
1. Persistent Mode Switch: Explain how a thermal superconducting switch (a small section of NbTi wrapped with a resistive heater) allows ramping up magnetic current, and how cooling it back to 4.2 K traps circulating persistent current indefinitely with zero external power.
2. Quench Dynamics: When a tiny segment of superconductor exceeds critical temperature (Tc) or critical current density (Jc), explain the positive feedback loop: Joule heating (I^2 * R) expands the normal zone, rapid thermal propagation, and the sudden conversion of MegaJoules of magnetic energy into latent heat of liquid helium.
3. Quench Pipe Engineering: How is the emergency burst disc and cryogenic quench duct designed to safely vent hundreds of kilograms per second of cold helium gas out through the hospital roof, preventing catastrophic pressure explosion or room asphyxiation?`,
    [mriProps, isQuenching, quenchProgress, coilTempK]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={200} maxWidth={280} />

      <PillRow>
        <Pill active={fieldStrength === "3t"} onClick={() => { setFieldStrength("3t"); resetMRI(); }} color={T.purple}>
          3.0 Tesla (High Field)
        </Pill>
        <Pill active={fieldStrength === "1.5t"} onClick={() => { setFieldStrength("1.5t"); resetMRI(); }} color={T.cyan}>
          1.5 Tesla (Standard)
        </Pill>
      </PillRow>

      <div style={{ textAlign: "center", margin: "10px 0" }}>
        {!isQuenching ? (
          <button
            onClick={triggerQuench}
            style={{
              background: `linear-gradient(135deg, ${T.red}, #991b1b)`,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "8px 18px",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)",
            }}
          >
            🚨 MANUAL EMERGENCY QUENCH
          </button>
        ) : (
          <button
            onClick={resetMRI}
            style={{
              background: `linear-gradient(135deg, ${T.green}, #065f46)`,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "8px 18px",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.4)",
            }}
          >
            🔄 Refill Helium & Ramp Current
          </button>
        )}
      </div>

      <DataRow>
        <DataBox label="Field" value={`${remainingFieldT}T`} color={parseFloat(remainingFieldT) > 0.5 ? T.purple : T.red} />
        <DataBox label="Coil Temp" value={`${coilTempK}K`} color={parseFloat(coilTempK) < 10 ? T.green : T.red} />
        <DataBox label="Stored Energy" value={`${mriProps.storedEnergyMJ}`} unit="MJ" color={T.gold} />
        <DataBox label="Mode" value={isQuenching ? "QUENCH" : "PERSIST"} color={isQuenching ? T.red : T.green} />
      </DataRow>

      <InfoBox color={isQuenching ? T.red : T.purple}>
        <strong style={{ color: isQuenching ? T.red : T.purple }}>The Miracle & Danger of MRI Magnets:</strong> Hospital MRI scanners stay powerfully magnetic 24 hours a day, 365 days a year without drawing electricity from the wall! The wire is a niobium-titanium superconductor chilled in liquid helium (4.2 K). Because electrical resistance is exactly zero, hundreds of amperes flow forever in a continuous closed loop. But if a tiny hot spot develops, the stored energy (megajoules — equal to a speeding truck!) violently boils off thousands of liters of liquid helium in seconds, venting a roaring white plume through the hospital roof in an event called a <strong>Quench</strong>.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={isQuenching ? T.red : T.purple} />

      <ExportBtn
        simId="mri_quench"
        getData={() => ({
          fieldStrength,
          fieldT: remainingFieldT,
          coilTempK,
          storedEnergyMJ: mriProps.storedEnergyMJ,
          currentAmps: mriProps.currentAmps,
          isQuenching,
          quenchProgressPct: quenchProgress,
        })}
      />
    </div>
  );
}
