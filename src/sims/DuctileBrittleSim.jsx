import React, { useState, useMemo } from "react";
import { T, useCanvas } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function DuctileBrittleSim() {
  const [material, setMaterial] = useState("rubber"); // "rubber", "carbon_steel", "ss304"
  const [tempK, setTempK] = useState(150);
  const [striking, setStriking] = useState(false);
  const [animTime, setAnimTime] = useState(0);

  const matProps = useMemo(() => {
    switch (material) {
      case "rubber":
        return {
          name: "Nitrile Rubber (Challenger O-Ring)",
          transitionTemp: 220, // Tg
          roomEnergy: 120, // J
          cryoEnergy: 2,
          isFCC: false,
          color: T.orange,
          desc: "Glass transition causes rubber to turn rigid as glass below 220 K.",
        };
      case "carbon_steel":
        return {
          name: "BCC Carbon Steel (Titanic Hull)",
          transitionTemp: 210, // DBTT
          roomEnergy: 180,
          cryoEnergy: 15,
          isFCC: false,
          color: T.cyan,
          desc: "BCC lattice locks dislocations at low temp; fractures catastrophically.",
        };
      case "ss304":
      default:
        return {
          name: "FCC Austenitic SS-304L (Cryo Grade)",
          transitionTemp: 40,
          roomEnergy: 240,
          cryoEnergy: 190,
          isFCC: true,
          color: T.green,
          desc: "FCC crystal lattice retains high impact toughness even at 4 K (LHe).",
        };
    }
  }, [material]);

  const isBrittle = tempK < matProps.transitionTemp;
  const absorbedEnergy = useMemo(() => {
    const fraction = Math.max(0, Math.min(1, (tempK - matProps.transitionTemp + 40) / 80));
    return (matProps.cryoEnergy + fraction * (matProps.roomEnergy - matProps.cryoEnergy)).toFixed(0);
  }, [tempK, matProps]);

  const triggerImpact = () => {
    setStriking(true);
    setAnimTime(0);
  };

  const draw = (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, "#080c14");
    bgGrad.addColorStop(1, "#0d131f");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Anvil & Base
    const anvilY = height - 40;
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(40, anvilY, width - 80, 25);
    ctx.strokeStyle = "#334155";
    ctx.strokeRect(40, anvilY, width - 80, 25);

    // Pendulum pivot
    const pivotX = width / 2;
    const pivotY = 25;
    const armLength = 100;

    // Hammer animation angle
    let angle = -Math.PI / 3; // resting back
    if (striking) {
      const speed = 0.08;
      const t = animTime * speed;
      if (t < Math.PI / 2) {
        angle = -Math.PI / 3 + t * (Math.PI / 3);
      } else {
        // bounce or stop
        const rebound = isBrittle ? 0.1 : 0.6;
        angle = Math.sin((t - Math.PI / 2) * 2) * rebound * Math.exp(-(t - Math.PI / 2));
      }
    }

    const hammerX = pivotX + Math.sin(angle) * armLength;
    const hammerY = pivotY + Math.cos(angle) * armLength;

    // Draw arm
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(hammerX, hammerY);
    ctx.stroke();

    // Pivot pin
    ctx.fillStyle = "#94a3b8";
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Hammer head
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(hammerX - 10, hammerY - 10, 20, 20);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.strokeRect(hammerX - 10, hammerY - 10, 20, 20);

    // Specimen
    const specX = pivotX - 12;
    const specY = anvilY - 20;
    const specW = 24;
    const specH = 20;

    if (striking && animTime > 15 && isBrittle) {
      // Shattered shards
      const spread = Math.min(30, (animTime - 15) * 2);
      ctx.fillStyle = matProps.color;

      // Left piece
      ctx.beginPath();
      ctx.moveTo(specX - spread, specY + 5);
      ctx.lineTo(specX + 8 - spread, specY + specH);
      ctx.lineTo(specX - spread, specY + specH);
      ctx.closePath();
      ctx.fill();

      // Right piece
      ctx.beginPath();
      ctx.moveTo(specX + specW + spread, specY + 2);
      ctx.lineTo(specX + 14 + spread, specY + specH);
      ctx.lineTo(specX + specW + spread, specY + specH);
      ctx.closePath();
      ctx.fill();

      // Flying fragments
      ctx.fillStyle = T.red;
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(specX + 12 + (i - 2) * spread * 0.8, specY - spread * 0.3 + i * 2, 3, 3);
      }

      ctx.fillStyle = T.red;
      ctx.font = "bold 11px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("💥 BRITTLE SHATTER!", pivotX, specY - 25);
    } else {
      // Intact or deformed specimen
      ctx.fillStyle = isBrittle ? matProps.color : (striking && animTime > 15 ? T.green : matProps.color);
      const deform = (striking && animTime > 15 && !isBrittle) ? 4 : 0;
      ctx.beginPath();
      ctx.roundRect(specX - deform, specY + deform, specW + deform * 2, specH - deform, 3);
      ctx.fill();
      ctx.strokeStyle = "#ffffff44";
      ctx.stroke();

      if (striking && animTime > 15 && !isBrittle) {
        ctx.fillStyle = T.green;
        ctx.font = "bold 11px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("🛡️ DUCTILE PLASTIC DEFORMATION", pivotX, specY - 25);
      }
    }

    // Temperature bar
    ctx.fillStyle = "#ffffff33";
    ctx.font = "9px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(`Temp: ${tempK} K (${(tempK - 273.15).toFixed(0)}°C)`, 15, 20);
    ctx.fillText(`Mode: ${isBrittle ? "BRITTLE (Low Toughness)" : "DUCTILE (High Toughness)"}`, 15, 34);

    if (striking) {
      setAnimTime((t) => (t < 50 ? t + 1 : t));
    }
  };

  const canvasRef = useCanvas(draw, [material, tempK, striking, animTime, isBrittle]);

  const buildPrompt = useMemo(
    () => () => `CRYO IMPACT & EMBRITTLEMENT ANALYSIS:
1. Material: ${matProps.name}
2. Temperature: ${tempK} K (${(tempK - 273.15).toFixed(1)} °C)
3. Transition Temperature: ${matProps.transitionTemp} K
4. Behavior: ${isBrittle ? "Catastrophic Brittle Cleavage" : "Ductile Shear Lip Absorption"}
5. Absorbed Charpy Energy: ${absorbedEnergy} Joules

TECHNICAL QUESTIONS:
1. Explain the crystallographic mechanism why Body-Centered Cubic (BCC) metals undergo severe thermal embrittlement via dislocation pinning (Peierls-Nabarro stress), whereas Face-Centered Cubic (FCC) austenitic stainless steels (like 304L, 316L) remain ductile all the way to 4 K.
2. Discuss the historical significance of the 1986 Space Shuttle Challenger disaster, specifically how freezing ambient temperatures hardened the FKM/silicone O-rings beyond their glass transition temperature (Tg).
3. How do engineers select materials for liquid hydrogen (20 K) and liquid oxygen (90 K) rocket tanks to completely avoid brittle catastrophic rupture?`,
    [matProps, tempK, isBrittle, absorbedEnergy]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={200} maxWidth={280} />

      <PillRow>
        <Pill active={material === "rubber"} onClick={() => { setMaterial("rubber"); setStriking(false); }} color={T.orange}>
          Rubber O-Ring
        </Pill>
        <Pill active={material === "carbon_steel"} onClick={() => { setMaterial("carbon_steel"); setStriking(false); }} color={T.cyan}>
          Carbon Steel
        </Pill>
        <Pill active={material === "ss304"} onClick={() => { setMaterial("ss304"); setStriking(false); }} color={T.green}>
          SS-304L (Cryo)
        </Pill>
      </PillRow>

      <Slider label="Material Temperature" value={tempK} onChange={(v) => { setTempK(v); setStriking(false); }} min={77} max={300} step={5} unit=" K" color={isBrittle ? T.red : T.green} />

      <div style={{ textAlign: "center", margin: "10px 0" }}>
        <button
          onClick={triggerImpact}
          style={{
            background: isBrittle ? `linear-gradient(135deg, ${T.red}, #991b1b)` : `linear-gradient(135deg, ${T.green}, #065f46)`,
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 18px",
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          🔨 Drop Pendulum Hammer
        </button>
      </div>

      <DataRow>
        <DataBox label="Absorbed Energy" value={`${absorbedEnergy}`} unit="J" color={parseInt(absorbedEnergy) > 50 ? T.green : T.red} />
        <DataBox label="Transition" value={`${matProps.transitionTemp}K`} color={T.cyan} />
        <DataBox label="Lattice" value={matProps.isFCC ? "FCC (Ductile)" : "BCC/Polymer"} color={matProps.isFCC ? T.green : T.orange} />
        <DataBox label="Mode" value={isBrittle ? "SHATTER" : "BEND"} color={isBrittle ? T.red : T.green} />
      </DataRow>

      <InfoBox color={matProps.color}>
        <strong style={{ color: matProps.color }}>Why Metals & Rubber Crack in Cryo:</strong> At room temperature, polymer chains and metal crystal planes easily glide past each other to absorb shock. But when frozen with liquid nitrogen, thermal vibrations vanish and dislocations freeze in place! Ordinary carbon steel and rubber turn as brittle as glass, shattering on impact. Cryogenic tanks must use special Face-Centered Cubic (FCC) metals like Stainless Steel 304L or Aluminum-Lithium that stay flexible down to absolute zero!
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={matProps.color} />

      <ExportBtn
        simId="ductile_brittle"
        getData={() => ({
          material,
          matName: matProps.name,
          tempK,
          tempC: (tempK - 273.15).toFixed(1),
          absorbedEnergyJ: absorbedEnergy,
          isBrittle,
        })}
      />
    </div>
  );
}
