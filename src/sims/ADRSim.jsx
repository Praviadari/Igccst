import { useState, useCallback, useMemo } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn, ChallengeBox } from "../components";
import { AIInsight } from "../components/AIInsight";
import { ADR_SALTS, HEAT_SWITCHES, adrEntropyOverR, adrCycle } from "./models/newSimModels";

// Adiabatic Demagnetization Refrigerator — IGCCST 2026 talks SP18 (V. K. Singh, SAC-ISRO),
// SP24 (V. Adyam, IIT KGP), oral OP04 and posters PP01, PP04, PP26.
export default function ADRSim() {
  const [saltKey, setSaltKey] = useState("FAA");
  const [switchKey, setSwitchKey] = useState("sc_al");
  const [Bmax, setBmax] = useState(4); // T
  const [Tbath, setTbath] = useState(4); // K (pulse-tube 4 K stage)
  const [TtargetMK, setTtargetMK] = useState(100); // mK
  const [massG, setMassG] = useState(300); // g of salt
  const [loadUW, setLoadUW] = useState(1); // µW detector load

  const salt = ADR_SALTS[saltKey];
  const sw = HEAT_SWITCHES[switchKey];
  const r = useMemo(
    () => adrCycle({ salt, Bmax, Tbath, Ttarget: TtargetMK / 1000, massG, loadUW, leakUW: sw.leakUW }),
    [salt, Bmax, Tbath, TtargetMK, massG, loadUW, sw]
  );
  const tMinMK = r.Tmin * 1000;
  const holdTxt = r.reachable ? (r.holdHours >= 100 ? r.holdHours.toFixed(0) : r.holdHours.toFixed(1)) : "—";

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const th = getCanvasTheme();
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, th.bgStart);
      bg.addColorStop(1, th.bgEnd);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Axes: x = log10 T from 10 mK to 10 K, y = S/R from 0 to ln(2J+1)
      const L = 34, Rr = W - 10, Tp = 22, B = H - 26;
      const lx = (t) => L + ((Math.log10(t) + 2) / 3) * (Rr - L);
      const Smax = Math.log(2 * salt.J + 1);
      const ly = (s) => B - (s / Smax) * (B - Tp);

      ctx.strokeStyle = th.grid || "rgba(148,163,184,0.25)";
      ctx.lineWidth = 1;
      ctx.font = `600 7px ${MONO_FONT}`;
      ctx.fillStyle = T.dimText;
      ctx.textAlign = "center";
      [0.01, 0.1, 1, 10].forEach((t) => {
        const x = lx(t);
        ctx.beginPath(); ctx.moveTo(x, Tp); ctx.lineTo(x, B); ctx.stroke();
        ctx.fillText(t < 1 ? `${t * 1000} mK` : `${t} K`, x, B + 10);
      });
      ctx.textAlign = "left";
      ctx.fillText("S/R", 4, Tp + 4);
      ctx.fillText(`ln${2 * salt.J + 1}`, 4, ly(Smax) + 10);

      const curve = (Bf, color, label, dash) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.6;
        ctx.setLineDash(dash || []);
        ctx.beginPath();
        for (let i = 0; i <= 120; i++) {
          const t = Math.pow(10, -2 + (3 * i) / 120);
          const x = lx(t), y = ly(adrEntropyOverR(salt, Bf, t));
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = color;
        ctx.font = `700 7px ${MONO_FONT}`;
        ctx.textAlign = "right";
        ctx.fillText(label, Rr - 2, ly(adrEntropyOverR(salt, Bf, 10)) - 3 + (Bf > 0 ? 9 : 0));
      };
      curve(0, T.accent, "B = 0");
      curve(Bmax, T.orange, `B = ${Bmax} T`);
      if (r.reachable && r.Bhold > 0.001) curve(r.Bhold, T.purple, "", [3, 3]);

      // Cycle points: A (bath, B=0) → B (bath, Bmax) → C (target, Bhold) → D (target, 0)
      const A = [lx(Tbath), ly(r.S0bath)];
      const Bp = [lx(Tbath), ly(r.SmagBath)];
      const C = [lx(r.T), ly(r.SmagBath)];
      const D = [lx(r.T), ly(r.S0T)];
      const legs = [
        [A, Bp, T.orange, "1 magnetise · heat out to bath"],
        [Bp, C, T.cyan, "2 demagnetise · switch OPEN"],
        [C, D, T.green, "3 hold T · absorb load"],
      ];
      legs.forEach(([p, q, col]) => {
        ctx.strokeStyle = col;
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
      });
      [A, Bp, C, D].forEach((p, i) => {
        ctx.fillStyle = T.white;
        ctx.beginPath(); ctx.arc(p[0], p[1], 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.font = `800 7px ${TECH_FONT}`;
        ctx.textAlign = "center";
        ctx.fillText("ABCD"[i], p[0] + (i < 2 ? 8 : -8), p[1] + 3);
      });

      // Moving state point around the cycle
      const per = 240, ph = (frame % per) / per;
      const leg = Math.min(2, Math.floor(ph * 3));
      const f = ph * 3 - leg;
      const [p, q, col, txt] = legs[leg];
      const mx = p[0] + (q[0] - p[0]) * f, my = p[1] + (q[1] - p[1]) * f;
      ctx.fillStyle = col;
      ctx.shadowColor = col; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(mx, my, 4, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      ctx.font = `800 8px ${TECH_FONT}`;
      ctx.textAlign = "left";
      ctx.fillStyle = col;
      ctx.fillText(txt.toUpperCase(), 8, 13);
      if (!r.reachable) {
        ctx.fillStyle = T.red;
        ctx.textAlign = "right";
        ctx.fillText(`FLOOR ${tMinMK.toFixed(0)} mK`, W - 8, 13);
      }
    },
    [salt, Bmax, Tbath, r, tMinMK],
    { animate: true }
  );

  const buildPrompt = useCallback(
    () => `Adiabatic Demagnetization Refrigerator (ADR) design check — IGCCST 2026 (IIT Kharagpur):
ROLE: Sub-kelvin cryogenics engineer for space and quantum instruments.

CURRENT DESIGN:
1. Salt pill: ${salt.name}, ${massG} g (${r.moles.toFixed(2)} mol magnetic ions, J = ${salt.J}, internal field b ≈ ${salt.b} T)
2. Magnet: ${Bmax} T peak; heat sink (bath) at ${Tbath} K
3. Heat switch: ${sw.name} (OFF leak assumed ${sw.leakUW} µW)
4. Target: ${TtargetMK} mK under ${loadUW} µW load → ${r.reachable ? `hold ≈ ${holdTxt} h` : `NOT reachable, floor ≈ ${tMinMK.toFixed(0)} mK`}
5. Heat rejected to bath during magnetisation: ${r.qRejectJ.toFixed(1)} J; cooling capacity at target: ${(r.qHoldJ * 1000).toFixed(0)} mJ

QUESTIONS:
1. Why does an ideal paramagnet keep B_eff/T constant in an adiabatic demagnetisation, and what sets the floor temperature?
2. Compare FAA, CPA and GGG for a two-stage space ADR (as discussed by SAC-ISRO): which salt goes on which stage and why?
3. How do superconducting (Al) and magnetoresistive heat switches compare for the OFF-state leak at 50–300 mK?
4. How do multi-stage / continuous ADRs remove the hold-time limit?`,
    [salt, massG, r, Bmax, Tbath, sw, TtargetMK, loadUW, holdTxt, tMinMK]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={300} height={210} maxWidth={340} label="Entropy–temperature diagram of an ADR cycle" />

      <ChallengeBox
        title="Space-Mission Hold Challenge"
        goal="Hold 50 mK for at least 24 hours with a 1 µW detector load — like an X-ray microcalorimeter on a satellite."
        isCompleted={r.reachable && TtargetMK <= 50 && loadUW >= 1 && r.holdHours >= 24}
        hint="FAA alone from a 4 K bath bottoms out near 50 mK. Try CPA, a colder bath (pumped He, ~1.5 K), more salt, and the superconducting switch."
        color={T.purple}
      />

      <PillRow>
        {Object.entries(ADR_SALTS).map(([k, s]) => (
          <Pill key={k} active={saltKey === k} onClick={() => setSaltKey(k)} color={T.purple}>
            {k}
          </Pill>
        ))}
      </PillRow>
      <PillRow>
        {Object.entries(HEAT_SWITCHES).map(([k, s]) => (
          <Pill key={k} active={switchKey === k} onClick={() => setSwitchKey(k)} color={T.cyan}>
            {s.name}
          </Pill>
        ))}
      </PillRow>

      <Slider label="Magnet Peak Field" value={Bmax} onChange={setBmax} min={0.5} max={6} step={0.1} unit=" T" color={T.orange} />
      <Slider label="Heat-Sink (Bath) Temperature" value={Tbath} onChange={setTbath} min={1.2} max={10} step={0.1} unit=" K" color={T.gold} />
      <Slider label="Target Temperature" value={TtargetMK} onChange={setTtargetMK} min={10} max={1000} step={5} unit=" mK" color={T.purple} />
      <Slider label="Salt Pill Mass" value={massG} onChange={setMassG} min={20} max={1000} step={10} unit=" g" color={T.green} />
      <Slider label="Detector Heat Load" value={loadUW} onChange={setLoadUW} min={0.1} max={20} step={0.1} unit=" µW" color={T.red} />

      <DataRow>
        <DataBox label="Floor Temp" value={tMinMK.toFixed(0)} unit="mK" color={r.reachable ? T.purple : T.red} />
        <DataBox label="Hold Time" value={holdTxt} unit={r.reachable ? "h" : ""} color={T.green} />
        <DataBox label="Hold Field" value={r.reachable ? r.Bhold.toFixed(2) : "—"} unit="T" color={T.cyan} />
        <DataBox label="Heat to Bath" value={r.qRejectJ.toFixed(1)} unit="J" color={T.orange} />
      </DataRow>

      <InfoBox color={T.purple}>
        <strong style={{ color: T.purple }}>How an ADR works:</strong> the magnetic moments in a paramagnetic salt are lined up by a
        superconducting magnet while a heat switch dumps the magnetisation heat into the {Tbath} K bath (A→B). The switch opens and the field is
        lowered: with no heat flow the entropy stays fixed, so the temperature falls in step with the field (B→C). The cold stage then holds its
        temperature by ramping the field slowly to zero, soaking up the detector load until the salt runs out of entropy (C→D) — then it recycles.
        No moving parts and no helium-3, which is why ADRs fly in space. <em>{salt.note}. {sw.note}.</em>
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.purple} />

      <ExportBtn
        simId="adr"
        getData={() => ({
          salt: saltKey, heatSwitch: switchKey, BmaxT: Bmax, TbathK: Tbath, targetMK: TtargetMK, massG, loadUW,
          reachable: r.reachable, floorMK: tMinMK.toFixed(1), holdHours: r.reachable ? r.holdHours.toFixed(2) : null,
          holdFieldT: r.Bhold.toFixed(3), heatToBathJ: r.qRejectJ.toFixed(2), coolingCapacityJ: r.qHoldJ.toFixed(4),
        })}
        color={T.purple}
      />
    </div>
  );
}
