import { useState, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function RocketExpansionSim() {
  const [fluid, setFluid] = useState("lox"); // lox, lh2, ln2, lng
  const [liquidLiters, setLiquidLiters] = useState(5); // Liters of liquid (1 to 20)
  const [storagePressureBar, setStoragePressureBar] = useState(200); // bar for compressed gas tank alternative

  const propellantData = {
    lox: { name: "Liquid Oxygen (LOX)", tBoil: 90.2, expansionRatio: 860, rhoLiq: 1.141, rocket: "ISRO LVM3 / CE-20 Oxidizer", color: T.accent },
    lh2: { name: "Liquid Hydrogen (LH2)", tBoil: 20.3, expansionRatio: 848, rhoLiq: 0.071, rocket: "ISRO CE-20 Fuel / Ariane 5", color: T.pink },
    ln2: { name: "Liquid Nitrogen (LN2)", tBoil: 77.4, expansionRatio: 694, rhoLiq: 0.808, rocket: "Inert Purge / Pressurization", color: T.cyan },
    lng: { name: "Liquid Methane (LCH4)", tBoil: 111.7, expansionRatio: 600, rhoLiq: 0.422, rocket: "Next-Gen Starship / New Glenn", color: T.gold },
  }[fluid];

  // Expanded gas volume at 1 atm and 20°C (Liters)
  const gasVolumeL = (liquidLiters * propellantData.expansionRatio).toFixed(0);
  const gasVolumeM3 = (parseFloat(gasVolumeL) / 1000).toFixed(2);

  // If stored as compressed gas at storagePressureBar (e.g. 200 bar):
  // V_gas_tank = V_gas_1atm / P_tank
  const highPressTankL = (parseFloat(gasVolumeL) / storagePressureBar).toFixed(1);

  // Weight of steel compressed gas tank vs lightweight thin cryogenic tank:
  // 200 bar steel bottle weighs ~1.2 kg per liter capacity!
  const gasTankWeightKg = (parseFloat(highPressTankL) * 1.25).toFixed(1);
  const cryoTankWeightKg = (liquidLiters * 0.12).toFixed(1);
  const weightSavingKg = (parseFloat(gasTankWeightKg) - parseFloat(cryoTankWeightKg)).toFixed(1);

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

      // 1. Liquid Cryogen Bottle (Left side)
      const botX = 45;
      const botY = cy + 15;
      const botW = 28;
      const botH = 46;

      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.strokeStyle = propellantData.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(botX - botW / 2, botY - botH / 2, botW, botH, 6);
      ctx.fill();
      ctx.stroke();

      // Liquid pool inside bottle
      ctx.fillStyle = `${propellantData.color}80`;
      ctx.fillRect(botX - botW / 2 + 2, botY - botH / 2 + 10, botW - 4, botH - 12);

      ctx.fillStyle = T.white;
      ctx.font = `800 7px ${TECH_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText(`${liquidLiters}L LIQUID`, botX, botY + botH / 2 + 12);
      ctx.fillText(`${propellantData.tBoil} K`, botX, botY + 2);

      // 2. Expansion Arrow (Center)
      ctx.strokeStyle = T.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(botX + botW / 2 + 8, cy);
      ctx.lineTo(botX + botW / 2 + 38, cy);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(botX + botW / 2 + 32, cy - 5);
      ctx.lineTo(botX + botW / 2 + 40, cy);
      ctx.lineTo(botX + botW / 2 + 32, cy + 5);
      ctx.stroke();

      ctx.font = `800 8px ${MONO_FONT}`;
      ctx.fillStyle = T.orange;
      ctx.fillText(`${propellantData.expansionRatio}x`, botX + botW / 2 + 22, cy - 8);

      // 3. Giant Gas Expansion Cloud (Right side)
      const cloudX = W - 75;
      const cloudY = cy;
      const cloudRadius = Math.min(60, 25 + Math.cbrt(parseFloat(gasVolumeL)) * 2);

      // Animated pulsing gas cloud
      const pulse = Math.sin(frame * 0.05) * 3;
      const gasGrad = ctx.createRadialGradient(cloudX, cloudY, 0, cloudX, cloudY, cloudRadius + pulse);
      gasGrad.addColorStop(0, `${propellantData.color}60`);
      gasGrad.addColorStop(0.7, "rgba(255, 107, 53, 0.25)");
      gasGrad.addColorStop(1, "transparent");

      ctx.fillStyle = gasGrad;
      ctx.beginPath();
      ctx.arc(cloudX, cloudY, cloudRadius + pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = propellantData.color;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.arc(cloudX, cloudY, cloudRadius + pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Floating gas particles
      ctx.fillStyle = T.white;
      for (let i = 0; i < 10; i++) {
        const ang = (i / 10) * Math.PI * 2 + frame * 0.02;
        const dist = ((frame * 0.8 + i * 8) % (cloudRadius - 5));
        ctx.beginPath();
        ctx.arc(cloudX + Math.cos(ang) * dist, cloudY + Math.sin(ang) * dist, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = T.white;
      ctx.font = `800 8px ${TECH_FONT}`;
      ctx.fillText(`${gasVolumeL} L GAS`, cloudX, cloudY - 4);
      ctx.fillStyle = T.cyan;
      ctx.font = `700 7px ${MONO_FONT}`;
      ctx.fillText(`(${gasVolumeM3} m³ room)`, cloudX, cloudY + 8);

      // Top Header HUD
      ctx.font = `800 8px ${TECH_FONT}`;
      ctx.textAlign = "left";
      ctx.fillStyle = propellantData.color;
      ctx.fillText(propellantData.rocket, 10, 16);
    },
    [fluid, liquidLiters, propellantData, gasVolumeL, gasVolumeM3],
    { animate: true }
  );

  const buildPrompt = useCallback(
    () => `Why Rockets Must Use Cryogenics: Expansion Ratio & Mass Fraction — IGCCST 2026:
ROLE: Aerospace propulsion engineer explaining rocket propellants to students and laymen.
CONFERENCE: Indo-German Conference on Cryogenics for Sustainable Technologies.

ANALYSIS SCENARIO:
1. Propellant Evaluated: ${propellantData.name} (${propellantData.rocket})
2. Cryogenic Liquid Volume: ${liquidLiters} Liters
3. Expansion Ratio (Liquid to 1 atm Gas): 1 to ${propellantData.expansionRatio}
4. Expanded Ambient Gas Volume: ${gasVolumeL} Liters (${gasVolumeM3} m³)
5. Equivalent 200-bar Heavy Pressure Tank Required: ${highPressTankL} Liters
6. Steel Pressure Tank Deadweight: ~${gasTankWeightKg} kg
7. Lightweight Cryogenic Tank Mass: ~${cryoTankWeightKg} kg
8. Rocket Deadweight Saved: ~${weightSavingKg} kg

EXPLANATION INQUIRY:
1. Tsiolkovsky Rocket Equation: How does deadweight (structural mass fraction) exponentially kill payload capacity to orbit, explaining why heavy pressurized gas tanks cannot reach space?
2. Liquid Density Advantage: Explain how condensing oxygen into a $-183^\circ\text{C}$ liquid packs $860\times$ more oxidizer into the rocket fuselage.
3. ISRO Cryogenic Stage: Highlight India's indigenous cryogenic engine journey (CE-7.5, CE-20 for Chandrayaan-3 and Gaganyaan).`,
    [propellantData, liquidLiters, gasVolumeL, gasVolumeM3, highPressTankL, gasTankWeightKg, cryoTankWeightKg, weightSavingKg]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={200} maxWidth={280} />

      <PillRow>
        <Pill active={fluid === "lox"} onClick={() => setFluid("lox")} color={T.accent}>
          LOX (Oxygen)
        </Pill>
        <Pill active={fluid === "lh2"} onClick={() => setFluid("lh2")} color={T.pink}>
          LH2 (Hydrogen)
        </Pill>
        <Pill active={fluid === "lng"} onClick={() => setFluid("lng")} color={T.gold}>
          Methane (LNG)
        </Pill>
        <Pill active={fluid === "ln2"} onClick={() => setFluid("ln2")} color={T.cyan}>
          Nitrogen (Air)
        </Pill>
      </PillRow>

      <Slider label="Liquid Volume" value={liquidLiters} onChange={setLiquidLiters} min={1} max={20} step={1} unit=" Liters" color={propellantData.color} />
      <Slider label="Alternative Gas Tank Pressure" value={storagePressureBar} onChange={setStoragePressureBar} min={100} max={350} step={25} unit=" bar" color={T.orange} />

      <DataRow>
        <DataBox label="Expansion" value={`${propellantData.expansionRatio}x`} color={T.gold} />
        <DataBox label="Gas Volume" value={`${gasVolumeL}L`} color={T.cyan} />
        <DataBox label="Room Vol." value={`${gasVolumeM3}`} unit="m³" color={T.green} />
        <DataBox label="Mass Saved" value={`-${weightSavingKg}`} unit="kg" color={T.pink} />
      </DataRow>

      <InfoBox color={propellantData.color}>
        <strong style={{ color: propellantData.color }}>Why Not Just Use Compressed Gas in Rockets?</strong> 1 liter of liquid oxygen expands into 860 liters of gas! To hold that much gas at room temperature would require thick, heavy steel tanks weighing over 100 times more than the propellant itself. A rocket built with ambient pressure or steel tanks would be far too heavy to ever reach orbit!
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={propellantData.color} />

      <ExportBtn
        simId="rocket_expansion"
        getData={() => ({
          fluid,
          liquidLiters,
          storagePressureBar,
          expansionRatio: propellantData.expansionRatio,
          gasVolumeL,
          gasVolumeM3,
          weightSavingKg,
        })}
        color={propellantData.color}
      />
    </div>
  );
}
