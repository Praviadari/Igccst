import { useState } from "react";
import { T, TECH_FONT, MONO_FONT } from "../utils";

const SCHEDULE = [
  {
    day: "Day 1 — Nov 09",
    date: "2026-11-09",
    events: [
      { time: "09:00", title: "Inauguration & Welcome Address", speaker: "IIT Kharagpur & German Delegation", type: "ceremony" },
      { time: "09:45", title: "Keynote: Future of Cryogenics in Sustainable Energy", speaker: "Invited Speaker", type: "keynote" },
      { time: "10:45", title: "Tea Break & Networking", type: "break" },
      { time: "11:15", title: "Session 1: Gas Liquefaction & Refrigeration Cycles", speaker: "Chair: TBD", type: "session" },
      { time: "12:30", title: "Session 2: Cryocooler Technologies", speaker: "Chair: TBD", type: "session" },
      { time: "13:30", title: "Lunch Break", type: "break" },
      { time: "14:30", title: "Session 3: Hydrogen Storage & Distribution", speaker: "Chair: TBD", type: "session" },
      { time: "15:45", title: "Poster Session & Exhibition", type: "poster" },
      { time: "17:00", title: "Panel Discussion: Indo-German Cryogenics Collaboration", type: "panel" },
      { time: "18:30", title: "Welcome Dinner", type: "social" },
    ],
  },
  {
    day: "Day 2 — Nov 10",
    date: "2026-11-10",
    events: [
      { time: "09:00", title: "Keynote: LNG Technologies for Energy Security", speaker: "Invited Speaker", type: "keynote" },
      { time: "10:00", title: "Session 4: LNG Supply Chain & Regasification", speaker: "Chair: TBD", type: "session" },
      { time: "11:00", title: "Tea Break", type: "break" },
      { time: "11:30", title: "Session 5: Superconductivity & Quantum Technologies", speaker: "Chair: TBD", type: "session" },
      { time: "12:45", title: "Session 6: Cryogenic Instrumentation & Safety", speaker: "Chair: TBD", type: "session" },
      { time: "13:30", title: "Lunch Break", type: "break" },
      { time: "14:30", title: "Session 7: Heat Exchangers & Insulation", speaker: "Chair: TBD", type: "session" },
      { time: "15:45", title: "Session 8: Space Cryogenics", speaker: "Chair: TBD", type: "session" },
      { time: "17:00", title: "Lab Tour: IIT Kharagpur Cryogenic Engineering Centre", type: "tour" },
      { time: "19:00", title: "Conference Banquet", type: "social" },
    ],
  },
  {
    day: "Day 3 — Nov 11",
    date: "2026-11-11",
    events: [
      { time: "09:00", title: "Keynote: Green Hydrogen Economy & Cryogenics", speaker: "Invited Speaker", type: "keynote" },
      { time: "10:00", title: "Session 9: Ultra-Low Temperature Physics", speaker: "Chair: TBD", type: "session" },
      { time: "11:00", title: "Tea Break", type: "break" },
      { time: "11:30", title: "Session 10: Emerging Applications & Industry 4.0", speaker: "Chair: TBD", type: "session" },
      { time: "12:30", title: "Best Paper Awards & Closing Ceremony", type: "ceremony" },
      { time: "13:30", title: "Farewell Lunch", type: "social" },
    ],
  },
];

const TYPE_COLORS = {
  ceremony: T.gold,
  keynote: T.accent,
  session: T.green,
  break: T.dimText,
  poster: T.purple,
  panel: T.orange,
  social: T.pink,
  tour: T.lime,
};

const TYPE_ICONS = {
  ceremony: "🎓",
  keynote: "🎤",
  session: "📝",
  break: "☕",
  poster: "📊",
  panel: "💬",
  social: "🍽️",
  tour: "🔬",
};

export default function SchedulePanel() {
  const [activeDay, setActiveDay] = useState(0);

  return (
    <div>
      <div style={{
        textAlign: "center", marginBottom: 14,
        fontFamily: TECH_FONT, fontSize: 14, fontWeight: 800,
        color: T.accent, letterSpacing: 2,
      }}>
        📅 CONFERENCE SCHEDULE
      </div>

      {/* Day tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, justifyContent: "center" }}>
        {SCHEDULE.map((d, i) => (
          <button key={i} onClick={() => setActiveDay(i)}
            style={{
              padding: "8px 14px", borderRadius: 10,
              border: activeDay === i ? `2px solid ${T.accent}` : `1px solid ${T.glassBorder}`,
              background: activeDay === i ? `${T.accent}20` : T.glass,
              color: activeDay === i ? T.accent : T.gray,
              fontFamily: TECH_FONT, fontSize: 9, fontWeight: 700,
              cursor: "pointer", letterSpacing: 1,
            }}
          >{d.day}</button>
        ))}
      </div>

      {/* Events */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {SCHEDULE[activeDay].events.map((ev, i) => {
          const color = TYPE_COLORS[ev.type] || T.gray;
          return (
            <div key={i} style={{
              display: "flex", gap: 10, alignItems: "flex-start",
              padding: "10px 12px", borderRadius: 10,
              background: `${color}08`,
              border: `1px solid ${color}20`,
            }}>
              <div style={{
                fontFamily: MONO_FONT, fontSize: 11, fontWeight: 700,
                color, minWidth: 44, paddingTop: 2,
              }}>{ev.time}</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: T.white,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span>{TYPE_ICONS[ev.type]}</span>
                  {ev.title}
                </div>
                {ev.speaker && (
                  <div style={{ fontSize: 10, color: T.gray, marginTop: 2 }}>
                    {ev.speaker}
                  </div>
                )}
              </div>
              <div style={{
                fontSize: 7, fontFamily: TECH_FONT, fontWeight: 700,
                color, textTransform: "uppercase", letterSpacing: 1,
                padding: "3px 6px", borderRadius: 6,
                background: `${color}15`, border: `1px solid ${color}25`,
                whiteSpace: "nowrap",
              }}>{ev.type}</div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: 14, textAlign: "center",
        fontSize: 9, color: T.dimText, fontFamily: TECH_FONT,
      }}>
        GARGI AUDITORIUM • IIT KHARAGPUR • NOV 09–11, 2026
      </div>
    </div>
  );
}
