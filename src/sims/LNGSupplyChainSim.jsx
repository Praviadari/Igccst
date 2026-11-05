import { useState, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function LNGSupplyChainSim() {
  const [regasRateMTPA, setRegasRateMTPA] = useState(5.0); // Million Tonnes Per Annum
  const [vapType, setVapType] = useState("orv"); // orv (open rack), scv (submerged comb), ifv (interm fluid)
  const [seawaterT, setSeawaterT] = useState(24); // °C
  const [pipePressBar, setPipePressBar] = useState(70); // bar
  const [coldRecovery, setColdRecovery] = useState(true); // Power generation from exergy

  // LNG properties: -162°C, 450 kg/m3, latent heat ~510 kJ/kg, cp_liq ~3.5 kJ/kg·K, cp_gas ~2.2 kJ/kg·K
  // Mass flow rate in kg/s: 1 MTPA = 1e9 kg / (365*86400) ≈ 31.71 kg/s
  const massFlowKgS = regasRateMTPA * 31.71;

  // Thermal energy needed for heating from -162°C to 15°C
  // Q = m * (cp_liq * ΔT_sub + h_fg + cp_vap * ΔT_super)
  // ≈ 31.71 * (510 + 3.5*2 + 2.2*175) ≈ 31.71 * 902 kJ/kg = 28.6 MW per MTPA
  const heatDutyMW = (massFlowKgS * 902) / 1000;

  // Cold exergy recoverable (Organic Rankine Cycle or direct expansion)
  // Max theoretical exergy ≈ 240 kWh / tonne LNG ≈ 864 kJ/kg
  // Practical recovery efficiency ~ 18-25%
  const coldPowerMW = coldRecovery ? (massFlowKgS * 864 * 0.22) / 1000 : 0;

  // Seawater flow requirement for ORV (assuming ΔT_sw = 5°C, cp_sw = 4.0 kJ/kg·K)
  const seawaterM3Hr = ((heatDutyMW * 1000) / (4.0 * 5) * 3600 / 1025).toFixed(0);

  // Carbon emission reduction via cold recovery (tonnes CO2/yr)
  const co2SavedKTA = (coldPowerMW * 8760 * 0.75 / 1000).toFixed(1);

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

      // 1. LNG Carrier Ship (Far Left)
      const shipX = 30;
      const shipY = cy - 10;
      ctx.fillStyle = T.glass;
      ctx.strokeStyle = T.cyan;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(shipX - 20, shipY + 15);
      ctx.lineTo(shipX + 25, shipY + 15);
      ctx.lineTo(shipX + 32, shipY);
      ctx.lineTo(shipX - 25, shipY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Spherical tank domes on carrier (Moss type)
      ctx.fillStyle = "rgba(76, 201, 240, 0.4)";
      ctx.beginPath();
      ctx.arc(shipX - 10, shipY, 10, Math.PI, 0);
      ctx.arc(shipX + 12, shipY, 10, Math.PI, 0);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = T.white;
      ctx.font = `700 6px ${TECH_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText("LNG CARRIER", shipX + 2, shipY + 24);

      // 2. Unloading line to Storage Tank
      ctx.strokeStyle = T.cyan;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(shipX + 32, shipY + 8);
      ctx.lineTo(95, shipY + 8);
      ctx.lineTo(95, cy - 25);
      ctx.stroke();

      // 3. LNG Storage Tank (Full containment)
      const tankX = 120;
      const tankY = cy - 10;
      ctx.fillStyle = T.glass;
      ctx.strokeStyle = T.accent;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(tankX, tankY - 10, 22, Math.PI, 0); // Dome roof
      ctx.rect(tankX - 22, tankY - 10, 44, 30);
      ctx.fill();
      ctx.stroke();

      // Liquid inside tank (-162°C)
      ctx.fillStyle = "rgba(76, 201, 240, 0.5)";
      ctx.fillRect(tankX - 20, tankY + 2, 40, 16);
      ctx.fillStyle = T.white;
      ctx.font = `700 6px ${MONO_FONT}`;
      ctx.fillText("-162°C", tankX, tankY + 12);

      // 4. Vaporizer Unit (ORV / SCV)
      const vapX = 195;
      const vapY = cy - 20;
      const vapW = 32;
      const vapH = 45;

      const vapGrad = ctx.createLinearGradient(vapX, vapY, vapX + vapW, vapY);
      vapGrad.addColorStop(0, "rgba(76, 201, 240, 0.4)");
      vapGrad.addColorStop(1, "rgba(255, 107, 53, 0.4)");
      ctx.fillStyle = vapGrad;
      ctx.strokeStyle = T.orange;
      ctx.strokeRect(vapX, vapY, vapW, vapH);
      ctx.fillRect(vapX, vapY, vapW, vapH);

      // Water cascade downward
      ctx.strokeStyle = "rgba(76, 201, 240, 0.6)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const dropY = vapY + ((frame * 2 + i * 10) % vapH);
        ctx.beginPath();
        ctx.moveTo(vapX + 6 + i * 6, dropY);
        ctx.lineTo(vapX + 6 + i * 6, dropY + 4);
        ctx.stroke();
      }

      ctx.fillStyle = T.orange;
      ctx.font = `700 6px ${TECH_FONT}`;
      ctx.fillText(vapType.toUpperCase(), vapX + vapW / 2, vapY - 5);

      // 5. Cold Recovery Turbine (if active)
      if (coldRecovery) {
        const turbX = vapX + 16;
        const turbY = vapY + vapH + 18;
        ctx.fillStyle = "rgba(77, 255, 184, 0.2)";
        ctx.strokeStyle = T.green;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(turbX, turbY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = T.green;
        ctx.font = `700 6px ${TECH_FONT}`;
        ctx.fillText("ORC", turbX, turbY + 2);
        ctx.fillText(`${coldPowerMW.toFixed(1)}MW`, turbX, turbY + 18);
      }

      // 6. Natural Gas Pipeline Header (Right)
      ctx.strokeStyle = T.orange;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(vapX + vapW, vapY + vapH / 2);
      ctx.lineTo(W - 15, vapY + vapH / 2);
      ctx.stroke();

      ctx.fillStyle = T.orange;
      ctx.font = `800 7px ${TECH_FONT}`;
      ctx.textAlign = "right";
      ctx.fillText(`GAS GRID`, W - 15, vapY + vapH / 2 - 8);
      ctx.fillText(`${pipePressBar} bar`, W - 15, vapY + vapH / 2 + 14);

      // Particle flow along pipeline
      const pOffset = (frame * 3) % (W - 15 - (vapX + vapW));
      ctx.fillStyle = T.orange;
      ctx.beginPath();
      ctx.arc(vapX + vapW + pOffset, vapY + vapH / 2, 2, 0, Math.PI * 2);
      ctx.fill();
    },
    [regasRateMTPA, vapType, seawaterT, pipePressBar, coldRecovery, coldPowerMW],
    { animate: true }
  );

  const buildPrompt = useCallback(
    () => `LNG Regasification Terminal & Cold Energy Recovery — IGCCST 2026:
ROLE: Terminal operations director and cryogenic thermodynamics specialist.
CONTEXT: Indo-German conference on LNG infrastructure and sustainable energy transition.

OPERATING CONDITIONS:
1. Terminal Throughput: ${regasRateMTPA} MTPA (${massFlowKgS.toFixed(1)} kg/s LNG)
2. Vaporizer Architecture: ${vapType.toUpperCase()} (Open Rack / Submerged Combustion / Intermediate Fluid)
3. Seawater Temperature: ${seawaterT} °C
4. High-Pressure Send-Out: ${pipePressBar} bar
5. Thermal Regasification Duty: ${heatDutyMW.toFixed(1)} MW
6. Cold Exergy Power Generation: ${coldPowerMW.toFixed(2)} MW
7. Annual Seawater Volume: ${seawaterM3Hr} m³/h
8. Avoided Carbon Emissions: ${co2SavedKTA} kTonnes CO2/yr

TECHNICAL DELIBERATIONS:
1. Cold Energy Utilization: Beyond Organic Rankine Cycle (ORC) power generation, how can cold energy (-160°C to 0°C) be integrated into air separation units (ASU), dry ice production, or data center cooling?
2. Environmental Impact: Discuss cold water discharge plume regulations and thermal shock mitigation on coastal marine life.
3. Indian Terminals: Benchmark against Petronet LNG Dahej, Kochi, and Dhamra terminals.`,
    [regasRateMTPA, vapType, seawaterT, pipePressBar, heatDutyMW, coldPowerMW, seawaterM3Hr, co2SavedKTA, massFlowKgS]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={200} maxWidth={280} />

      <PillRow>
        <Pill active={vapType === "orv"} onClick={() => setVapType("orv")} color={T.accent}>
          ORV (Seawater)
        </Pill>
        <Pill active={vapType === "scv"} onClick={() => setVapType("scv")} color={T.orange}>
          SCV (Fuel Gas)
        </Pill>
        <Pill active={vapType === "ifv"} onClick={() => setVapType("ifv")} color={T.purple}>
          IFV (Glycol)
        </Pill>
        <Pill active={coldRecovery} onClick={() => setColdRecovery(!coldRecovery)} color={T.green}>
          {coldRecovery ? "⚡ Cold Recovery ON" : "Cold Recovery OFF"}
        </Pill>
      </PillRow>

      <Slider label="Terminal Regas Capacity" value={regasRateMTPA} onChange={setRegasRateMTPA} min={1.0} max={15.0} step={0.5} unit=" MTPA" color={T.accent} />
      <Slider label="Seawater Temperature" value={seawaterT} onChange={setSeawaterT} min={12} max={32} step={1} unit=" °C" color={T.cyan} />
      <Slider label="Send-Out Gas Pressure" value={pipePressBar} onChange={setPipePressBar} min={30} max={100} step={5} unit=" bar" color={T.orange} />

      <DataRow>
        <DataBox label="Heat Duty" value={heatDutyMW.toFixed(0)} unit="MW" color={T.orange} />
        <DataBox label="Power Gen" value={coldPowerMW.toFixed(1)} unit="MW" color={coldRecovery ? T.green : T.gray} />
        <DataBox label="Seawater" value={(parseInt(seawaterM3Hr) / 1000).toFixed(1)} unit="k m³/h" color={T.cyan} />
        <DataBox label="CO2 Cut" value={co2SavedKTA} unit="kT/yr" color={T.green} />
      </DataRow>

      <InfoBox color={T.cyan}>
        <strong style={{ color: T.cyan }}>LNG Regasification & Cold Exergy:</strong> LNG is stored at -162°C. Vaporization absorbs enormous thermal energy (~900 kJ/kg). Using an Organic Rankine Cycle (ORC) with propane/ethane, up to 240 kWh of zero-emission electrical energy can be harvested per tonne of LNG regasified.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.cyan} />

      <ExportBtn
        simId="lng_supply_chain"
        getData={() => ({
          regasRateMTPA,
          vapType,
          seawaterT,
          pipePressBar,
          coldRecovery,
          heatDutyMW: heatDutyMW.toFixed(1),
          coldPowerMW: coldPowerMW.toFixed(2),
          seawaterM3Hr,
          co2SavedKTA,
        })}
        color={T.cyan}
      />
    </div>
  );
}
