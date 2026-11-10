import { useState, useEffect, useRef } from "react";
import { T, TECH_FONT, MONO_FONT } from "../utils";
import { SCHEDULE, POSTERS, POSTER_DAY, OFFICIAL_SCHEDULE_URL, ABSTRACT_BOOKLET_URL } from "../data/conference";

const TYPE_COLORS = {
  registration: T.cyan,
  ceremony: T.gold,
  session: T.accent,
  talk: T.green,
  "oral-head": T.purple,
  oral: T.purple,
  break: T.dimText,
  poster: T.purple,
  panel: T.orange,
  industry: T.orange,
  social: T.pink,
};

const TYPE_ICONS = {
  registration: "🪪",
  ceremony: "🎓",
  session: "🗂️",
  talk: "🎤",
  "oral-head": "🗣️",
  oral: "🗣️",
  break: "☕",
  poster: "📊",
  panel: "💬",
  industry: "🏭",
  social: "🍽️",
};

const TYPE_LABELS = { "oral-head": "oral", talk: "invited" };

const istToday = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

/**
 * @param onOpenSim  (simId) => void — open a simulation
 * @param simMeta    { [simId]: { label, icon, color } } — passed in by App to avoid a circular import
 * @param focus      { dayIdx, evIdx?, abs?, poster?, nonce } — scroll to and highlight one talk/poster
 */
export default function SchedulePanel({ onOpenSim, simMeta = {}, focus }) {
  // Open on today's tab while the conference is running (IST date), else Day 1.
  const [activeDay, setActiveDay] = useState(() => {
    const idx = SCHEDULE.findIndex((d) => d.date === istToday());
    return idx >= 0 ? idx : 0;
  });
  const [postersOpen, setPostersOpen] = useState(false);
  const [highlight, setHighlight] = useState(null);
  const rowRefs = useRef({});

  useEffect(() => {
    if (!focus) return;
    setActiveDay(focus.dayIdx);
    const key = focus.poster ? `p-${focus.abs}` : `e-${focus.dayIdx}-${focus.evIdx}`;
    if (focus.poster) setPostersOpen(true);
    setHighlight(key);
    const t = setTimeout(() => rowRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
    const t2 = setTimeout(() => setHighlight(null), 4000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [focus]);

  // One bright colour for every "open simulation" button so the link reads the same everywhere
  const SimButton = ({ simId }) => {
    const m = simMeta[simId];
    if (!m) return null;
    const color = T.accent;
    return (
      <button
        onClick={() => onOpenSim?.(simId)}
        style={{
          padding: "4px 8px", borderRadius: 6, border: `1px solid ${color}50`, background: `${color}18`, color,
          fontSize: 9, fontFamily: TECH_FONT, fontWeight: 700, cursor: "pointer", maxWidth: 150, textAlign: "left", lineHeight: 1.25,
        }}
        title={`Open the related simulation: ${m.label}`}
      >
        {m.icon} {m.label} ▶
      </button>
    );
  };

  const AbsTag = ({ abs }) =>
    abs ? (
      <span style={{ fontFamily: MONO_FONT, fontSize: 8, color: T.dimText, border: `1px solid ${T.glassBorder}`, borderRadius: 4, padding: "0 4px", marginLeft: 6 }}>
        {abs}
      </span>
    ) : null;

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 14, fontFamily: TECH_FONT, fontSize: 14, fontWeight: 800, color: T.accent, letterSpacing: 2 }}>
        📅 CONFERENCE SCHEDULE & SYMPOSIA
      </div>

      {/* Day tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, justifyContent: "center" }}>
        {SCHEDULE.map((d, i) => (
          <button
            key={i}
            onClick={() => setActiveDay(i)}
            style={{
              padding: "8px 14px", borderRadius: 10,
              border: activeDay === i ? `2px solid ${T.accent}` : `1px solid ${T.glassBorder}`,
              background: activeDay === i ? `${T.accent}20` : T.glass,
              color: activeDay === i ? T.accent : T.gray,
              fontFamily: TECH_FONT, fontSize: 9, fontWeight: 700, cursor: "pointer", letterSpacing: 1,
            }}
          >
            {d.day}
          </button>
        ))}
      </div>

      {/* Events */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {SCHEDULE[activeDay].events.map((ev, i) => {
          const color = TYPE_COLORS[ev.type] || T.gray;
          const isHead = ev.type === "session" || ev.type === "oral-head";
          const key = `e-${activeDay}-${i}`;
          const lit = highlight === key;
          const isPosterRow = ev.type === "poster" && activeDay === POSTER_DAY;
          return (
            <div key={i}>
              <div
                ref={(el) => (rowRefs.current[key] = el)}
                style={{
                  display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
                  padding: "10px 12px", borderRadius: 10, marginTop: isHead && i > 0 ? 8 : 0,
                  background: lit ? `${T.gold}25` : isHead ? `${color}18` : `${color}08`,
                  border: lit ? `2px solid ${T.gold}` : isHead ? `1px solid ${color}50` : `1px solid ${color}20`,
                  transition: "background 0.4s, border 0.4s",
                }}
              >
                <div style={{ fontFamily: MONO_FONT, fontSize: 10, fontWeight: 700, color, minWidth: 74, whiteSpace: "nowrap" }}>{ev.time || ""}</div>
                <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.white }}>
                    <span style={{ marginRight: 6 }}>{TYPE_ICONS[ev.type]}</span>
                    {ev.title}
                    <AbsTag abs={ev.abs} />
                  </div>
                  {ev.speaker && <div style={{ fontSize: 10, color: T.gray, marginTop: 2 }}>{ev.speaker}</div>}
                </div>
                {ev.sim && <SimButton simId={ev.sim} color={color} />}
                {isPosterRow && (
                  <button
                    onClick={() => setPostersOpen((o) => !o)}
                    style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${color}50`, background: `${color}18`, color, fontSize: 9, fontFamily: TECH_FONT, fontWeight: 700, cursor: "pointer" }}
                  >
                    {postersOpen ? "HIDE" : "SHOW"} {POSTERS.length} POSTERS
                  </button>
                )}
                <div
                  style={{
                    fontSize: 7, fontFamily: TECH_FONT, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 1,
                    padding: "3px 6px", borderRadius: 6, background: `${color}15`, border: `1px solid ${color}25`, whiteSpace: "nowrap",
                  }}
                >
                  {TYPE_LABELS[ev.type] || ev.type}
                </div>
              </div>

              {isPosterRow && postersOpen && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, margin: "6px 0 6px 18px" }}>
                  {POSTERS.map((p) => {
                    const pk = `p-${p.abs}`;
                    const plit = highlight === pk;
                    return (
                      <div
                        key={p.abs}
                        ref={(el) => (rowRefs.current[pk] = el)}
                        style={{
                          display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", padding: "7px 10px", borderRadius: 8,
                          background: plit ? `${T.gold}25` : `${T.purple}08`, border: plit ? `2px solid ${T.gold}` : `1px solid ${T.purple}20`,
                        }}
                      >
                        <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: T.white }}>
                            {p.title}
                            <AbsTag abs={p.abs} />
                          </div>
                          <div style={{ fontSize: 9, color: T.gray, marginTop: 1 }}>
                            {p.who}
                            {p.note ? ` · ${p.note}` : ""}
                          </div>
                        </div>
                        {p.sim && <SimButton simId={p.sim} color={T.purple} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 14, textAlign: "center", fontSize: 9, color: T.dimText, fontFamily: TECH_FONT }}>
        GARGI AUDITORIUM, VIKRAMSHILA COMPLEX • IIT KHARAGPUR • NOV 09–11, 2026
      </div>
      <div style={{ marginTop: 6, textAlign: "center", fontSize: 9, color: T.dimText, lineHeight: 1.6 }}>
        Times IST, from the official programme. Abstract IDs refer to the{" "}
        <a href={ABSTRACT_BOOKLET_URL} target="_blank" rel="noopener noreferrer" style={{ color: T.accent }}>abstract booklet</a>.{" "}
        Simulation links are this hub's suggestions, not the organisers'.{" "}
        <a href={OFFICIAL_SCHEDULE_URL} target="_blank" rel="noopener noreferrer" style={{ color: T.accent }}>Check igccst2026.com for late changes</a>
      </div>
    </div>
  );
}
