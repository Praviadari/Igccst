import { useState, useCallback, useMemo } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme, prng } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn, ChallengeBox } from "../components";
import { AIInsight } from "../components/AIInsight";
import { co2SubP, carbonCapture } from "./models/newSimModels";

// Cryogenic carbon capture by desublimation — IGCCST 2026 talk SP04 (Dr. Pavitra Sandilya, IIT Kharagpur)
// and posters PP08 (MNNIT), PP25 (LNG cold energy + CO2 capture), PP27 (cryo-cooled cyclone separator).
const FEEDS = {
  coal: { name: "Coal flue gas", y: 0.13, P: 1 },
  cement: { name: "Cement kiln", y: 0.25, P: 1 },
  natgas: { name: "High-CO₂ natural gas", y: 0.45, P: 6 },
};
const COLD_SOURCES = {
  ln2: { name: "LN₂ wall (77 K)", Tmin: 77 },
  lng: { name: "LNG cold energy (~115 K)", Tmin: 115 },
  mech: { name: "Mechanical refrigeration", Tmin: 120 },
};

export default function CarbonCaptureSim() {
  const [feedKey, setFeedKey] = useState("coal");
  const [yPct, setYPct] = useState(13);
  const [Pbar, setPbar] = useState(1);
  const [coldKey, setColdKey] = useState("mech");
  const [Tcold, setTcold] = useState(160);
  const [recPct, setRecPct] = useState(70); // cold recuperation of the clean gas
  const [etaPct, setEtaPct] = useState(45); // refrigeration second-law efficiency

  const cold = COLD_SOURCES[coldKey];
  const Tc = Math.max(Tcold, cold.Tmin);
  const r = useMemo(
    () => carbonCapture({ yIn: yPct / 100, Pbar, Tcold: Tc, recovery: recPct / 100, eta: etaPct / 100 }),
    [yPct, Pbar, Tc, recPct, etaPct]
  );
  const pickFeed = (k) => { setFeedKey(k); setYPct(Math.round(FEEDS[k].y * 100)); setPbar(FEEDS[k].P); };

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const th = getCanvasTheme();
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, th.bgStart);
      bg.addColorStop(1, th.bgEnd);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Frost line: CO2 partial pressure (log) vs temperature
      const L = 34, Rr = W - 10, Tp = 22, B = H - 26;
      const Tmin = 70, Tmax = 300, pLo = -5, pHi = 1.5; // log10 bar
      const tx = (t) => L + ((t - Tmin) / (Tmax - Tmin)) * (Rr - L);
      const lp = (p) => B - ((Math.log10(p) - pLo) / (pHi - pLo)) * (B - Tp);
      ctx.strokeStyle = "rgba(148,163,184,0.25)";
      ctx.font = `600 7px ${MONO_FONT}`;
      ctx.fillStyle = T.dimText;
      ctx.textAlign = "center";
      [77, 120, 160, 200, 250, 300].forEach((t) => {
        ctx.beginPath(); ctx.moveTo(tx(t), Tp); ctx.lineTo(tx(t), B); ctx.stroke();
        ctx.fillText(`${t} K`, tx(t), B + 10);
      });
      ctx.textAlign = "right";
      [-4, -2, 0].forEach((e) => ctx.fillText(`1e${e}`, L - 3, lp(Math.pow(10, e)) + 3));
      ctx.textAlign = "left";
      ctx.fillText("p_CO₂ (bar)", 4, Tp - 8);

      // Solid region shading below the frost line
      ctx.fillStyle = "rgba(76, 201, 240, 0.08)";
      ctx.beginPath(); ctx.moveTo(tx(Tmin), lp(Math.pow(10, pHi)));
      for (let t = Tmin; t <= 216.6; t += 2) ctx.lineTo(tx(t), Math.max(Tp, lp(co2SubP(t))));
      ctx.lineTo(tx(216.6), Tp); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = T.cyan; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let t = 120; t <= 216.6; t += 1) {
        const y = lp(co2SubP(t));
        if (t === 120) ctx.moveTo(tx(t), y); else ctx.lineTo(tx(t), y);
      }
      ctx.stroke();
      ctx.fillStyle = T.cyan; ctx.font = `800 7px ${TECH_FONT}`;
      ctx.fillText("DRY ICE FORMS", tx(130), lp(co2SubP(200)) - 2);

      // Cooling path of the feed: horizontal until frost point, then down the frost line to T_cold
      const pIn = r.pIn;
      const Tf = Math.min(r.Tfrost, 300);
      ctx.strokeStyle = T.orange; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(tx(300), lp(pIn)); ctx.lineTo(tx(Tf), lp(pIn)); ctx.stroke();
      if (Tc < Tf) {
        ctx.strokeStyle = T.green;
        ctx.beginPath();
        for (let t = Tf; t >= Tc; t -= 1) {
          const y = lp(Math.min(pIn, co2SubP(t)));
          if (t === Tf) ctx.moveTo(tx(t), y); else ctx.lineTo(tx(t), y);
        }
        ctx.stroke();
      }
      // Cold source line
      ctx.strokeStyle = T.purple; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(tx(cold.Tmin), Tp); ctx.lineTo(tx(cold.Tmin), B); ctx.stroke(); ctx.setLineDash([]);

      // Snowflakes of desublimated CO2 falling at the operating point
      const opX = tx(Tc), opY = lp(Math.min(pIn, co2SubP(Tc)));
      ctx.fillStyle = T.white;
      for (let k = 0; k < (r.capture > 0 ? 12 : 0); k++) {
        const fx = opX - 14 + prng(k, 3) * 28;
        const fy = opY + ((frame * 0.8 + k * 9) % 30);
        ctx.fillRect(fx, fy, 1.5, 1.5);
      }
      ctx.fillStyle = r.capture > 0 ? T.green : T.red;
      ctx.beginPath(); ctx.arc(opX, opY, 3.5, 0, Math.PI * 2); ctx.fill();

      ctx.font = `800 8px ${TECH_FONT}`;
      ctx.textAlign = "left";
      ctx.fillStyle = T.orange; ctx.fillText(`FROST POINT ${r.Tfrost.toFixed(0)} K`, 8, 13);
      ctx.fillStyle = r.capture > 0 ? T.green : T.red;
      ctx.textAlign = "right"; ctx.fillText(`CAPTURE ${(r.capture * 100).toFixed(1)}%`, W - 8, 13);
    },
    [r, Tc, cold],
    { animate: true }
  );

  const buildPrompt = useCallback(
    () => `Cryogenic carbon capture by desublimation — IGCCST 2026 (IIT Kharagpur):
ROLE: Process engineer comparing cryogenic CO2 capture with amine scrubbing.

CASE:
1. Feed: ${FEEDS[feedKey].name}, ${yPct}% CO2 at ${Pbar} bar → CO2 partial pressure ${r.pIn.toFixed(3)} bar, frost point ${r.Tfrost.toFixed(1)} K
2. Cold end: ${Tc} K (${cold.name}) → outlet CO2 ${(r.yOut * 100).toFixed(3)}%, capture ${(r.capture * 100).toFixed(1)}%
3. Cold recuperation ${recPct}%, refrigeration at ${etaPct}% of Carnot → ≈ ${isFinite(r.kWhPerT) ? r.kWhPerT.toFixed(0) : "—"} kWh electricity per tonne CO2 (teaching model)

QUESTIONS:
1. Why does capture fraction depend only on the cold-end temperature once the gas is below its frost point?
2. Why is desublimation attractive for high-CO2 streams (natural gas) but costly for dilute flue gas?
3. How does a cryogenically cooled cyclone separator (IIT KGP poster PP27) avoid the dry-ice fouling that forces conventional exchangers to defrost?
4. How can LNG regasification cold energy replace part of the refrigeration duty (poster PP25)?`,
    [feedKey, yPct, Pbar, r, Tc, cold, recPct, etaPct]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={300} height={210} maxWidth={340} label="CO2 frost line and the cooling path of the feed gas" />

      <ChallengeBox
        title="90% Capture Challenge"
        goal="Capture at least 90% of the CO₂ from coal flue gas (13% CO₂, 1 bar) for less than 400 kWh per tonne."
        isCompleted={feedKey === "coal" && r.capture >= 0.9 && r.kWhPerT < 400}
        hint="Cool just enough (find the temperature where capture crosses 90%), recover the cold from the clean gas, and use an efficient refrigerator."
        color={T.cyan}
      />

      <PillRow>
        {Object.entries(FEEDS).map(([k, f]) => (
          <Pill key={k} active={feedKey === k} onClick={() => pickFeed(k)} color={T.orange}>
            {f.name}
          </Pill>
        ))}
      </PillRow>
      <PillRow>
        {Object.entries(COLD_SOURCES).map(([k, c]) => (
          <Pill key={k} active={coldKey === k} onClick={() => setColdKey(k)} color={T.purple}>
            {c.name}
          </Pill>
        ))}
      </PillRow>

      <Slider label="CO₂ in Feed" value={yPct} onChange={setYPct} min={3} max={80} step={1} unit=" %" color={T.orange} />
      <Slider label="Feed Pressure" value={Pbar} onChange={setPbar} min={1} max={20} step={0.5} unit=" bar" color={T.gold} />
      <Slider label={`Cold-End Temperature (≥ ${cold.Tmin} K)`} value={Tcold} onChange={setTcold} min={77} max={220} step={1} unit=" K" color={T.cyan} />
      <Slider label="Cold Recuperation" value={recPct} onChange={setRecPct} min={0} max={95} step={1} unit=" %" color={T.green} />
      <Slider label="Refrigerator % of Carnot" value={etaPct} onChange={setEtaPct} min={15} max={70} step={1} unit=" %" color={T.purple} />

      <DataRow>
        <DataBox label="Capture" value={(r.capture * 100).toFixed(1)} unit="%" color={r.capture >= 0.9 ? T.green : T.orange} />
        <DataBox label="Frost Point" value={r.Tfrost.toFixed(0)} unit="K" color={T.cyan} />
        <DataBox label="Outlet CO₂" value={(r.yOut * 100).toFixed(2)} unit="%" color={T.gold} />
        <DataBox label="Energy" value={isFinite(r.kWhPerT) ? r.kWhPerT.toFixed(0) : "—"} unit="kWh/t" color={T.purple} />
      </DataRow>

      <InfoBox color={T.cyan}>
        <strong style={{ color: T.cyan }}>Capture by freezing:</strong> CO₂ has no liquid phase below 5.2 bar — cooled flue gas turns it straight
        into dry-ice snow (desublimation) once the gas passes its frost point. The colder the exit, the less CO₂ is left in the gas, so capture is
        set by one number: the cold-end temperature. No solvents, and the CO₂ comes out pure and ready to liquefy — but refrigeration costs energy,
        so recovering cold from the clean gas (or using LNG regasification cold) is essential. Teaching model: Clausius–Clapeyron frost line,
        ideal separation, energy from Carnot × your efficiency.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.cyan} />

      <ExportBtn
        simId="carbon_capture"
        getData={() => ({
          feed: feedKey, co2Pct: yPct, pressureBar: Pbar, coldSource: coldKey, coldEndK: Tc, recuperationPct: recPct, etaPct,
          frostPointK: r.Tfrost.toFixed(1), capturePct: (r.capture * 100).toFixed(2), outletCo2Pct: (r.yOut * 100).toFixed(3),
          kWhPerTonne: isFinite(r.kWhPerT) ? r.kWhPerT.toFixed(0) : null,
        })}
        color={T.cyan}
      />
    </div>
  );
}
