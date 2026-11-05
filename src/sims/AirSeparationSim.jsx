import { useState, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function AirSeparationSim() {
  const [columnPressBar, setColumnPressBar] = useState(5.5); // bar (High pressure column)
  const [airFeedTPD, setAirFeedTPD] = useState(1200); // Tonnes Per Day of air
  const [refluxRatio, setRefluxRatio] = useState(1.8);
  const [targetProduct, setTargetProduct] = useState("oxygen"); // oxygen, nitrogen, argon

  // Atmospheric air composition: ~78.08% N2, 20.95% O2, 0.93% Ar
  // Boiling points at 1 atm: N2 (77.4K), Ar (87.3K), O2 (90.2K)
  // At higher pressure (5.5 bar): N2 boils at ~94K, O2 at ~110K

  // Separation purity calculation
  const o2PurityPct = Math.min(99.8, 92 + (refluxRatio / 2.5) * 6 + (columnPressBar > 5 ? 1.5 : 0)).toFixed(1);
  const n2PurityPct = Math.min(99.999, 98 + (refluxRatio / 2.5) * 1.8).toFixed(3);
  const arRecoveryPct = Math.min(92, Math.max(50, (refluxRatio * 35) - (columnPressBar * 2))).toFixed(0);

  // Daily product outputs (Tonnes Per Day)
  const o2OutputTPD = (airFeedTPD * 0.2095 * (parseFloat(o2PurityPct) / 100) * 0.96).toFixed(0);
  const n2OutputTPD = (airFeedTPD * 0.7808 * 0.98).toFixed(0);
  const arOutputTPD = (airFeedTPD * 0.0093 * (parseFloat(arRecoveryPct) / 100)).toFixed(1);

  // Specific power consumption (kWh per tonne of O2)
  const specPowerKWhTon = Math.max(180, (260 - (columnPressBar - 4) * 12 + (refluxRatio - 1.5) * 35)).toFixed(0);
  const totalPowerMW = ((parseFloat(o2OutputTPD) * parseFloat(specPowerKWhTon)) / 24000).toFixed(2);

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

      // Distillation Column (Tall vertical vessel in center)
      const colW = 56;
      const colH = 150;
      const colX = cx - colW / 2 - 15;
      const colY = cy - colH / 2 + 5;

      // Column shell (Double column)
      ctx.fillStyle = T.glass;
      ctx.strokeStyle = T.glassBorder;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(colX, colY, colW, colH, 8);
      ctx.fill();
      ctx.stroke();

      // Horizontal Sieve Trays (12 distillation trays)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1;
      const numTrays = 10;
      for (let i = 1; i <= numTrays; i++) {
        const ty = colY + (colH / (numTrays + 1)) * i;
        ctx.beginPath();
        ctx.moveTo(colX + 4, ty);
        ctx.lineTo(colX + colW - 4, ty);
        ctx.stroke();

        // Downcomer alternating liquid drops
        const isLeft = i % 2 === 0;
        const downX = isLeft ? colX + 8 : colX + colW - 8;
        ctx.fillStyle = T.accent;
        ctx.beginPath();
        ctx.arc(downX, ty + 4, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Vapor Bubbles Rising Up Column
      ctx.fillStyle = "rgba(255, 107, 53, 0.5)";
      for (let i = 0; i < 8; i++) {
        const bx = colX + 12 + (i * 5);
        const by = colY + colH - 15 - ((frame * 1.5 + i * 16) % (colH - 30));
        ctx.beginPath();
        ctx.arc(bx, by, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Main Condenser-Reboiler (Center thermal link)
      const rebY = colY + colH * 0.52;
      ctx.fillStyle = "rgba(76, 201, 240, 0.25)";
      ctx.fillRect(colX + 3, rebY - 8, colW - 6, 16);
      ctx.fillStyle = T.white;
      ctx.font = `700 5px ${TECH_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText("REBOILER", colX + colW / 2, rebY + 2);

      // Product Streams:
      // 1. Pure Nitrogen (Top - Gas / Liquid 77K)
      ctx.strokeStyle = T.cyan;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(colX + colW / 2, colY);
      ctx.lineTo(colX + colW / 2, colY - 12);
      ctx.lineTo(colX + colW + 45, colY - 12);
      ctx.stroke();

      ctx.fillStyle = T.cyan;
      ctx.font = `800 7px ${MONO_FONT}`;
      ctx.textAlign = "left";
      ctx.fillText(`N2: ${n2PurityPct}%`, colX + colW + 50, colY - 9);

      // 2. Pure Argon Side-Draw (Middle ~87K)
      ctx.strokeStyle = T.purple;
      ctx.beginPath();
      ctx.moveTo(colX + colW, colY + colH * 0.4);
      ctx.lineTo(colX + colW + 45, colY + colH * 0.4);
      ctx.stroke();

      ctx.fillStyle = T.purple;
      ctx.fillText(`Ar: ${arRecoveryPct}% recov`, colX + colW + 50, colY + colH * 0.4 + 3);

      // 3. Pure Liquid Oxygen (Bottom ~90K)
      ctx.strokeStyle = T.accent;
      ctx.beginPath();
      ctx.moveTo(colX + colW / 2, colY + colH);
      ctx.lineTo(colX + colW / 2, colY + colH + 12);
      ctx.lineTo(colX + colW + 45, colY + colH + 12);
      ctx.stroke();

      ctx.fillStyle = T.accent;
      ctx.fillText(`O2: ${o2PurityPct}%`, colX + colW + 50, colY + colH + 15);

      // Feed Air Inlet (Left side into column)
      ctx.strokeStyle = T.orange;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(15, colY + colH * 0.7);
      ctx.lineTo(colX, colY + colH * 0.7);
      ctx.stroke();

      ctx.fillStyle = T.orange;
      ctx.font = `800 7px ${TECH_FONT}`;
      ctx.textAlign = "left";
      ctx.fillText("AIR FEED", 15, colY + colH * 0.7 - 5);
      ctx.fillText(`${airFeedTPD} TPD`, 15, colY + colH * 0.7 + 12);

      // Top HUD Title
      ctx.font = `800 8px ${TECH_FONT}`;
      ctx.fillStyle = T.white;
      ctx.fillText("CRYOGENIC AIR SEPARATION (ASU)", 10, 16);
    },
    [columnPressBar, airFeedTPD, refluxRatio, o2PurityPct, n2PurityPct, arRecoveryPct],
    { animate: true }
  );

  const buildPrompt = useCallback(
    () => `Cryogenic Air Separation Unit (ASU) Column Simulation — IGCCST 2026:
ROLE: Industrial gas separation engineer and thermodynamic plant designer.
CONFERENCE: Indo-German Conference on Cryogenics for Sustainable Technologies.

PROCESS CONDITIONS:
1. Plant Capacity: ${airFeedTPD} Tonnes Per Day (TPD) Feed Air
2. High-Pressure Column Pressure: ${columnPressBar} bar
3. Column Reflux Ratio (L/D): ${refluxRatio}
4. Oxygen Product Purity: ${o2PurityPct}% (${o2OutputTPD} TPD LOX)
5. Nitrogen Product Purity: ${n2PurityPct}% (${n2OutputTPD} TPD LIN)
6. Crude Argon Recovery: ${arRecoveryPct}% (${arOutputTPD} TPD Liquid Argon)
7. Specific Energy: ${specPowerKWhTon} kWh / Tonne O2
8. Total ASU Compression Power: ${totalPowerMW} MW

TECHNICAL INQUIRY:
1. Fractional Distillation Physics: Explain how boiling point differentials (N2 77.4K, Ar 87.3K, O2 90.2K) enable multi-component separation across sieve trays in a Linde double-column system.
2. The Argon Pinch Problem: Why does argon accumulate midway up the low-pressure column (boiling between N2 and O2), requiring a dedicated crude argon side-arm column to prevent O2 contamination?
3. Green Steel & Hospital Supply: Discuss the strategic importance of large ASUs (e.g. Linde, Air Liquide plants in India and Germany) for green hydrogen DRI steelmaking and medical oxygen reserves.`,
    [airFeedTPD, columnPressBar, refluxRatio, o2PurityPct, o2OutputTPD, n2PurityPct, n2OutputTPD, arRecoveryPct, arOutputTPD, specPowerKWhTon, totalPowerMW]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={200} maxWidth={280} />

      <PillRow>
        <Pill active={targetProduct === "oxygen"} onClick={() => setTargetProduct("oxygen")} color={T.accent}>
          Oxygen Focus (99.5%)
        </Pill>
        <Pill active={targetProduct === "nitrogen"} onClick={() => setTargetProduct("nitrogen")} color={T.cyan}>
          Nitrogen Focus (99.99%)
        </Pill>
        <Pill active={targetProduct === "argon"} onClick={() => setTargetProduct("argon")} color={T.purple}>
          Argon Extraction
        </Pill>
      </PillRow>

      <Slider label="Air Feed Throughput" value={airFeedTPD} onChange={setAirFeedTPD} min={300} max={3000} step={100} unit=" TPD" color={T.orange} />
      <Slider label="Column Pressure" value={columnPressBar} onChange={setColumnPressBar} min={3.0} max={7.5} step={0.5} unit=" bar" color={T.cyan} />
      <Slider label="Reflux Ratio (L/D)" value={refluxRatio} onChange={setRefluxRatio} min={1.0} max={2.8} step={0.1} unit="" color={T.green} />

      <DataRow>
        <DataBox label="O2 Purity" value={`${o2PurityPct}%`} color={T.accent} />
        <DataBox label="O2 Output" value={`${o2OutputTPD}`} unit="TPD" color={T.cyan} />
        <DataBox label="Spec. Power" value={`${specPowerKWhTon}`} unit="kWh/t" color={T.gold} />
        <DataBox label="Total Load" value={`${totalPowerMW}`} unit="MW" color={T.orange} />
      </DataRow>

      <InfoBox color={T.accent}>
        <strong style={{ color: T.accent }}>How Air Separation Units (ASU) Work:</strong> The air we breathe is 78% Nitrogen and 21% Oxygen. An ASU compresses and cools air until it liquefies at -190°C. Because Nitrogen boils at -196°C and Oxygen boils at -183°C, boiling them in a multi-tray column separates pure liquid oxygen from nitrogen gas with surgical precision.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.accent} />

      <ExportBtn
        simId="air_separation"
        getData={() => ({
          columnPressBar,
          airFeedTPD,
          refluxRatio,
          o2PurityPct,
          n2PurityPct,
          arRecoveryPct,
          o2OutputTPD,
          n2OutputTPD,
          arOutputTPD,
          specPowerKWhTon,
          totalPowerMW,
        })}
        color={T.accent}
      />
    </div>
  );
}
