import { useState } from "react";
import { T, TECH_FONT, MONO_FONT } from "../utils";

const CRYO_FLUIDS = [
  { name: "Liquid Helium (⁴He)", tBoil: "4.22 K (-268.9°C)", tCrit: "5.19 K", pCrit: "2.27 bar", hfg: "20.9 kJ/kg", rho: "125 kg/m³", tInv: "45 K", apps: "Superconducting magnets (MRI, LHC), quantum dilution fridges" },
  { name: "Liquid Hydrogen (para-H₂)", tBoil: "20.28 K (-252.9°C)", tCrit: "32.97 K", pCrit: "12.93 bar", hfg: "445.6 kJ/kg", rho: "70.8 kg/m³", tInv: "202 K", apps: "Rocket propulsion (ISRO CE-20, Ariane), clean fuel logistics" },
  { name: "Liquid Neon (Ne)", tBoil: "27.10 K (-246.1°C)", tCrit: "44.40 K", pCrit: "27.60 bar", hfg: "85.8 kJ/kg", rho: "1207 kg/m³", tInv: "260 K", apps: "High-density thermal energy storage, HTS power transmission" },
  { name: "Liquid Nitrogen (N₂)", tBoil: "77.36 K (-195.8°C)", tCrit: "126.2 K", pCrit: "33.90 bar", hfg: "199.1 kJ/kg", rho: "808 kg/m³", tInv: "621 K", apps: "Industrial cryogen, biological freezing, cryosurgery, HTS testing" },
  { name: "Liquid Argon (Ar)", tBoil: "87.30 K (-185.9°C)", tCrit: "150.8 K", pCrit: "48.70 bar", hfg: "161.0 kJ/kg", rho: "1395 kg/m³", tInv: "723 K", apps: "Dark matter detectors (DUNE), high-purity inert shielding" },
  { name: "Liquid Oxygen (LOX)", tBoil: "90.19 K (-183.0°C)", tCrit: "154.6 K", pCrit: "50.40 bar", hfg: "213.0 kJ/kg", rho: "1141 kg/m³", tInv: "764 K", apps: "Space launch oxidizer (GSLV, Starship), steelmaking, medical" },
  { name: "Liquefied Natural Gas (LNG)", tBoil: "111.7 K (-161.5°C)", tCrit: "190.6 K", pCrit: "46.00 bar", hfg: "510.0 kJ/kg", rho: "450 kg/m³", tInv: "950 K", apps: "Clean energy transport, marine bunkering, heavy transport fuel" },
];

const COLLAB_FACILITIES = [
  { name: "Cryogenic Engineering Centre", org: "IIT Kharagpur (India)", focus: "Gas liquefaction, cryocoolers, superconductivity, LH2 storage" },
  { name: "Institute for Technical Physics (ITEP)", org: "KIT Karlsruhe (Germany)", focus: "High-field superconducting magnets, cryogenics for fusion (ITER)" },
  { name: "Liquid Propulsion Systems Centre (LPSC)", org: "ISRO Valiamala & Mahendragiri (India)", focus: "Cryogenic rocket stages CE-7.5, CE-20, semi-cryogenic SCE-200" },
  { name: "Cryogenic Department", org: "DESY Hamburg & GSI Darmstadt (Germany)", focus: "Superconducting RF cavities, 2K superfluid helium systems, FAIR accelerator" },
  { name: "Raja Ramanna Centre for Advanced Tech (RRCAT)", org: "DAE Indore (India)", focus: "2K cryogenics, helium liquefaction infrastructure, SCRF cavities" },
  { name: "Linde Cryogenics", org: "Linde Engineering (Germany & India)", focus: "Large-scale air separation units, hydrogen liquefiers, helium recovery" },
];

export default function CryoDatabasePanel({ onOpenSim }) {
  const [filter, setFilter] = useState("");
  const [activeSection, setActiveSection] = useState("fluids"); // fluids, facilities, formulas

  const filteredFluids = CRYO_FLUIDS.filter(
    (f) => f.name.toLowerCase().includes(filter.toLowerCase()) || f.apps.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ fontFamily: TECH_FONT, fontSize: 13, fontWeight: 800, color: T.accent, letterSpacing: 2 }}>
          📚 CRYOGENICS REFERENCE DATABASE
        </div>
        <div style={{ fontSize: 9, color: T.gray, marginTop: 4 }}>
          Thermophysical properties, research centers, and collaborative benchmarks
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, justifyContent: "center" }}>
        <button
          onClick={() => setActiveSection("fluids")}
          style={{
            padding: "8px 14px", borderRadius: 10,
            border: activeSection === "fluids" ? `2px solid ${T.cyan}` : `1px solid ${T.glassBorder}`,
            background: activeSection === "fluids" ? `${T.cyan}20` : T.glass,
            color: activeSection === "fluids" ? T.cyan : T.gray,
            fontFamily: TECH_FONT, fontSize: 9, fontWeight: 700, cursor: "pointer",
          }}
        >
          ❄️ CRYOGENIC FLUIDS
        </button>
        <button
          onClick={() => setActiveSection("facilities")}
          style={{
            padding: "8px 14px", borderRadius: 10,
            border: activeSection === "facilities" ? `2px solid ${T.gold}` : `1px solid ${T.glassBorder}`,
            background: activeSection === "facilities" ? `${T.gold}20` : T.glass,
            color: activeSection === "facilities" ? T.gold : T.gray,
            fontFamily: TECH_FONT, fontSize: 9, fontWeight: 700, cursor: "pointer",
          }}
        >
          🏛️ INDO-GERMAN CENTRES
        </button>
      </div>

      {activeSection === "fluids" && (
        <>
          <div style={{ marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Search fluids or applications..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                width: "100%", padding: "8px 12px", borderRadius: 8,
                background: T.glass, border: `1px solid ${T.glassBorder}`,
                color: T.white, fontSize: 11, fontFamily: MONO_FONT, outline: "none",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {filteredFluids.map((fluid, idx) => (
              <div
                key={idx}
                style={{
                  padding: "12px", borderRadius: 12,
                  background: "rgba(255, 255, 255, 0.02)",
                  border: `1px solid ${T.glassBorder}`,
                  borderLeft: `3px solid ${T.accent}`,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: T.white, fontFamily: TECH_FONT, marginBottom: 6 }}>
                  {fluid.name}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 9, fontFamily: MONO_FONT }}>
                  <div><span style={{ color: T.gray }}>T_boil:</span> <strong style={{ color: T.cyan }}>{fluid.tBoil}</strong></div>
                  <div><span style={{ color: T.gray }}>T_crit:</span> {fluid.tCrit}</div>
                  <div><span style={{ color: T.gray }}>P_crit:</span> {fluid.pCrit}</div>
                  <div><span style={{ color: T.gray }}>Latent h_fg:</span> {fluid.hfg}</div>
                  <div><span style={{ color: T.gray }}>Liquid ρ:</span> {fluid.rho}</div>
                  <div><span style={{ color: T.gray }}>Max T_inv:</span> <strong style={{ color: T.orange }}>{fluid.tInv}</strong></div>
                </div>
                <div style={{ marginTop: 8, fontSize: 9, color: T.gray, lineHeight: 1.4 }}>
                  <span style={{ color: T.dimText, fontWeight: 700 }}>APPLICATIONS: </span>
                  {fluid.apps}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeSection === "facilities" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {COLLAB_FACILITIES.map((fac, idx) => (
            <div
              key={idx}
              style={{
                padding: "12px 14px", borderRadius: 12,
                background: "rgba(255, 255, 255, 0.02)",
                border: `1px solid ${T.glassBorder}`,
                borderLeft: `3px solid ${T.gold}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.white, fontFamily: TECH_FONT }}>
                  {fac.name}
                </div>
                <div style={{ fontSize: 8, fontFamily: TECH_FONT, color: T.gold, padding: "2px 6px", borderRadius: 4, background: `${T.gold}15` }}>
                  {fac.org}
                </div>
              </div>
              <div style={{ fontSize: 10, color: T.gray }}>
                {fac.focus}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
