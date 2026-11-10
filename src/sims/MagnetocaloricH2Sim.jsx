import { useState, useCallback, useMemo } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme, prng } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn, ChallengeBox } from "../components";
import { AIInsight } from "../components/AIInsight";
import { MCE_MATERIALS, amrLiquefier } from "./models/newSimModels";

// Magnetocaloric (active magnetic regenerator) hydrogen liquefaction — IGCCST 2026 talk SP11
// (T. Gottschall, HZDR / Magnotherm, HyLICAL project) and poster PP14 (IIT Kharagpur, AMRR heat exchangers).
const CONVENTIONAL_ETA = 0.23; // second-law efficiency of large industrial plants, as quoted in SP11

export default function MagnetocaloricH2Sim() {
  const [matKey, setMatKey] = useState("laves");
  const [B, setB] = useState(2); // T
  const [precool, setPrecool] = useState(false);
  const [kgPerDay, setKgPerDay] = useState(100);
  const [etaPct, setEtaPct] = useState(30); // magnetic route second-law efficiency
  const [spanFactor, setSpanFactor] = useState(2); // regenerator span / ΔTad per layer

  const mat = MCE_MATERIALS[matKey];
  const r = useMemo(
    () => amrLiquefier({ mat, B, precool, kgPerDay, eta: etaPct / 100, spanFactor }),
    [mat, B, precool, kgPerDay, etaPct, spanFactor]
  );
  const conv = useMemo(
    () => amrLiquefier({ mat, B, precool, kgPerDay, eta: CONVENTIONAL_ETA, spanFactor }),
    [mat, B, precool, kgPerDay, spanFactor]
  );
  const savingPct = (1 - r.kWhPerKg / conv.kWhPerKg) * 100;

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const th = getCanvasTheme();
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, th.bgStart);
      bg.addColorStop(1, th.bgEnd);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Cascade of AMR layers from the warm end (top) to 20 K (bottom)
      const n = Math.min(r.stages, 12);
      const top = 26, bottom = H - 34, x0 = 70, w = 110;
      const hStage = (bottom - top) / n;
      const magnetPhase = (Math.sin(frame * 0.05) + 1) / 2; // 0 → field off, 1 → field on
      for (let i = 0; i < n; i++) {
        const y = top + i * hStage;
        const tHot = r.Tin - (r.span * i) / n;
        const tCold = r.Tin - (r.span * (i + 1)) / n;
        const frac = i / Math.max(1, n - 1);
        const col = `rgba(${Math.round(255 - 180 * frac)}, ${Math.round(120 + 80 * frac)}, ${Math.round(80 + 170 * frac)}, 0.75)`;
        ctx.fillStyle = col;
        ctx.fillRect(x0, y + 2, w, hStage - 4);
        // Grains of magnetocaloric material warming when magnetised
        for (let k = 0; k < 14; k++) {
          const gx = x0 + 6 + prng(i + 1, k) * (w - 12);
          const gy = y + 4 + prng(i + 7, k + 3) * (hStage - 8);
          ctx.fillStyle = magnetPhase > 0.5 ? "rgba(255,200,120,0.9)" : "rgba(160,220,255,0.9)";
          ctx.fillRect(gx, gy, 2, 2);
        }
        ctx.font = `600 7px ${MONO_FONT}`;
        ctx.fillStyle = T.white;
        ctx.textAlign = "right";
        ctx.fillText(`${tHot.toFixed(0)}→${tCold.toFixed(0)} K`, x0 - 4, y + hStage / 2 + 3);
      }
      // Magnet sliding on/off the regenerator column
      const mx = x0 + w + 8 - (1 - magnetPhase) * 24;
      ctx.strokeStyle = T.orange;
      ctx.lineWidth = 3;
      ctx.strokeRect(mx, top - 2, 16, bottom - top + 4);
      ctx.font = `800 7px ${TECH_FONT}`;
      ctx.fillStyle = T.orange;
      ctx.textAlign = "left";
      ctx.fillText(`${B} T`, mx + 20, top + 8);
      ctx.fillText(magnetPhase > 0.5 ? "FIELD ON · heat out" : "FIELD OFF · absorbs heat", mx + 20, top + 18);

      // Helium exchange gas flowing through the beds
      ctx.fillStyle = T.cyan;
      for (let k = 0; k < 10; k++) {
        const py = top + ((frame * 1.2 + k * 17) % (bottom - top));
        const dir = magnetPhase > 0.5 ? 1 : -1;
        ctx.beginPath();
        ctx.arc(x0 + w / 2 + dir * 30 * Math.sin(k), dir > 0 ? py : bottom - (py - top), 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // LH2 collecting at the cold end
      const fill = 6 + 6 * Math.sin(frame * 0.02);
      ctx.fillStyle = "rgba(76, 201, 240, 0.35)";
      ctx.fillRect(x0, bottom + 6, w, 18);
      ctx.fillStyle = "rgba(76, 201, 240, 0.85)";
      ctx.fillRect(x0, bottom + 24 - fill, w, fill);
      ctx.fillStyle = T.white;
      ctx.font = `800 7px ${TECH_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText("LH₂ · 20.3 K · para", x0 + w / 2, bottom + 17);

      ctx.textAlign = "left";
      ctx.fillStyle = T.gold;
      ctx.font = `800 8px ${TECH_FONT}`;
      ctx.fillText(`AMR CASCADE · ${r.stages} LAYERS · ${precool ? "LN2 PRECOOLED" : "FROM 300 K"}`, 8, 13);
    },
    [r, B, precool],
    { animate: true }
  );

  const buildPrompt = useCallback(
    () => `Magnetocaloric hydrogen liquefaction (active magnetic regenerator) — IGCCST 2026, IIT Kharagpur:
ROLE: Cryogenic process engineer evaluating magnetic refrigeration for LH2.

CASE:
1. Refrigerant: ${mat.name}; field ${B} T → ΔT_ad ≈ ${r.dTad.toFixed(1)} K per layer
2. Feed: ${precool ? "LN2-precooled at 77 K" : "ambient 300 K"}; span to 20.3 K = ${r.span.toFixed(0)} K → ${r.stages} regenerator layers
3. Production: ${kgPerDay} kg/day; ideal work ${r.kWhPerKgIdeal.toFixed(2)} kWh/kg from this feed
4. Magnetic route at ${etaPct}% second-law efficiency: ${r.kWhPerKg.toFixed(2)} kWh/kg, ${r.powerKW.toFixed(1)} kW
5. Conventional route at 23% (figure quoted at IGCCST 2026): ${conv.kWhPerKg.toFixed(2)} kWh/kg

QUESTIONS:
1. Why does a regenerator let an AMR span far more than the material's adiabatic temperature change?
2. Which material families (Ho, Laves phases, RGa2) suit 20–77 K and why does the Curie temperature have to be graded along the bed?
3. How do hot- and cold-end heat exchanger conductances limit real AMR cooling power (IIT KGP poster PP14)?
4. Where must ortho-para conversion catalyst sit in a magnetic liquefier?`,
    [mat, B, r, precool, kgPerDay, etaPct, conv]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={300} height={210} maxWidth={340} label="Active magnetic regenerator cascade liquefying hydrogen" />

      <ChallengeBox
        title="Half-the-Energy Challenge"
        goal="Liquefy hydrogen with at least 40% less electricity than a conventional plant, using no more than 4 regenerator layers."
        isCompleted={savingPct >= 40 && r.stages <= 4}
        hint="Precool with LN2, raise the field, and push the second-law efficiency of the magnetic cycle above ~40%."
        color={T.gold}
      />

      <PillRow>
        {Object.entries(MCE_MATERIALS).map(([k, m]) => (
          <Pill key={k} active={matKey === k} onClick={() => setMatKey(k)} color={T.gold}>
            {m.name}
          </Pill>
        ))}
      </PillRow>
      <PillRow>
        <Pill active={precool} onClick={() => setPrecool(true)} color={T.cyan}>LN₂ precool (77 K)</Pill>
        <Pill active={!precool} onClick={() => setPrecool(false)} color={T.orange}>From ambient (300 K)</Pill>
      </PillRow>

      <Slider label="Magnetic Field" value={B} onChange={setB} min={1} max={7} step={0.5} unit=" T" color={T.orange} />
      <Slider label="Regenerator Span ÷ ΔT_ad" value={spanFactor} onChange={setSpanFactor} min={1} max={5} step={0.5} unit="×" color={T.cyan} />
      <Slider label="Magnetic Cycle 2nd-Law Efficiency" value={etaPct} onChange={setEtaPct} min={15} max={70} step={1} unit=" %" color={T.green} />
      <Slider label="Production Rate" value={kgPerDay} onChange={setKgPerDay} min={5} max={5000} step={5} unit=" kg/day" color={T.pink} />

      <DataRow>
        <DataBox label="Magnetic" value={r.kWhPerKg.toFixed(1)} unit="kWh/kg" color={T.green} />
        <DataBox label="Conventional" value={conv.kWhPerKg.toFixed(1)} unit="kWh/kg" color={T.orange} />
        <DataBox label="Saving" value={savingPct.toFixed(0)} unit="%" color={T.gold} />
        <DataBox label="Layers" value={r.stages} unit="" color={T.cyan} />
      </DataRow>
      <DataRow>
        <DataBox label="ΔT_ad / layer" value={r.dTad.toFixed(1)} unit="K" color={T.orange} />
        <DataBox label="Ideal Work" value={r.kWhPerKgIdeal.toFixed(2)} unit="kWh/kg" color={T.accent} />
        <DataBox label="Power" value={r.powerKW.toFixed(1)} unit="kW" color={T.pink} />
        <DataBox label="Cooling" value={r.coolingKW.toFixed(2)} unit="kW" color={T.cyan} />
      </DataRow>

      <InfoBox color={T.gold}>
        <strong style={{ color: T.gold }}>Magnetic liquefaction:</strong> some rare-earth materials warm up when magnetised and cool down when the
        field is removed (the magnetocaloric effect). A single kick is only a few kelvin, but an <em>active magnetic regenerator</em> pumps helium gas
        back and forth through a bed of the material in step with the field, stacking many small kicks into a large span. Layers with different
        Curie temperatures cover 77 K → 20 K. Large plants today reach a second-law efficiency of only about 23%; magnetic cycles promise much more.
        Teaching model: ideal work is computed from H₂ heat capacity, latent heat and ortho-para conversion; efficiency is your input.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.gold} />

      <ExportBtn
        simId="magnetocaloric_h2"
        getData={() => ({
          material: matKey, fieldT: B, precool, kgPerDay, etaPct, spanFactor,
          layers: r.stages, dTadK: r.dTad.toFixed(2), idealKWhPerKg: r.kWhPerKgIdeal.toFixed(3),
          magneticKWhPerKg: r.kWhPerKg.toFixed(2), conventionalKWhPerKg: conv.kWhPerKg.toFixed(2), powerKW: r.powerKW.toFixed(2),
        })}
        color={T.gold}
      />
    </div>
  );
}
