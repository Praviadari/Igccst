import { useState, useCallback, useMemo } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn, ChallengeBox } from "../components";
import { AIInsight } from "../components/AIInsight";
import { SORBENTS, cryosorption, h2GasDensity } from "./models/newSimModels";

// Hydrogen storage by cryosorption — IGCCST 2026 talk SP23 (Prof. Indranil Ghosh, IIT Kharagpur).
const REF_700BAR = h2GasDensity(700, 288); // compressed gas reference, g/L
const REF_LH2 = 70.8; // liquid H2 at 20.3 K, g/L

export default function CryosorptionSim() {
  const [sorbKey, setSorbKey] = useState("ax21");
  const [Tk, setTk] = useState(160);
  const [Pbar, setPbar] = useState(50);
  const [bulk, setBulk] = useState(0.3); // kg/L packed sorbent
  const sorbent = SORBENTS[sorbKey];
  // Total = excess adsorbed + bulk gas in all non-skeletal space (pores + inter-particle), skeletal density ≈ 2.0 kg/L
  const voidFraction = 1 - bulk / 2.0;

  const r = useMemo(() => cryosorption({ sorbent, T: Tk, Pbar, bulkDensity: bulk, voidFraction }), [sorbent, Tk, Pbar, bulk, voidFraction]);
  const gain = r.totalGL / r.emptyTankGL;

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const th = getCanvasTheme();
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, th.bgStart);
      bg.addColorStop(1, th.bgEnd);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Plot: stored H2 (g per litre of tank) vs pressure, sorbent tank vs empty tank, at current T and 77 K
      const L = 32, Rr = W - 10, Tp = 22, B = H - 26;
      const Pmax = 200, Ymax = 80;
      const px = (p) => L + (p / Pmax) * (Rr - L);
      const py = (g) => B - (Math.min(g, Ymax) / Ymax) * (B - Tp);
      ctx.strokeStyle = "rgba(148,163,184,0.25)";
      ctx.font = `600 7px ${MONO_FONT}`;
      ctx.fillStyle = T.dimText;
      ctx.textAlign = "center";
      [0, 50, 100, 150, 200].forEach((p) => {
        ctx.beginPath(); ctx.moveTo(px(p), Tp); ctx.lineTo(px(p), B); ctx.stroke();
        ctx.fillText(`${p}`, px(p), B + 10);
      });
      ctx.fillText("bar", Rr - 6, B - 3);
      ctx.textAlign = "right";
      [0, 20, 40, 60, 80].forEach((g) => ctx.fillText(`${g}`, L - 4, py(g) + 3));
      ctx.textAlign = "left";
      ctx.fillText("g H₂ / L tank", 4, Tp - 8);

      const ref = (g, label, col) => {
        ctx.strokeStyle = col; ctx.setLineDash([4, 3]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(L, py(g)); ctx.lineTo(Rr, py(g)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = col; ctx.font = `700 7px ${MONO_FONT}`; ctx.textAlign = "right";
        ctx.fillText(label, Rr - 2, py(g) - 3);
      };
      ref(REF_LH2, "LH₂ 20 K", T.cyan);
      ref(REF_700BAR, "700 bar 288 K", T.gold);

      const line = (fn, col, w) => {
        ctx.strokeStyle = col; ctx.lineWidth = w;
        ctx.beginPath();
        for (let i = 0; i <= 80; i++) {
          const p = 0.5 + (Pmax - 0.5) * (i / 80);
          const y = py(fn(p));
          if (i === 0) ctx.moveTo(px(p), y); else ctx.lineTo(px(p), y);
        }
        ctx.stroke();
      };
      const opts = { sorbent, bulkDensity: bulk, voidFraction };
      line((p) => cryosorption({ ...opts, T: 77, Pbar: p }).totalGL, "rgba(114,9,183,0.6)", 1.2);
      line((p) => h2GasDensity(p, Tk), T.orange, 1.6);
      line((p) => cryosorption({ ...opts, T: Tk, Pbar: p }).totalGL, T.green, 2.4);

      // Operating point
      const pulse = 3 + Math.sin(frame * 0.12);
      ctx.fillStyle = T.green;
      ctx.shadowColor = T.green; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(px(Pbar), py(r.totalGL), pulse, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = T.orange;
      ctx.beginPath(); ctx.arc(px(Pbar), py(r.emptyTankGL), 2.5, 0, Math.PI * 2); ctx.fill();

      ctx.font = `800 8px ${TECH_FONT}`;
      ctx.textAlign = "left";
      ctx.fillStyle = T.green; ctx.fillText(`SORBENT TANK @ ${Tk} K`, 8, 13);
      ctx.fillStyle = T.orange; ctx.fillText("EMPTY TANK", 150, 13);
      ctx.fillStyle = "rgba(114,9,183,0.9)"; ctx.fillText("77 K", 226, 13);
    },
    [sorbent, Tk, Pbar, bulk, voidFraction, r],
    { animate: true }
  );

  const buildPrompt = useCallback(
    () => `Hydrogen storage by cryosorption — IGCCST 2026 (IIT Kharagpur):
ROLE: Hydrogen storage engineer comparing compressed, liquid and cryo-adsorbed H2.

CASE:
1. Sorbent: ${sorbent.name}, packed at ${bulk} kg/L; adsorption energy ≈ ${(sorbent.E / 1000).toFixed(1)} kJ/mol (Langmuir model)
2. Tank at ${Tk} K and ${Pbar} bar: excess uptake ${r.excessWt.toFixed(2)} wt%
3. Stored: ${r.totalGL.toFixed(1)} g/L vs empty tank ${r.emptyTankGL.toFixed(1)} g/L (×${gain.toFixed(2)}); references 700 bar ≈ ${REF_700BAR.toFixed(0)} g/L, LH2 70.8 g/L
4. Heat released while charging: ≈ ${r.chargeHeatKJperL.toFixed(1)} kJ per litre of tank

QUESTIONS:
1. Why does physisorption need cryogenic temperature but only moderate pressure, and where is the sweet spot between 77 K and ambient?
2. How does the heat of adsorption complicate fast refuelling, and what thermal management options exist?
3. Excess vs absolute vs total uptake — which matters for a vehicle tank?
4. How does dormancy (pressure rise during parking) compare with LH2 boil-off?`,
    [sorbent, bulk, Tk, Pbar, r, gain]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={300} height={210} maxWidth={340} label="Hydrogen stored per litre versus pressure for a sorbent-filled tank and an empty tank" />

      <ChallengeBox
        title="Beat 700 bar at 1/10th the Pressure"
        goal="Store more hydrogen per litre than a 700 bar tank while staying at or below 70 bar."
        isCompleted={r.totalGL >= REF_700BAR && Pbar <= 70}
        hint="Cool the tank toward 77 K and pack the sorbent more densely. Notice how little the sorbent helps at room temperature."
        color={T.green}
      />

      <PillRow>
        {Object.entries(SORBENTS).map(([k, s]) => (
          <Pill key={k} active={sorbKey === k} onClick={() => setSorbKey(k)} color={T.green}>
            {s.name}
          </Pill>
        ))}
      </PillRow>

      <Slider label="Tank Temperature" value={Tk} onChange={setTk} min={50} max={300} step={1} unit=" K" color={T.cyan} />
      <Slider label="Tank Pressure" value={Pbar} onChange={setPbar} min={1} max={200} step={1} unit=" bar" color={T.orange} />
      <Slider label="Sorbent Packing Density" value={bulk} onChange={setBulk} min={0.15} max={0.7} step={0.01} unit=" kg/L" color={T.purple} />

      <DataRow>
        <DataBox label="Stored" value={r.totalGL.toFixed(1)} unit="g/L" color={T.green} />
        <DataBox label="Empty Tank" value={r.emptyTankGL.toFixed(1)} unit="g/L" color={T.orange} />
        <DataBox label="Gain" value={`×${gain.toFixed(2)}`} unit="" color={T.gold} />
        <DataBox label="Excess" value={r.excessWt.toFixed(2)} unit="wt%" color={T.purple} />
      </DataRow>
      <DataRow>
        <DataBox label="Coverage θ" value={(r.theta * 100).toFixed(0)} unit="%" color={T.cyan} />
        <DataBox label="Charge Heat" value={r.chargeHeatKJperL.toFixed(1)} unit="kJ/L" color={T.red} />
        <DataBox label="700 bar ref" value={REF_700BAR.toFixed(0)} unit="g/L" color={T.gold} />
        <DataBox label="LH₂ ref" value={REF_LH2} unit="g/L" color={T.cyan} />
      </DataRow>

      <InfoBox color={T.green}>
        <strong style={{ color: T.green }}>Cryosorption:</strong> hydrogen molecules stick weakly (physisorption, ~4–5 kJ/mol) to the huge internal
        surface of activated carbon or MOFs — more than 2,000 m² per gram. At room temperature thermal motion knocks them off, but near 77 K the
        surface holds a dense layer. The result: densities approaching compressed gas at a tenth of the pressure, and a tank an order of magnitude
        warmer than liquid hydrogen. The catch is heat: every kilogram adsorbed releases heat that must be removed while refuelling.
        Teaching model (Langmuir isotherm + van der Waals gas), calibrated to typical AX-21 data.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.green} />

      <ExportBtn
        simId="cryosorption"
        getData={() => ({
          sorbent: sorbKey, tankK: Tk, pressureBar: Pbar, packingKgPerL: bulk,
          excessWtPct: r.excessWt.toFixed(3), storedGPerL: r.totalGL.toFixed(2), emptyTankGPerL: r.emptyTankGL.toFixed(2),
          chargeHeatKJPerL: r.chargeHeatKJperL.toFixed(2),
        })}
        color={T.green}
      />
    </div>
  );
}
