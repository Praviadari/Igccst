import { useState, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn, ChallengeBox } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function DilutionFridgeSim() {
  const [targetMKT, setTargetMKT] = useState(15); // Millikelvin target (5 to 100 mK)
  const [he3RateUMol, setHe3RateUMol] = useState(250); // He-3 circulation rate in micromol/s
  const [heatLoadUW, setHeatLoadUW] = useState(15); // Applied heat load in microWatts (RF wiring, qubit dissipation)
  const [precoolType, setPrecoolType] = useState("dry"); // dry (pulse tube cryogen-free), wet (LHe bath)

  // Dilution Refrigerator Physics
  // Cooling power at mixing chamber: Q_dot = 84 * n_dot_3 * (T_mc^2 - 0.36 * T_still^2) [μW]
  // with n_dot_3 in μmol/s, T in Kelvin
  // At lowest temperatures (T_still ~ 0.7K >> T_mc), heat exchange efficiency gives:
  // Q_cooling ≈ 84 * n_dot_3 * T_mc^2
  const tMcKelvin = targetMKT * 1e-3;
  const maxCoolingUW = 84 * (he3RateUMol * 1e-6) * Math.pow(tMcKelvin, 2) * 1e6; // in μW

  // Equilibrium base temperature with given heat load:
  // T_base = sqrt((heatLoad + Q_parasitic) / (84 * n_dot_3))
  const qParasiticUW = precoolType === "dry" ? 1.5 : 0.8;
  const eqBaseMKT = (Math.sqrt((heatLoadUW + qParasiticUW) / (84 * he3RateUMol)) * 1000).toFixed(1);

  // Still heating power required to vaporize He-3 (L_vap,He3 ≈ 22 J/mol)
  const stillPowerMW = ((he3RateUMol * 1e-6) * 22 * 1000).toFixed(2);

  // Entropy change of mixing ΔS_mix
  const deltaS = (he3RateUMol * 0.082).toFixed(1);

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const canvasTheme = getCanvasTheme();
      const cx = W / 2;

      // Dark background
      const bg = ctx.createRadialGradient(cx, H / 2, 0, cx, H / 2, W / 2);
      bg.addColorStop(0, canvasTheme.bgStart);
      bg.addColorStop(1, canvasTheme.bgEnd);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Cryostat Stages Vertical Layout (Gold-plated OFHC copper plates)
      const plates = [
        { label: "50 K Plate", y: 32, w: 180, color: T.orange, temp: "50 K" },
        { label: "4 K Plate (PT)", y: 64, w: 160, color: T.gold, temp: "4.2 K" },
        { label: "Still Plate", y: 98, w: 140, color: T.cyan, temp: "0.8 K" },
        { label: "Cold Plate", y: 130, w: 120, color: T.accentDark, temp: "100 mK" },
        { label: "Mixing Chamber", y: 164, w: 100, color: T.purple, temp: `${eqBaseMKT} mK` },
      ];

      // Structural suspension rods
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 75, 20);
      ctx.lineTo(cx - 40, 164);
      ctx.moveTo(cx + 75, 20);
      ctx.lineTo(cx + 40, 164);
      ctx.stroke();

      // RF coaxial lines going to mixing chamber
      ctx.strokeStyle = T.pink;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 55, 20);
      ctx.lineTo(cx - 30, 98);
      ctx.lineTo(cx - 15, 164);
      ctx.stroke();

      // Draw each cryostat thermal plate
      plates.forEach((p, idx) => {
        // Gold plate bar
        ctx.fillStyle = "rgba(248, 150, 30, 0.4)";
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - p.w / 2, p.y, p.w, 8);
        ctx.fillRect(cx - p.w / 2, p.y, p.w, 8);

        // Stage temperature label
        ctx.font = `800 7px ${MONO_FONT}`;
        ctx.fillStyle = p.color;
        ctx.textAlign = "left";
        ctx.fillText(p.temp, cx + p.w / 2 + 6, p.y + 7);

        ctx.textAlign = "right";
        ctx.fillStyle = T.dimText;
        ctx.fillText(p.label, cx - p.w / 2 - 6, p.y + 7);
      });

      // Mixing Chamber Cell (Bottom)
      const mcY = 168;
      const mcW = 44;
      const mcH = 22;

      ctx.fillStyle = T.glass;
      ctx.strokeStyle = T.purple;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - mcW / 2, mcY, mcW, mcH);
      ctx.fillRect(cx - mcW / 2, mcY, mcW, mcH);

      // Phase boundary: Concentrated He-3 (top) and Dilute He-3 in He-4 (bottom)
      // Concentrated phase (rich blue)
      ctx.fillStyle = "rgba(67, 97, 238, 0.6)";
      ctx.fillRect(cx - mcW / 2 + 2, mcY + 2, mcW - 4, 8);

      // Dilute phase (pale cyan)
      ctx.fillStyle = "rgba(77, 255, 184, 0.4)";
      ctx.fillRect(cx - mcW / 2 + 2, mcY + 11, mcW - 4, 9);

      // Phase boundary line
      ctx.strokeStyle = T.white;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - mcW / 2 + 2, mcY + 10);
      ctx.lineTo(cx + mcW / 2 - 2, mcY + 10);
      ctx.stroke();

      // He-3 crossing phase boundary (osmotic cooling effect)
      ctx.fillStyle = T.cyan;
      for (let i = 0; i < 4; i++) {
        const dx = cx - 12 + i * 8;
        const dy = mcY + 6 + ((frame * 1.5 + i * 5) % 12);
        ctx.beginPath();
        ctx.arc(dx, dy, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Qubit package mounted at bottom
      ctx.fillStyle = T.green;
      ctx.fillRect(cx - 8, mcY + mcH, 16, 5);
      ctx.fillStyle = T.white;
      ctx.font = `700 5px ${TECH_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText("QUBIT", cx, mcY + mcH + 4);

      // Quantum coherence glow
      const glow = Math.sin(frame * 0.1) * 0.3 + 0.7;
      ctx.strokeStyle = `rgba(77, 255, 184, ${glow})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, mcY + mcH + 2, 12, 0, Math.PI * 2);
      ctx.stroke();

      // HUD
      ctx.font = `800 8px ${TECH_FONT}`;
      ctx.textAlign = "left";
      ctx.fillStyle = T.purple;
      ctx.fillText(`${precoolType.toUpperCase()} DILUTION REFRIGERATOR`, 10, 16);
    },
    [targetMKT, he3RateUMol, heatLoadUW, precoolType, eqBaseMKT],
    { animate: true }
  );

  const buildPrompt = useCallback(
    () => `Dilution Refrigerator Millikelvin Thermodynamics & Quantum Processor Cooling — IGCCST 2026:
ROLE: Ultra-low temperature physicist and quantum computing hardware cryogenic architect.
CONFERENCE: Indo-German Conference on Cryogenics for Sustainable Technologies, IIT Kharagpur.

REFRIGERATION PARAMETERS:
1. Architecture: Cryogen-Free (Dry) Dilution Unit with Pulse Tube Precooling
2. Target Temperature: ${targetMKT} mK (Achieved Base T: ${eqBaseMKT} mK)
3. ³He Circulation Rate: ${he3RateUMol} μmol/s
4. Applied Thermal Load (Qubit & Line Dissipation): ${heatLoadUW} μW
5. Maximum Mixing Chamber Cooling Power: ${maxCoolingUW.toFixed(1)} μW
6. Still Boiler Heating Power: ${stillPowerMW} mW
7. Mixing Entropy Flow: ${deltaS} mJ/K·s

IN-DEPTH QUANTUM CRYOGENICS INQUIRY:
1. Phase Boundary Physics: Explain how the finite solubility of ³He in ⁴He (~6.6% at T -> 0 K) enables continuous evaporative-like cooling down to 5 mK via enthalpy of mixing across the inverted phase boundary.
2. High-Frequency Attenuation & Heat Sinking: How do copper powder filters, circulators, and Eccosorb filters thermalize microwave lines at 4K, 800mK, and 15mK without causing thermal quench of superconducting transmon qubits?
3. Indo-German Quantum Roadmap: Address collaborative hardware development between TIFR/IISc (National Quantum Mission) and German institutes (Walther-Meissner-Institut, FZ Jülich).`,
    [targetMKT, eqBaseMKT, he3RateUMol, heatLoadUW, maxCoolingUW, stillPowerMW, deltaS]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={200} maxWidth={280} />

      <ChallengeBox
        title="Sub-10 Millikelvin Quantum Challenge"
        goal="Achieve an ultra-low base temperature below 10 mK to keep quantum qubits coherent!"
        isCompleted={parseFloat(eqBaseMKT) < 10}
        hint="Boost ³He circulation rate to 400+ μmol/s and lower applied heat load below 5 μW."
        color={T.purple}
      />

      <PillRow>
        <Pill active={precoolType === "dry"} onClick={() => setPrecoolType("dry")} color={T.accent}>
          Dry (Cryogen-Free)
        </Pill>
        <Pill active={precoolType === "wet"} onClick={() => setPrecoolType("wet")} color={T.gold}>
          Wet (Liquid He)
        </Pill>
      </PillRow>

      <Slider label="Target Temperature" value={targetMKT} onChange={setTargetMKT} min={5} max={80} step={1} unit=" mK" color={T.purple} />
      <Slider label="³He Circulation Rate" value={he3RateUMol} onChange={setHe3RateUMol} min={50} max={600} step={25} unit=" μmol/s" color={T.cyan} />
      <Slider label="Mixing Chamber Heat Load" value={heatLoadUW} onChange={setHeatLoadUW} min={1} max={50} step={1} unit=" μW" color={T.orange} />

      <DataRow>
        <DataBox label="Base Temp" value={`${eqBaseMKT}`} unit="mK" color={T.purple} />
        <DataBox label="Cooling Q" value={maxCoolingUW.toFixed(1)} unit="μW" color={T.green} />
        <DataBox label="Still Heat" value={stillPowerMW} unit="mW" color={T.gold} />
        <DataBox label="³He Rate" value={he3RateUMol} unit="μmol/s" color={T.cyan} />
      </DataRow>

      <InfoBox color={T.purple}>
        <strong style={{ color: T.purple }}>Dilution Refrigeration:</strong> Below 0.87 K, a mixture of Helium-3 and Helium-4 spontaneously separates into a concentrated ³He phase floating on a dilute ³He-in-⁴He phase. Evaporating ³He atoms across this phase boundary absorbs heat continuously, reaching millikelvin temperatures (&lt; 10 mK) for superconducting quantum computers.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.purple} />

      <ExportBtn
        simId="dilution_fridge"
        getData={() => ({
          precoolType,
          targetMKT,
          eqBaseMKT,
          he3RateUMol,
          heatLoadUW,
          maxCoolingUW: maxCoolingUW.toFixed(2),
          stillPowerMW,
        })}
        color={T.purple}
      />
    </div>
  );
}
