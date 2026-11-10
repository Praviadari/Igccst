import { useState } from "react";
import { T, TECH_FONT, MONO_FONT } from "../utils";

// Official programme: "PROGRAMME SCHEDULE" PDF linked from https://igccst2026.com/#schedule
// (Download Event Schedule). Times IST. simId = related simulation in this hub (our link, not the organisers').
const OFFICIAL_SCHEDULE_URL = "https://igccst2026.com/#schedule";

const SCHEDULE = [
  {
    day: "Day 1 — Mon, Nov 09",
    date: "2026-11-09",
    events: [
      { time: "08:00–10:00", title: "Registration", type: "registration" },
      { time: "10:00–10:30", title: "Inaugural Programme", type: "ceremony" },
      { time: "10:30–11:00", title: "High Tea", type: "break" },
      { title: "Session 1 | Cooling and Liquefaction Technologies", speaker: "Chair: Prof. T. S. Dutta", type: "session", simId: "linde_hampson" },
      { time: "11:00–11:30", title: "General Aspects in Cryogenics", speaker: "Prof. Christoph Haberstroh, Technische Universität Dresden", type: "talk", simId: "absolute_zero" },
      { time: "11:30–12:00", title: "Recent Advances in Cryogenic Technology Development at BARC", speaker: "Dr. Anindya Chakraborty, Head, Cryo-Technology Division, BARC", type: "talk", simId: "claude_collins" },
      { time: "12:00–12:30", title: "Cryogenic Aspects in a Global Green Hydrogen Economy", speaker: "Prof. Dirk Lindackers, Research Technology Department, IFW Dresden", type: "talk", simId: "hydrogen_storage" },
      { time: "12:30–13:00", title: "A Novel Turboexpander for Cryogenic Liquefaction Applications", speaker: "Prof. Parthasarathi Ghosh, Professor & Head, Cryogenic Engineering Centre, IIT Kharagpur", type: "talk", simId: "claude_collins" },
      { time: "13:00–14:00", title: "Lunch Break", type: "break" },
      { title: "Session 2 | Quantum Materials and Technology", speaker: "Chair: Prof. Prasanna Kumar Sahoo", type: "session", simId: "superconductor" },
      { time: "14:00–14:30", title: "The Cryogenic–Quantum Interface: Enabling Next-Generation Quantum Systems", speaker: "Dr. Prashant C. Upadhya, Director, Wadhwani Innovation Network, CoE for Quantum Technologies, IISc", type: "talk", simId: "dilution_fridge" },
      { time: "14:30–15:00", title: "Classical and Quantum Effects on the Vortex State in Superconducting Thin Films", speaker: "Prof. Pratap Raychaudhuri, TIFR Mumbai", type: "talk", simId: "superconductor" },
      { time: "15:00–15:30", title: "Non-volatile Josephson Memory Devices", speaker: "Dr. Avradeep Pal, Physics, IIT Bombay", type: "talk" },
      { time: "15:30–16:00", title: "Quantum Materials for Cryogenic Applications", speaker: "Prof. Venimadhav Adyam, IIT Kharagpur", type: "talk" },
      { time: "16:00–16:15", title: "Tea Break", type: "break" },
      { time: "16:15–16:45", title: "Pulse Schemes for Increasing Coherence Time in an Ensemble of Nitrogen-Vacancy Centres in Diamond", speaker: "Prof. Chiranjib Mitra, IISER Kolkata", type: "talk" },
      { title: "Oral Presentations by Students & Faculty (10 min each)", type: "oral-head" },
      { time: "16:45–16:55", title: "CFD Investigation of Fluid Transient-Induced Cavitation in a Cryogenic Environment", speaker: "Arjun Garva, Research Scholar, IIT Kharagpur", type: "oral", simId: "transfer_line" },
      { time: "16:55–17:05", title: "A Hybrid Mass Transfer Model for Direct Contact Condensation on Structured and Unstructured Meshes: Towards Cryogenic Applications", speaker: "Jishad K., Research Scholar, IIST", type: "oral" },
      { time: "17:05–17:15", title: "Transient CFD Investigation of Regenerator Thermal Non-Equilibrium in a Free-Piston Stirling Cryocooler", speaker: "Dr. Kishore Singh Patel, NIT Rourkela", type: "oral", simId: "cryocooler" },
      { time: "17:15–17:25", title: "Novel Magnetoresistive Heat Switch for Ultralow Temperature Refrigeration in Quantum Technologies: A Thermomagnetic Analysis", speaker: "Dr. B. Kiran Naik, NIT Rourkela", type: "oral" },
      { time: "17:25–17:35", title: "Development of a Fast-Response, High-Sensitivity, Transistor-Based Temperature Sensor for Cryogenic Applications", speaker: "Ayush Kori, SVKM's Mithibai College", type: "oral" },
      { time: "17:35–18:35", title: "Panel Discussion: Cryogenics for Energy Security and Sustainability – A Way Forward", type: "panel" },
      { time: "19:30–22:30", title: "Gala Dinner", speaker: "Coupons at the registration desk (if mentioned in your registration confirmation mail)", type: "social" },
    ],
  },
  {
    day: "Day 2 — Tue, Nov 10",
    date: "2026-11-10",
    events: [
      { title: "Session 3 | Cryogenic Refrigeration Technology", speaker: "Chair: Prof. Danny Baumann", type: "session", simId: "cryocooler" },
      { time: "09:30–10:00", title: "Challenges in Cryogenic and Superconducting Technology in Whole-Body MRI Magnets", speaker: "Dr. Soumen Kar, Scientist-G, Inter-University Accelerator Centre (IUAC)", type: "talk", simId: "mri_quench" },
      { time: "10:00–10:30", title: "Adiabatic Demagnetization Refrigerators for Sub-Kelvin Applications", speaker: "Dr. Vivek Singh, Space Applications Centre (SAC), ISRO, Ahmedabad", type: "talk", simId: "dilution_fridge" },
      { time: "10:30–11:00", title: "Cryo- and Vacuum Solutions for Emerging and Sustainable Technologies", speaker: "Dipl.-Ing. Christoph Mühsig, Leybold Dresden GmbH", type: "talk", simId: "dewar_insulation" },
      { time: "11:00–11:15", title: "Tea Break", type: "break" },
      { time: "11:15–11:45", title: "Magnetocaloric Hydrogen Liquefaction — From Materials to Prototypes", speaker: "Dr. Tino Gottschall, HZDR Dresden High Magnetic Field Laboratory & Magnotherm Solutions GmbH", type: "talk", simId: "hydrogen_storage" },
      { time: "11:45–12:15", title: "Investigations on a Novel Pressure Wave Refrigerator Using Three-Stage Cooling", speaker: "Prof. Tapas Kumar Nandi, IIT Kharagpur", type: "talk", simId: "cryocooler" },
      { title: "Session 4 | Cryogenic Infrastructure", speaker: "Chair: Dr. Tino Gottschall", type: "session", simId: "transfer_line" },
      { time: "12:15–12:45", title: "Cryogenic Instruments for Material Science", speaker: "Prof. Danny Baumann, Research Technology Department, IFW Dresden", type: "talk" },
      { time: "12:45–13:45", title: "Lunch Break", type: "break" },
      { time: "13:45–14:15", title: "Developmental Activities for Dry Dilution Refrigerator (DryDR) at VECC, Kolkata", speaker: "Dr. Jedidiah Pradhan, Helium Technology and Low Temperature Section, VECC", type: "talk", simId: "dilution_fridge" },
      { time: "14:15–14:45", title: "Contactless Cryogenic Levelmeter Based on Surface Acoustic Wave Sensors", speaker: "Prof. Hagen Schmidt, Institute for Solid State Physics, IFW Dresden", type: "talk" },
      { title: "Session 5 | Storage and Distribution of Cryogenic Fluids", speaker: "Chair: Prof. Christoph Haberstroh", type: "session", simId: "dewar_insulation" },
      { time: "14:45–15:15", title: "Earth to Orbit: Cryogenic Production, Storage and Distribution", speaker: "Dr. Jegesh David, Scientist G, Group Director, IPRC, ISRO", type: "talk", simId: "rocket_expansion" },
      { time: "15:15–15:45", title: "LH2 Container Logistics — Demand-Driven LH2 Supply for Future Applications", speaker: "Prof. Hans Weber, IFW Dresden", type: "talk", simId: "hydrogen_storage" },
      { time: "15:45–17:00", title: "Poster and Tea Session", type: "poster" },
      { time: "17:00–17:30", title: "Hydrogen Storage by Cryosorption", speaker: "Prof. Indranil Ghosh, IIT Kharagpur", type: "talk", simId: "hydrogen_storage" },
      { time: "17:30–18:00", title: "Emerging Cryogenic Technologies for Clean Energy: Carbon Capture, Energy Recovery and Liquid Cryogenic Fuel Storage", speaker: "Dr. Pavitra Sandilya, IIT Kharagpur", type: "talk", simId: "lng_supply_chain" },
    ],
  },
  {
    day: "Day 3 — Wed, Nov 11",
    date: "2026-11-11",
    events: [
      { title: "Session 6 | Applied Superconductivity", speaker: "Chair: Prof. Anindya Chakraborty", type: "session", simId: "superconducting_cable" },
      { time: "10:00–10:30", title: "Superconductivity and Cryogenics for High Energy Particle Accelerators: Present Trend", speaker: "Prof. Tripti Sekhar Datta, former Visiting Professor, IIT Kharagpur; former Head, Cryogenics and Superconductivity Programme, IUAC Delhi", type: "talk", simId: "helium_recovery" },
      { time: "10:30–11:00", title: "Levitated Bearings Based on HTS Materials in Cryogenic Pumps: Potential and Challenges", speaker: "Dr. Paul Saß, ScIDre Scientific Instruments Dresden GmbH", type: "talk", simId: "superconductor" },
      { time: "11:00–11:30", title: "Superconducting Technology for Power Applications: An Overview of Research at the Applied Superconductivity Lab", speaker: "Dr. Abhay Singh Gour, IIT Kharagpur", type: "talk", simId: "superconducting_cable" },
      { time: "11:30–11:45", title: "Tea Break", type: "break" },
      { time: "11:45–12:15", title: "Industry Presentations by Linde and IHVP", type: "industry", simId: "air_separation" },
      { time: "12:15–12:45", title: "Prize Distribution and Closing Remarks", type: "ceremony" },
      { time: "12:45–13:15", title: "Certificate Distribution by Volunteers", type: "ceremony" },
      { time: "13:30–14:30", title: "Lunch", type: "break" },
    ],
  },
];

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

const TYPE_LABELS = {
  "oral-head": "oral",
  talk: "invited",
};

export default function SchedulePanel({ onOpenSim }) {
  // Open on today's tab while the conference is running (IST date), else Day 1.
  const [activeDay, setActiveDay] = useState(() => {
    const istToday = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
    const idx = SCHEDULE.findIndex((d) => d.date === istToday);
    return idx >= 0 ? idx : 0;
  });

  return (
    <div>
      <div style={{
        textAlign: "center", marginBottom: 14,
        fontFamily: TECH_FONT, fontSize: 14, fontWeight: 800,
        color: T.accent, letterSpacing: 2,
      }}>
        📅 CONFERENCE SCHEDULE & SYMPOSIA
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
          const isHead = ev.type === "session" || ev.type === "oral-head";
          return (
            <div key={i} style={{
              display: "flex", gap: 10, alignItems: "center",
              padding: "10px 12px", borderRadius: 10,
              marginTop: isHead && i > 0 ? 8 : 0,
              background: isHead ? `${color}18` : `${color}08`,
              border: isHead ? `1px solid ${color}50` : `1px solid ${color}20`,
            }}>
              <div style={{
                fontFamily: MONO_FONT, fontSize: 10, fontWeight: 700,
                color, minWidth: 74, whiteSpace: "nowrap",
              }}>{ev.time || ""}</div>
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

              {ev.simId && (
                <button
                  onClick={() => onOpenSim?.(ev.simId)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 6,
                    border: `1px solid ${color}40`,
                    background: `${color}18`,
                    color,
                    fontSize: 8,
                    fontFamily: TECH_FONT,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                  title="Launch related interactive simulation"
                >
                  SIM ▶
                </button>
              )}

              <div style={{
                fontSize: 7, fontFamily: TECH_FONT, fontWeight: 700,
                color, textTransform: "uppercase", letterSpacing: 1,
                padding: "3px 6px", borderRadius: 6,
                background: `${color}15`, border: `1px solid ${color}25`,
                whiteSpace: "nowrap",
              }}>{TYPE_LABELS[ev.type] || ev.type}</div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: 14, textAlign: "center",
        fontSize: 9, color: T.dimText, fontFamily: TECH_FONT,
      }}>
        GARGI AUDITORIUM, VIKRAMSHILA COMPLEX • IIT KHARAGPUR • NOV 09–11, 2026
      </div>
      <div style={{ marginTop: 6, textAlign: "center", fontSize: 9, color: T.dimText }}>
        Times IST, from the official programme.{" "}
        <a href={OFFICIAL_SCHEDULE_URL} target="_blank" rel="noopener noreferrer" style={{ color: T.accent }}>
          Check igccst2026.com for late changes
        </a>
      </div>
    </div>
  );
}
