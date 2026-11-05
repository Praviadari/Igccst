import { useState, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme, prng } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function HydrogenStorageSim() {
  const [geom, setGeom] = useState("spherical"); // spherical, cylindrical
  const [insul, setInsul] = useState("mli"); // mli, perlite, foam
  const [volumeM3, setVolumeM3] = useState(50); // m3
  const [fillPct, setFillPct] = useState(85); // %
  const [ventP, setVentP] = useState(1.8); // bar
  const [tAmb, setTAmb] = useState(300); // K

  // Hydrogen Properties at 1 atm (20.28 K)
  const rhoLiq = 70.85; // kg/m3
  const hfg = 445.6; // kJ/kg heat of vaporization
  const tLiq = 20.28; // K

  // Insulation heat transfer coefficient U [W/m2·K]
  const uCoeff = {
    mli: 0.06, // Multi-layer insulation with high vacuum
    perlite: 0.42, // Evacuated perlite
    foam: 1.65, // Polyurethane spray foam (non-vacuum)
  }[insul];

  // Surface Area [m2] based on geometry
  // Sphere: V = (4/3)pi r^3 => r = (3V/4pi)^(1/3), A = 4pi r^2
  // Cylinder (L/D = 3:1): V = pi r^2 (6r) = 6pi r^3 => r = (V/6pi)^(1/3), A = 2pi r^2 + 2pi r(6r) = 14pi r^2
  const radius = geom === "spherical"
    ? Math.cbrt((3 * volumeM3) / (4 * Math.PI))
    : Math.cbrt(volumeM3 / (6 * Math.PI));
  
  const surfaceArea = geom === "spherical"
    ? 4 * Math.PI * radius * radius
    : 14 * Math.PI * radius * radius;

  // Heat leak Q [W]
  const deltaT = tAmb - tLiq;
  const qLeakWatts = surfaceArea * uCoeff * deltaT;

  // Total LH2 mass in tank
  const totalMassKg = volumeM3 * (fillPct / 100) * rhoLiq;

  // Boil-Off Rate (BOR) in % per day
  // Mass evaporated per sec = Q / (hfg * 1000)
  const mEvapKgSec = qLeakWatts / (hfg * 1000);
  const mEvapKgDay = mEvapKgSec * 86400;
  const borPctDay = (mEvapKgDay / Math.max(1, totalMassKg)) * 100;

  // Pressure rise rate in sealed tank (bar/day)
  const pressRiseRate = ((qLeakWatts / (totalMassKg * 0.15)) * 0.08).toFixed(2);
  // Dormancy time before venting at ventP
  const dormancyDays = Math.max(0.5, ((ventP - 1.0) / Math.max(0.01, parseFloat(pressRiseRate)))).toFixed(1);

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const canvasTheme = getCanvasTheme();
      const cx = W / 2;
      const cy = H / 2 + 10;

      // Dark background
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W / 2);
      bg.addColorStop(0, canvasTheme.bgStart);
      bg.addColorStop(1, canvasTheme.bgEnd);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Tank dimensions on screen
      const scale = Math.min(1.2, Math.max(0.7, Math.cbrt(volumeM3 / 50)));
      const tr = 55 * scale;

      // Outer Vessel Wall
      ctx.strokeStyle = T.gray;
      ctx.lineWidth = 2;
      if (geom === "spherical") {
        ctx.beginPath();
        ctx.arc(cx, cy, tr + 12, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeRect(cx - tr, cy - tr * 0.8 - 10, tr * 2, tr * 1.6 + 20);
      }

      // Vacuum / Insulation Annulus
      ctx.strokeStyle = insul === "mli" ? T.gold : insul === "perlite" ? T.cyan : T.orange;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 2]);
      if (geom === "spherical") {
        ctx.beginPath();
        ctx.arc(cx, cy, tr + 6, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeRect(cx - tr + 4, cy - tr * 0.8 - 6, tr * 2 - 8, tr * 1.6 + 12);
      }
      ctx.setLineDash([]);

      // Inner Cryogenic Vessel Wall
      ctx.strokeStyle = T.accent;
      ctx.lineWidth = 2;
      if (geom === "spherical") {
        ctx.beginPath();
        ctx.arc(cx, cy, tr, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeRect(cx - tr + 8, cy - tr * 0.8 - 2, tr * 2 - 16, tr * 1.6 + 4);
      }

      // Liquid LH2 fill level
      ctx.save();
      if (geom === "spherical") {
        ctx.beginPath();
        ctx.arc(cx, cy, tr - 2, 0, Math.PI * 2);
        ctx.clip();
      } else {
        ctx.beginPath();
        ctx.rect(cx - tr + 9, cy - tr * 0.8 - 1, tr * 2 - 18, tr * 1.6 + 2);
        ctx.clip();
      }

      const liquidH = (2 * tr) * (fillPct / 100);
      const liquidTopY = (cy + tr) - liquidH;

      // Liquid gradient
      const liqGrad = ctx.createLinearGradient(0, liquidTopY, 0, cy + tr);
      liqGrad.addColorStop(0, "rgba(247, 37, 133, 0.4)");
      liqGrad.addColorStop(1, "rgba(76, 201, 240, 0.6)");
      ctx.fillStyle = liqGrad;
      ctx.fillRect(cx - tr - 10, liquidTopY, (tr + 10) * 2, tr * 2);

      // Liquid surface ripple
      ctx.strokeStyle = T.pink;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = cx - tr; x <= cx + tr; x += 4) {
        const wave = Math.sin((x * 0.1) + (frame * 0.1)) * 2;
        if (x === cx - tr) ctx.moveTo(x, liquidTopY + wave);
        else ctx.lineTo(x, liquidTopY + wave);
      }
      ctx.stroke();

      // Boil-off vapor bubbles rising
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      for (let i = 0; i < 8; i++) {
        const bx = cx - tr * 0.6 + prng(frame, i * 3) * (tr * 1.2);
        const by = liquidTopY + 10 + ((frame * 1.5 + i * 15) % Math.max(10, liquidH - 10));
        ctx.beginPath();
        ctx.arc(bx, by, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Relief Valve / Vent Pipe at Top
      const ventX = cx;
      const ventY = geom === "spherical" ? cy - tr - 14 : cy - tr * 0.8 - 24;
      ctx.strokeStyle = T.gray;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ventX, cy - tr);
      ctx.lineTo(ventX, ventY);
      ctx.stroke();

      // Venting gas if high boil-off
      if (borPctDay > 1.0) {
        ctx.fillStyle = "rgba(255, 107, 53, 0.4)";
        for (let i = 0; i < 4; i++) {
          const vy = ventY - 4 - ((frame * 2 + i * 6) % 15);
          ctx.beginPath();
          ctx.arc(ventX, vy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = T.orange;
        ctx.font = `700 6px ${TECH_FONT}`;
        ctx.textAlign = "center";
        ctx.fillText("VENT", ventX, ventY - 18);
      }

      // HUD overlay
      ctx.font = `800 9px ${MONO_FONT}`;
      ctx.fillStyle = T.pink;
      ctx.textAlign = "left";
      ctx.fillText(`LH2: 20.3 K`, 10, 18);
      ctx.fillStyle = T.gray;
      ctx.fillText(`P_tank: ${ventP} bar`, 10, 30);

      ctx.textAlign = "right";
      ctx.fillStyle = T.accent;
      ctx.fillText(`Vol: ${volumeM3} m³`, W - 10, 18);
    },
    [geom, insul, volumeM3, fillPct, ventP, tAmb, borPctDay],
    { animate: true }
  );

  const buildPrompt = useCallback(
    () => `Liquid Hydrogen Storage & Boil-Off Analysis — IGCCST 2026:
ROLE: Lead cryogenic storage expert advising on the National Green Hydrogen Mission and international liquid hydrogen carrier logistics.
INSTITUTE: Indo-German Conference on Cryogenics for Sustainable Technologies, IIT Kharagpur.

SYSTEM CONFIGURATION:
1. Tank Geometry: ${geom.toUpperCase()}
2. Thermal Protection System: ${insul.toUpperCase()} (U = ${uCoeff} W/m²·K)
3. Total Volume: ${volumeM3} m³ (${totalMassKg.toFixed(0)} kg LH2 payload)
4. Liquid Fill Level: ${fillPct}%
5. Heat Inleak: ${qLeakWatts.toFixed(1)} W (${(qLeakWatts / surfaceArea).toFixed(2)} W/m²)
6. Boil-Off Rate (BOR): ${borPctDay.toFixed(3)} %/day (${mEvapKgDay.toFixed(1)} kg/day)
7. Pressure Build-Up: ${pressRiseRate} bar/day
8. Lock-In Dormancy: ${dormancyDays} days until venting

STRATEGIC ANALYSIS:
1. Ortho-Para Conversion: Explain the exothermic spin isomer conversion (ortho -> para, Δh = 527 kJ/kg) and why catalytic conversion during liquefaction is mandatory to prevent massive boil-off.
2. Vacuum Degradation: How does vacuum breakdown in the double-walled annular space affect BOR and safety risk?
3. Clean Energy Supply Chain: Evaluate the economics of LH2 marine transport between India and Germany compared to ammonia (NH3) or LOHC.`,
    [geom, insul, uCoeff, volumeM3, totalMassKg, fillPct, qLeakWatts, surfaceArea, borPctDay, mEvapKgDay, pressRiseRate, dormancyDays]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={200} maxWidth={280} />

      <PillRow>
        <Pill active={geom === "spherical"} onClick={() => setGeom("spherical")} color={T.accent}>
          Spherical
        </Pill>
        <Pill active={geom === "cylindrical"} onClick={() => setGeom("cylindrical")} color={T.cyan}>
          Cylindrical
        </Pill>
        <Pill active={insul === "mli"} onClick={() => setInsul("mli")} color={T.gold}>
          MLI (Vac)
        </Pill>
        <Pill active={insul === "perlite"} onClick={() => setInsul("perlite")} color={T.purple}>
          Perlite
        </Pill>
        <Pill active={insul === "foam"} onClick={() => setInsul("foam")} color={T.orange}>
          Foam
        </Pill>
      </PillRow>

      <Slider label="Tank Volume" value={volumeM3} onChange={setVolumeM3} min={5} max={500} step={5} unit=" m³" color={T.accent} />
      <Slider label="Liquid Fill Level" value={fillPct} onChange={setFillPct} min={15} max={95} step={1} unit=" %" color={T.pink} />
      <Slider label="Relief Vent Pressure" value={ventP} onChange={setVentP} min={1.1} max={5.0} step={0.1} unit=" bar" color={T.orange} />
      <Slider label="Ambient Temperature" value={tAmb} onChange={setTAmb} min={260} max={325} step={5} unit=" K" color={T.red} />

      <DataRow>
        <DataBox label="BOR" value={borPctDay.toFixed(2)} unit="%/d" color={borPctDay < 0.5 ? T.green : borPctDay < 1.5 ? T.gold : T.red} />
        <DataBox label="Heat Leak" value={qLeakWatts.toFixed(0)} unit="W" color={T.orange} />
        <DataBox label="Loss" value={mEvapKgDay.toFixed(1)} unit="kg/d" color={T.pink} />
        <DataBox label="Dormancy" value={dormancyDays} unit="days" color={T.cyan} />
      </DataRow>

      <InfoBox color={T.pink}>
        <strong style={{ color: T.pink }}>Liquid Hydrogen Boil-Off:</strong> LH2 boils at 20.28 K with a low latent heat of vaporization (445.6 kJ/kg). Multi-layer insulation (MLI) in a high-vacuum annulus reduces heat flux to &lt; 2 W/m². Spherical tanks have the minimum surface-area-to-volume ratio, minimizing boil-off.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.pink} />

      <ExportBtn
        simId="hydrogen_storage"
        getData={() => ({
          geom,
          insul,
          volumeM3,
          fillPct,
          ventP,
          tAmb,
          borPctDay: borPctDay.toFixed(3),
          qLeakWatts: qLeakWatts.toFixed(1),
          mEvapKgDay: mEvapKgDay.toFixed(1),
          dormancyDays,
        })}
        color={T.pink}
      />
    </div>
  );
}
