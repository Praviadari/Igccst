import { useState, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function CryoFreezingSim() {
  const [freezeMethod, setFreezeMethod] = useState("cryo_flash"); // cryo_flash, standard_freezer, slow_chill
  const [sampleType, setSampleType] = useState("biological_cell"); // biological_cell, food_tissue, blood
  const [waterContentPct, setWaterContentPct] = useState(85); // %

  const methodData = {
    cryo_flash: { name: "Liquid N2 Flash Freeze (-196°C)", coolingRate: 150, iceCrystalSizeUm: 0.8, cellDamagePct: 2, color: T.accent },
    standard_freezer: { name: "Kitchen Freezer (-20°C)", coolingRate: 0.5, iceCrystalSizeUm: 65, cellDamagePct: 68, color: T.orange },
    slow_chill: { name: "Slow Ice Bath (0°C)", coolingRate: 0.1, iceCrystalSizeUm: 180, cellDamagePct: 95, color: T.red },
  }[freezeMethod];

  // Vitrification / Glass state achieved if cooling rate > 100°C/s
  const isVitrified = methodData.coolingRate > 100;
  // Freezing time for 10mm sample (seconds)
  const freezeTimeSec = (300 / methodData.coolingRate).toFixed(1);

  // Cell survival rate (%)
  const cellSurvivalRate = (100 - methodData.cellDamagePct * (waterContentPct / 85)).toFixed(0);

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

      // Microscopic Cell Viewing Field
      const viewR = 65;
      ctx.fillStyle = "rgba(10, 25, 45, 0.7)";
      ctx.strokeStyle = T.glassBorder;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, viewR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Crosshair Reticle (Microscope HUD)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx - viewR, cy);
      ctx.lineTo(cx + viewR, cy);
      ctx.moveTo(cx, cy - viewR);
      ctx.lineTo(cx, cy + viewR);
      ctx.stroke();

      // Cell Membrane representation
      const cellR = 38;
      const isDamaged = methodData.cellDamagePct > 40;

      ctx.save();
      ctx.translate(cx, cy);

      // If damaged, cell wall is ruptured and misshapen
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 2; a += 0.2) {
        const jagged = isDamaged ? Math.sin(a * 7) * 8 + Math.cos(a * 3) * 6 : Math.sin(a * 4 + frame * 0.05) * 1.5;
        const rad = cellR + jagged;
        const x = Math.cos(a) * rad;
        const y = Math.sin(a) * rad;
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      // Cell interior cytoplasm
      ctx.fillStyle = isDamaged ? "rgba(255, 77, 109, 0.25)" : "rgba(77, 255, 184, 0.25)";
      ctx.fill();
      ctx.strokeStyle = isDamaged ? T.red : T.green;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Cell nucleus
      ctx.fillStyle = isDamaged ? "rgba(255, 77, 109, 0.6)" : "rgba(77, 255, 184, 0.7)";
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();

      // Ice Crystals Pattern
      if (freezeMethod === "cryo_flash") {
        // Thousands of harmless nano-crystals (amorphous smooth glass)
        ctx.fillStyle = "rgba(76, 201, 240, 0.6)";
        for (let i = 0; i < 30; i++) {
          const ang = i * 0.5 + frame * 0.02;
          const dist = 5 + (i * 2) % (cellR - 8);
          ctx.beginPath();
          ctx.arc(Math.cos(ang) * dist, Math.sin(ang) * dist, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Giant sharp dagger-like ice spikes puncturing the cell wall!
        const numSpikes = freezeMethod === "slow_chill" ? 5 : 8;
        ctx.strokeStyle = T.orange;
        ctx.lineWidth = 2;
        ctx.fillStyle = "rgba(255, 150, 50, 0.5)";

        for (let i = 0; i < numSpikes; i++) {
          const ang = (i / numSpikes) * Math.PI * 2;
          const spikeLen = freezeMethod === "slow_chill" ? 55 : 35;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang - 0.15) * 8, Math.sin(ang - 0.15) * 8);
          ctx.lineTo(Math.cos(ang) * spikeLen, Math.sin(ang) * spikeLen);
          ctx.lineTo(Math.cos(ang + 0.15) * 8, Math.sin(ang + 0.15) * 8);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }

      ctx.restore();

      // HUD & Diagnostics
      ctx.font = `800 8px ${TECH_FONT}`;
      ctx.textAlign = "left";
      ctx.fillStyle = isDamaged ? T.red : T.green;
      ctx.fillText(
        isDamaged ? `▲ CELL RUPTURE (LARGE JAGGED ICE)` : `● VITRIFIED / INTACT (NANO-CRYSTALS)`,
        10,
        18
      );

      ctx.font = `700 8px ${MONO_FONT}`;
      ctx.fillStyle = T.dimText;
      ctx.fillText(`Cooling Rate: ${methodData.coolingRate}°C/s`, 10, 30);

      ctx.textAlign = "right";
      ctx.fillStyle = isDamaged ? T.red : T.green;
      ctx.fillText(`Survival: ${cellSurvivalRate}%`, W - 10, 18);
      ctx.fillStyle = T.cyan;
      ctx.fillText(`Crystal: ${methodData.iceCrystalSizeUm} μm`, W - 10, 30);
    },
    [freezeMethod, sampleType, waterContentPct, methodData, cellSurvivalRate],
    { animate: true }
  );

  const buildPrompt = useCallback(
    () => `Cryogenic Flash Freezing vs Slow Freezing Cellular Cryobiology — IGCCST 2026:
ROLE: Cryobiologist and food preservation scientist explaining cell vitrification to students.
CONFERENCE: Indo-German Conference on Cryogenics for Sustainable Technologies.

FREEZING CONDITIONS:
1. Freezing Method: ${methodData.name}
2. Sample: ${sampleType.toUpperCase()} (Water Content: ${waterContentPct}%)
3. Cooling Rate: ${methodData.coolingRate} °C/second
4. Average Ice Crystal Diameter: ${methodData.iceCrystalSizeUm} μm
5. Freezing Duration (10mm sample): ${freezeTimeSec} seconds
6. Cellular Membrane Damage: ${methodData.cellDamagePct}%
7. Post-Thaw Cell Survival: ${cellSurvivalRate}%
8. Vitrification Achieved: ${isVitrified ? "YES (Glassy Amorphous Ice)" : "NO (Hexagonal Dendritic Ice Spikes)"}

INQUIRY TOPICS:
1. The Physics of Ice Crystallization: How does super-rapid cooling (>100°C/s) bypass the nucleation-growth window of hexagonal ice (Ih), freezing water into harmless amorphous glass?
2. Cell Lysis & Texture Loss: Why do frozen strawberries turn into soggy mush upon thawing in a home freezer, whereas cryogenic liquid nitrogen freezing keeps them firm and fresh?
3. Cryopreservation of Life: What cryoprotectants (DMSO, glycerol) and rapid cooling protocols are used to cryopreserve human embryos, stem cells, and organs?`,
    [methodData, sampleType, waterContentPct, freezeTimeSec, cellSurvivalRate, isVitrified]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={200} maxWidth={280} />

      <PillRow>
        <Pill active={freezeMethod === "cryo_flash"} onClick={() => setFreezeMethod("cryo_flash")} color={T.accent}>
          ⚡ LN2 Flash (-196°C)
        </Pill>
        <Pill active={freezeMethod === "standard_freezer"} onClick={() => setFreezeMethod("standard_freezer")} color={T.orange}>
          Home Freezer (-20°C)
        </Pill>
        <Pill active={freezeMethod === "slow_chill"} onClick={() => setFreezeMethod("slow_chill")} color={T.red}>
          Slow Chill (0°C)
        </Pill>
      </PillRow>

      <PillRow>
        <Pill active={sampleType === "biological_cell"} onClick={() => setSampleType("biological_cell")} color={T.green}>
          Stem Cell
        </Pill>
        <Pill active={sampleType === "food_tissue"} onClick={() => setSampleType("food_tissue")} color={T.gold}>
          Strawberry / Food
        </Pill>
        <Pill active={sampleType === "blood"} onClick={() => setSampleType("blood")} color={T.pink}>
          Red Blood Cells
        </Pill>
      </PillRow>

      <Slider label="Tissue Water Content" value={waterContentPct} onChange={setWaterContentPct} min={60} max={95} step={5} unit=" %" color={T.cyan} />

      <DataRow>
        <DataBox label="Survival" value={`${cellSurvivalRate}%`} color={parseInt(cellSurvivalRate) > 80 ? T.green : T.red} />
        <DataBox label="Ice Size" value={`${methodData.iceCrystalSizeUm}`} unit="μm" color={T.cyan} />
        <DataBox label="Freeze Time" value={`${freezeTimeSec}s`} color={T.gold} />
        <DataBox label="Cool Rate" value={`${methodData.coolingRate}°/s`} color={T.accent} />
      </DataRow>

      <InfoBox color={T.accent}>
        <strong style={{ color: T.accent }}>Why Does Slow Freezing Destroy Food & Cells?</strong> When food or living cells freeze slowly in a kitchen freezer, water molecules have minutes to assemble into giant, razor-sharp hexagonal ice crystals that puncture delicate cell membranes like daggers! In liquid nitrogen ($-196^\circ\text{C}$), the water flashes solid in seconds, forming sub-micron nano-crystals that leave cell walls completely intact.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.accent} />

      <ExportBtn
        simId="cryo_freezing"
        getData={() => ({
          freezeMethod,
          sampleType,
          waterContentPct,
          coolingRate: methodData.coolingRate,
          iceCrystalSizeUm: methodData.iceCrystalSizeUm,
          cellSurvivalRate,
          freezeTimeSec,
        })}
        color={T.accent}
      />
    </div>
  );
}
