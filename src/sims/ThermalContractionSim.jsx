import React, { useState, useMemo } from "react";
import { T, useCanvas } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn, ChallengeBox } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function ThermalContractionSim() {
  const [material, setMaterial] = useState("ss304"); // "ss304", "al6061", "invar36"
  const [jointType, setJointType] = useState("bellows"); // "rigid", "bellows"
  const [pipeLengthM, setPipeLengthM] = useState(20);
  const [fluidTempK, setFluidTempK] = useState(77); // 77K LN2, 20K LH2, 4K LHe, 111K LNG

  const matProps = useMemo(() => {
    switch (material) {
      case "al6061":
        return {
          name: "Aluminum 6061-T6",
          alphaPctAt77K: 0.39, // % strain from 293K to 77K
          youngsModulusGPa: 70,
          yieldStrengthMPa: 275,
          color: T.cyan,
        };
      case "invar36":
        return {
          name: "Invar 36 (Fe-36%Ni LNG Alloy)",
          alphaPctAt77K: 0.045, // very low expansion
          youngsModulusGPa: 145,
          yieldStrengthMPa: 240,
          color: T.purple,
        };
      case "ss304":
      default:
        return {
          name: "Austenitic SS-304L",
          alphaPctAt77K: 0.28, // % strain
          youngsModulusGPa: 200,
          yieldStrengthMPa: 210,
          color: T.accent,
        };
    }
  }, [material]);

  // Integrated contraction strain:
  const strain = useMemo(() => {
    // Normalize contraction by temperature delta from ambient (293 K)
    const factor = Math.max(0, (293 - fluidTempK) / (293 - 77));
    return (matProps.alphaPctAt77K / 100) * factor;
  }, [matProps, fluidTempK]);

  const contractionMm = useMemo(() => {
    return (pipeLengthM * 1000 * strain).toFixed(1);
  }, [pipeLengthM, strain]);

  // If rigid, stress = E * strain; if bellows, stress absorbed by flexure (< 25 MPa)
  const stressMPa = useMemo(() => {
    if (jointType === "bellows") {
      return (15 + strain * 2000).toFixed(0);
    }
    const rigidStress = matProps.youngsModulusGPa * 1000 * strain;
    return rigidStress.toFixed(0);
  }, [jointType, matProps, strain]);

  const isRuptured = jointType === "rigid" && parseFloat(stressMPa) > matProps.yieldStrengthMPa;

  const draw = (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = "#0a0e17";
    ctx.fillRect(0, 0, width, height);

    // Fixed bulkheads (anchors at ends)
    const wallY = 50;
    const wallH = 90;
    ctx.fillStyle = "#1e293b";
    // Left anchor
    ctx.fillRect(10, wallY, 20, wallH);
    ctx.strokeStyle = "#475569";
    ctx.strokeRect(10, wallY, 20, wallH);
    // Right anchor
    ctx.fillRect(width - 30, wallY, 20, wallH);
    ctx.strokeRect(width - 30, wallY, 20, wallH);

    // Anchor hatching
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(10, wallY + i * 15);
      ctx.lineTo(25, wallY + i * 15 + 10);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(width - 30, wallY + i * 15);
      ctx.lineTo(width - 15, wallY + i * 15 + 10);
      ctx.stroke();
    }

    // Pipe visualization
    const pipeY = wallY + wallH / 2 - 12;
    const pipeH = 24;
    const startX = 30;
    const totalSpan = width - 60;

    // Visual contraction offset (magnified for graphic clarity)
    const visualShrink = Math.min(22, (parseFloat(contractionMm) / 50) * 12);

    if (jointType === "rigid") {
      // Solid pipe under high tension
      const grad = ctx.createLinearGradient(startX, 0, width - 30, 0);
      if (isRuptured) {
        grad.addColorStop(0, T.red);
        grad.addColorStop(0.5, "#ef4444");
        grad.addColorStop(1, T.red);
      } else {
        grad.addColorStop(0, "#475569");
        grad.addColorStop(0.5, "#64748b");
        grad.addColorStop(1, "#475569");
      }

      ctx.fillStyle = grad;
      ctx.fillRect(startX, pipeY, totalSpan, pipeH);
      ctx.strokeStyle = isRuptured ? T.red : "#94a3b8";
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, pipeY, totalSpan, pipeH);

      // If ruptured, show crack and leak
      if (isRuptured) {
        const crackX = startX + totalSpan * 0.65;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(crackX, pipeY - 2);
        ctx.lineTo(crackX + 4, pipeY + 12);
        ctx.lineTo(crackX - 3, pipeY + pipeH + 2);
        ctx.stroke();

        // Spraying cryogenic vapor
        ctx.fillStyle = "#ffffffaa";
        for (let i = 0; i < 15; i++) {
          const vx = crackX + (Math.random() - 0.5) * 20;
          const vy = pipeY - 5 - Math.random() * 25;
          ctx.beginPath();
          ctx.arc(vx, vy, 2 + Math.random() * 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = T.red;
        ctx.font = "bold 10px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("💥 FLANGE/PIPE SHEAR RUPTURE!", width / 2, pipeY - 14);
      } else {
        ctx.fillStyle = T.orange;
        ctx.font = "9px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(`Tension Stress: ${stressMPa} MPa`, width / 2, pipeY - 8);
      }
    } else {
      // Bellows absorption (Pipe - Bellows - Pipe)
      const leftPipeW = totalSpan * 0.42;
      const rightPipeW = totalSpan * 0.42;
      const bellowsStartX = startX + leftPipeW;
      const bellowsW = totalSpan - leftPipeW - rightPipeW;

      // Left pipe section
      ctx.fillStyle = "#475569";
      ctx.fillRect(startX, pipeY, leftPipeW, pipeH);
      ctx.strokeStyle = "#94a3b8";
      ctx.strokeRect(startX, pipeY, leftPipeW, pipeH);

      // Right pipe section (pulled slightly by visualShrink)
      ctx.fillRect(bellowsStartX + bellowsW, pipeY, rightPipeW, pipeH);
      ctx.strokeRect(bellowsStartX + bellowsW, pipeY, rightPipeW, pipeH);

      // Corrugated Bellows (Accordion folds)
      ctx.strokeStyle = T.green;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const folds = 6;
      const foldStep = bellowsW / folds;
      for (let i = 0; i <= folds; i++) {
        const fx = bellowsStartX + i * foldStep;
        const fy = i % 2 === 0 ? pipeY - 6 : pipeY + pipeH + 6;
        if (i === 0) ctx.moveTo(fx, pipeY);
        else ctx.lineTo(fx, fy);
      }
      ctx.lineTo(bellowsStartX + bellowsW, pipeY);
      ctx.stroke();

      ctx.fillStyle = T.green;
      ctx.font = "bold 10px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(`✓ BELLOWS COMPRESSED: ΔL = ${contractionMm} mm`, width / 2, pipeY - 12);
    }

    // Shrinkage gauge bar at bottom
    ctx.fillStyle = "#ffffff33";
    ctx.font = "9px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(`Material: ${matProps.name} | ΔT: ${293 - fluidTempK} K`, 15, height - 28);
    ctx.fillText(`Total Contraction: ${contractionMm} mm (${(strain * 100).toFixed(2)}% strain)`, 15, height - 14);
  };

  const canvasRef = useCanvas(draw, [material, jointType, pipeLengthM, fluidTempK, contractionMm, stressMPa, isRuptured]);

  const buildPrompt = useMemo(
    () => () => `CRYOGENIC THERMAL CONTRACTION & EXPANSION JOINTS:
1. Material: ${matProps.name} (E = ${matProps.youngsModulusGPa} GPa, Yield = ${matProps.yieldStrengthMPa} MPa)
2. Transfer Line Length: ${pipeLengthM} meters
3. Cryogenic Fluid Temperature: ${fluidTempK} K (Ambient: 293 K)
4. Free Thermal Contraction (ΔL): ${contractionMm} mm (${(strain * 100).toFixed(3)}% strain)
5. Joint Arrangement: ${jointType === "bellows" ? "Multi-ply Corrugated Bellows" : "Rigid Anchored Flanges"}
6. Resultant Stress: ${stressMPa} MPa (Yield Status: ${isRuptured ? "CATASTROPHIC FAILURE" : "SAFE"})

TECHNICAL QUESTIONS:
1. Integrated Contraction: Why does thermal expansion coefficient α(T) drop drastically toward zero as T approaches 0 K according to the Third Law of Thermodynamics (Nernst postulate)?
2. Invar Effect: Explain the magnetic origin of the ultra-low thermal expansion of Fe-36%Ni Invar alloy used in membrane tanks for LNG transport ships (e.g., GTT Mark III and NO96).
3. Piping Flexibility Design: Contrast the engineering trade-offs of using hydroformed stainless steel bellows versus expansion loops (U-bends or doglegs) in long vacuum-jacketed transfer lines for space launch pads (ISRO Sriharikota, NASA Kennedy).`,
    [matProps, pipeLengthM, fluidTempK, contractionMm, strain, jointType, stressMPa, isRuptured]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={190} maxWidth={280} />

      <ChallengeBox
        title="Pipe Survival Challenge"
        goal="Chill a 30+ meter pipeline down to liquid nitrogen (77 K) without tearing flanges apart!"
        isCompleted={pipeLengthM >= 30 && fluidTempK <= 77 && !isRuptured && jointType === "bellows"}
        hint="Rigid pipes exceed yield stress (600 MPa) and rupture. Switch to 'Flexible Bellows' to absorb the shrinkage."
        color={T.gold}
      />

      <PillRow>
        <Pill active={jointType === "bellows"} onClick={() => setJointType("bellows")} color={T.green}>
          Flexible Bellows
        </Pill>
        <Pill active={jointType === "rigid"} onClick={() => setJointType("rigid")} color={T.red}>
          Rigid Fixed Ends
        </Pill>
      </PillRow>

      <PillRow>
        <Pill active={material === "ss304"} onClick={() => setMaterial("ss304")} color={T.accent}>
          SS-304L
        </Pill>
        <Pill active={material === "al6061"} onClick={() => setMaterial("al6061")} color={T.cyan}>
          Al-6061
        </Pill>
        <Pill active={material === "invar36"} onClick={() => setMaterial("invar36")} color={T.purple}>
          Invar 36 (LNG)
        </Pill>
      </PillRow>

      <Slider label="Transfer Line Length" value={pipeLengthM} onChange={setPipeLengthM} min={5} max={50} step={5} unit=" m" color={T.gold} />
      <Slider label="Cryogen Temperature" value={fluidTempK} onChange={setFluidTempK} min={4} max={120} step={2} unit=" K" color={T.cyan} />

      <DataRow>
        <DataBox label="Contraction" value={`${contractionMm}`} unit="mm" color={T.cyan} />
        <DataBox label="Thermal Stress" value={`${stressMPa}`} unit="MPa" color={isRuptured ? T.red : T.green} />
        <DataBox label="Yield Limit" value={`${matProps.yieldStrengthMPa}`} unit="MPa" color={T.gold} />
        <DataBox label="Status" value={isRuptured ? "RUPTURE!" : "SAFE"} color={isRuptured ? T.red : T.green} />
      </DataRow>

      <InfoBox color={isRuptured ? T.red : T.green}>
        <strong style={{ color: isRuptured ? T.red : T.green }}>The Shrinking Metal Trap:</strong> When chilled from room temperature down to liquid nitrogen (-196°C) or liquid helium (-269°C), metals shrink dramatically — by up to <strong>3 to 4 mm for every single meter</strong>! On a 30-meter launchpad pipeline, that is over 10 centimeters of shrinkage. If clamped rigidly, the pipe will tear itself apart with 60,000 psi of tensile force. Cryo lines require accordion-like flexible <strong>bellows</strong> or U-bends to absorb the motion safely.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={isRuptured ? T.red : T.green} />

      <ExportBtn
        simId="thermal_contraction"
        getData={() => ({
          material,
          matName: matProps.name,
          jointType,
          pipeLengthM,
          fluidTempK,
          contractionMm,
          stressMPa,
          isRuptured,
        })}
      />
    </div>
  );
}
