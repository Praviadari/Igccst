import { useState, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function AbsoluteZeroSim() {
  const [tempK, setTempK] = useState(77); // Kelvin (0 to 350)
  const [gasType, setGasType] = useState("nitrogen"); // nitrogen, helium, hydrogen

  const gasData = {
    nitrogen: { name: "Nitrogen (N2)", molarMass: 28, freezeK: 63, boilK: 77.4, color: T.accent },
    hydrogen: { name: "Hydrogen (H2)", molarMass: 2, freezeK: 14, boilK: 20.3, color: T.pink },
    helium: { name: "Helium (He)", molarMass: 4, freezeK: 0, boilK: 4.22, color: T.gold },
  }[gasType];

  // Physics formulas for layman understanding:
  // RMS molecular velocity: v_rms = sqrt(3 * k_B * T / m)
  // v_rms in m/s: sqrt(3 * 8.314 * T / (M * 1e-3))
  const vRms = Math.sqrt((3 * 8.314 * Math.max(0.01, tempK)) / (gasData.molarMass * 1e-3)).toFixed(0);

  // Average thermal kinetic energy: E_k = (3/2) * k_B * T in zeptojoules (1e-21 J)
  const kEnergyZJ = ((1.5 * 1.38e-23 * tempK) * 1e21).toFixed(2);

  // Pressure ratio compared to room temp (300K)
  const pressureRatio = (tempK / 300).toFixed(2);

  // State of matter
  const stateOfMatter =
    tempK < gasData.freezeK && gasData.freezeK > 0
      ? "SOLID CRYSTAL 🧊"
      : tempK < gasData.boilK
      ? "CRYOGENIC LIQUID 💧"
      : "GAS VAPOR 💨";

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

      // Glass Chamber Container
      const boxW = 160;
      const boxH = 120;
      const boxX = 35;
      const boxY = cy - boxH / 2;

      ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
      ctx.strokeStyle = T.glassBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.fillRect(boxX, boxY, boxW, boxH);

      // Temperature color theme for molecules:
      // High T = orange/red, Mid = cyan/blue, Low = purple/gold
      const speedNorm = Math.sqrt(tempK / 350); // Normalized speed factor

      // Draw 24 animated molecules
      for (let i = 0; i < 24; i++) {
        // Base position using pseudo-random offset
        const baseX = boxX + 15 + ((i % 6) * (boxW - 30)) / 5;
        const baseY = boxY + 15 + (Math.floor(i / 6) * (boxH - 30)) / 3;

        // Vibrational/Brownian displacement proportional to speed
        const phaseX = frame * 0.15 * speedNorm + i * 2.3;
        const phaseY = frame * 0.12 * speedNorm + i * 4.7;

        // If at or near 0K, motion stops (quantum zero-point vibration only)
        const jitterX = tempK === 0 ? 0 : Math.sin(phaseX) * (18 * speedNorm);
        const jitterY = tempK === 0 ? 0 : Math.cos(phaseY) * (14 * speedNorm);

        const px = Math.min(boxX + boxW - 8, Math.max(boxX + 8, baseX + jitterX));
        const py = Math.min(boxY + boxH - 8, Math.max(boxY + 8, baseY + jitterY));

        // Molecule glow
        const molColor = tempK > 200 ? T.orange : tempK > 60 ? T.cyan : tempK > 10 ? T.gold : T.purple;
        ctx.fillStyle = molColor;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();

        // Velocity tail (only if moving fast)
        if (speedNorm > 0.3) {
          ctx.strokeStyle = `${molColor}40`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px - Math.sin(phaseX) * (10 * speedNorm), py - Math.cos(phaseY) * (10 * speedNorm));
          ctx.stroke();
        }
      }

      // Vertical Thermometer Gauge (Right side)
      const thermX = W - 45;
      const thermY = 25;
      const thermH = 140;
      const thermW = 12;

      // Thermometer glass tube
      ctx.fillStyle = T.glass;
      ctx.strokeStyle = T.glassBorder;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(thermX, thermY, thermW, thermH);
      ctx.fillRect(thermX, thermY, thermW, thermH);

      // Mercury / Liquid column
      const fillHeight = (tempK / 350) * thermH;
      const mercuryGrad = ctx.createLinearGradient(0, thermY + thermH, 0, thermY);
      mercuryGrad.addColorStop(0, T.purple);
      mercuryGrad.addColorStop(0.3, T.cyan);
      mercuryGrad.addColorStop(1, T.orange);
      ctx.fillStyle = mercuryGrad;
      ctx.fillRect(thermX + 2, thermY + thermH - fillHeight, thermW - 4, fillHeight);

      // Bulb at bottom
      ctx.beginPath();
      ctx.arc(thermX + thermW / 2, thermY + thermH + 6, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Benchmark tick marks
      const benchmarks = [
        { k: 295, label: "300K Room" },
        { k: 77, label: "77K LN2" },
        { k: 20, label: "20K LH2" },
        { k: 4, label: "4.2K LHe" },
        { k: 0, label: "0K Abs Zero" },
      ];

      benchmarks.forEach((bm) => {
        const by = thermY + thermH - (bm.k / 350) * thermH;
        ctx.strokeStyle = T.gray;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(thermX - 4, by);
        ctx.lineTo(thermX, by);
        ctx.stroke();

        ctx.font = `600 6px ${TECH_FONT}`;
        ctx.fillStyle = bm.k === 0 ? T.purple : bm.k === 77 ? T.cyan : T.dimText;
        ctx.textAlign = "right";
        ctx.fillText(bm.label, thermX - 6, by + 2);
      });

      // HUD overlay inside chamber
      ctx.font = `800 9px ${TECH_FONT}`;
      ctx.textAlign = "left";
      ctx.fillStyle = T.white;
      ctx.fillText(`CHAMBER: ${gasData.name}`, boxX + 6, boxY - 6);

      ctx.font = `800 8px ${MONO_FONT}`;
      ctx.fillStyle = tempK === 0 ? T.purple : tempK < 78 ? T.cyan : T.orange;
      ctx.fillText(stateOfMatter, boxX + 6, boxY + boxH + 14);
    },
    [tempK, gasType, gasData, speedNorm, stateOfMatter],
    { animate: true }
  );

  const buildPrompt = useCallback(
    () => `Absolute Zero & Molecular Thermal Energy Simulator — IGCCST 2026:
ROLE: Physics educator and cryogenic scientist explaining fundamental physics to students and laymen.
TOPIC: Molecular motion at cryogenic temperatures down to Absolute Zero (0 Kelvin / -273.15°C).

PARAMETERS:
1. Gas Tested: ${gasData.name}
2. Temperature: ${tempK} K (${(tempK - 273.15).toFixed(1)} °C)
3. Molecular RMS Speed: ${vRms} m/s (${(parseFloat(vRms) * 3.6).toFixed(0)} km/h)
4. Average Molecular Kinetic Energy: ${kEnergyZJ} zeptojoules (10^-21 J)
5. Relative Pressure (P/P_room): ${pressureRatio}x
6. Phase State: ${stateOfMatter}

EXPLANATION REQUEST:
1. Layman Analogy: Why is temperature simply a measure of how fast atoms jiggle? Describe what happens as you drag the slider from room temperature (speed of sound ~340 m/s) down to 77K and 4.2K.
2. Third Law of Thermodynamics: Why can a system never mathematically reach absolute zero in a finite number of steps?
3. Zero-Point Energy: Explain why quantum mechanics (Heisenberg Uncertainty Principle) prevents atoms from completely stopping even at 0 K.`,
    [gasData, tempK, vRms, kEnergyZJ, pressureRatio, stateOfMatter]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={200} maxWidth={280} />

      <PillRow>
        <Pill active={tempK === 295} onClick={() => setTempK(295)} color={T.orange}>
          Room (295K)
        </Pill>
        <Pill active={tempK === 77} onClick={() => setTempK(77)} color={T.cyan}>
          Liquid N2 (77K)
        </Pill>
        <Pill active={tempK === 20} onClick={() => setTempK(20)} color={T.pink}>
          Liquid H2 (20K)
        </Pill>
        <Pill active={tempK === 4} onClick={() => setTempK(4)} color={T.gold}>
          Liquid He (4K)
        </Pill>
        <Pill active={tempK === 0} onClick={() => setTempK(0)} color={T.purple}>
          Absolute Zero (0K)
        </Pill>
      </PillRow>

      <Slider label="Temperature" value={tempK} onChange={setTempK} min={0} max={350} step={1} unit=" K" color={tempK < 80 ? T.cyan : T.orange} />

      <PillRow>
        <Pill active={gasType === "nitrogen"} onClick={() => setGasType("nitrogen")} color={T.accent}>
          Nitrogen (Air)
        </Pill>
        <Pill active={gasType === "helium"} onClick={() => setGasType("helium")} color={T.gold}>
          Helium (Light)
        </Pill>
        <Pill active={gasType === "hydrogen"} onClick={() => setGasType("hydrogen")} color={T.pink}>
          Hydrogen (Fast)
        </Pill>
      </PillRow>

      <DataRow>
        <DataBox label="Speed v_rms" value={vRms} unit="m/s" color={T.cyan} />
        <DataBox label="Kinetic E" value={kEnergyZJ} unit="zJ" color={T.orange} />
        <DataBox label="Celsius" value={`${(tempK - 273.15).toFixed(0)}°`} unit="C" color={T.accent} />
        <DataBox label="Pressure" value={`${pressureRatio}x`} color={T.green} />
      </DataRow>

      <InfoBox color={T.cyan}>
        <strong style={{ color: T.cyan }}>What is Temperature?</strong> Temperature is nothing more than the speed of jiggling atoms! At room temperature ($300\,\text{K}$), nitrogen molecules zoom at over $500\,\text{m/s}$ ($1,800\,\text{km/h}$). In liquid nitrogen ($77\,\text{K}$), they slow down by half. At **Absolute Zero** ($0\,\text{K} = -273.15^\circ\text{C}$), classical motion ceases completely.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.cyan} />

      <ExportBtn
        simId="absolute_zero"
        getData={() => ({
          tempK,
          celsius: (tempK - 273.15).toFixed(1),
          gasType,
          vRms,
          kEnergyZJ,
          pressureRatio,
          stateOfMatter,
        })}
        color={T.cyan}
      />
    </div>
  );
}
