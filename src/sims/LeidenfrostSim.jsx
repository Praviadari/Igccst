import { useState, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function LeidenfrostSim() {
  const [surfaceTempK, setSurfaceTempK] = useState(295); // Kelvin of surface (100K to 400K)
  const [dropletSizeMm, setDropletSizeMm] = useState(5); // mm
  const [fluid, setFluid] = useState("ln2"); // ln2 (77K), water (373K), lhe (4.2K)

  const fluidData = {
    ln2: { name: "Liquid Nitrogen", tBoil: 77.4, leidenfrostK: 125, color: T.accent },
    lhe: { name: "Liquid Helium", tBoil: 4.2, leidenfrostK: 8, color: T.gold },
    water: { name: "Water (Kitchen demo)", tBoil: 373.1, leidenfrostK: 465, color: T.cyan },
  }[fluid];

  const deltaT = surfaceTempK - fluidData.tBoil;
  const isLeidenfrost = surfaceTempK > fluidData.leidenfrostK;

  // Vapor film thickness in micrometers (h ~ (k_vapor * ΔT / q)^0.25)
  const vaporFilmUm = isLeidenfrost ? Math.min(150, Math.max(20, (surfaceTempK - fluidData.leidenfrostK) * 0.4)).toFixed(0) : "0";

  // Droplet lifetime before total evaporation (seconds)
  // Film boiling has low heat flux because vapor is an insulator! Contact boiling evaporates 10x faster!
  const lifetimeSec = isLeidenfrost
    ? (dropletSizeMm * 8.5 * (100 / Math.max(20, deltaT * 0.2))).toFixed(1)
    : Math.max(0.5, dropletSizeMm * 0.8).toFixed(1);

  // Heat flux q (kW/m2)
  const heatFlux = isLeidenfrost
    ? Math.min(80, 15 + deltaT * 0.08).toFixed(1)
    : Math.min(300, Math.max(20, deltaT * 1.8)).toFixed(1);

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

      // Warm Floor / Surface Plate (Bottom)
      const floorY = cy + 45;
      const floorH = 35;
      const floorGrad = ctx.createLinearGradient(0, floorY, 0, floorY + floorH);
      const floorR = Math.min(255, Math.max(40, ((surfaceTempK - 100) / 300) * 255));
      floorGrad.addColorStop(0, `rgba(${floorR}, 80, 50, 0.6)`);
      floorGrad.addColorStop(1, "rgba(20, 30, 50, 0.8)");

      ctx.fillStyle = floorGrad;
      ctx.strokeStyle = surfaceTempK > fluidData.leidenfrostK ? T.orange : T.dimText;
      ctx.lineWidth = 2;
      ctx.fillRect(20, floorY, W - 40, floorH);
      ctx.strokeRect(20, floorY, W - 40, floorH);

      // Floor label
      ctx.font = `800 8px ${TECH_FONT}`;
      ctx.fillStyle = T.white;
      ctx.textAlign = "center";
      ctx.fillText(`WARM SURFACE: ${surfaceTempK} K (${(surfaceTempK - 273.15).toFixed(0)}°C)`, cx, floorY + 22);

      // Droplet Skittering Animation
      const dropRadius = dropletSizeMm * 4;
      // Droplet horizontal oscillation (gliding on frictionless vapor)
      const skitterX = isLeidenfrost ? cx + Math.sin(frame * 0.08) * 45 : cx;
      const gapPx = isLeidenfrost ? 10 + (parseFloat(vaporFilmUm) / 15) : 0;
      const dropY = floorY - dropRadius - gapPx;

      // Vapor Cushion Layer (Animated under the droplet)
      if (isLeidenfrost) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = skitterX - dropRadius - 10; x <= skitterX + dropRadius + 10; x += 4) {
          const wave = Math.sin((x * 0.3) + frame * 0.2) * 2;
          if (x === skitterX - dropRadius - 10) ctx.moveTo(x, floorY - 3 + wave);
          else ctx.lineTo(x, floorY - 3 + wave);
        }
        ctx.stroke();

        // Escaping steam/vapor trails on sides
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        for (let i = 0; i < 4; i++) {
          const vx = skitterX + (i % 2 === 0 ? -1 : 1) * (dropRadius + 8 + i * 4);
          const vy = floorY - 4 - ((frame * 1.5 + i * 6) % 25);
          ctx.beginPath();
          ctx.arc(vx, vy, 2 + i * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.font = `700 6px ${TECH_FONT}`;
        ctx.fillStyle = T.accent;
        ctx.fillText("VAPOR CUSHION", skitterX, floorY - gapPx / 2 + 1);
      } else {
        // Violently boiling on contact!
        ctx.fillStyle = "rgba(255, 77, 109, 0.4)";
        for (let i = 0; i < 8; i++) {
          const bx = skitterX - dropRadius + (i * dropRadius * 2) / 8;
          const by = floorY - ((frame * 3 + i * 8) % 30);
          ctx.beginPath();
          ctx.arc(bx, by, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Cryogenic Droplet (Squished sphere)
      ctx.save();
      ctx.translate(skitterX, dropY);
      ctx.scale(1.15, 0.85); // Flattened by gravity and vapor pressure
      ctx.fillStyle = isLeidenfrost ? `${fluidData.color}80` : `${T.red}90`;
      ctx.strokeStyle = fluidData.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, dropRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Droplet temperature HUD
      ctx.font = `800 7px ${MONO_FONT}`;
      ctx.fillStyle = T.white;
      ctx.fillText(`${fluidData.tBoil} K`, skitterX, dropY + 2);

      // Status Banner
      ctx.font = `800 9px ${TECH_FONT}`;
      ctx.textAlign = "left";
      ctx.fillStyle = isLeidenfrost ? T.green : T.red;
      ctx.fillText(
        isLeidenfrost ? `● LEIDENFROST STATE (INSULATING GAS CUSHION)` : `▲ WETTING CONTACT (RAPID FLASH BOIL)`,
        10,
        18
      );

      ctx.font = `700 8px ${MONO_FONT}`;
      ctx.fillStyle = T.dimText;
      ctx.fillText(`ΔT = ${deltaT.toFixed(0)} K above boiling point`, 10, 30);
    },
    [surfaceTempK, dropletSizeMm, fluid, fluidData, deltaT, isLeidenfrost, vaporFilmUm],
    { animate: true }
  );

  const buildPrompt = useCallback(
    () => `Cryogenic Leidenfrost Effect & Film Boiling — IGCCST 2026:
ROLE: Thermal physics communicator explaining boiling heat transfer and cryogenic safety to laymen.
CONFERENCE: Indo-German Conference on Cryogenics for Sustainable Technologies.

SCENARIO:
1. Liquid Cryogen: ${fluidData.name} (Boiling Point: ${fluidData.tBoil} K)
2. Surface Temperature: ${surfaceTempK} K (${(surfaceTempK - 273.15).toFixed(0)} °C)
3. Temperature Difference (ΔT): ${deltaT.toFixed(0)} K
4. Regime: ${isLeidenfrost ? "Stable Film Boiling (Leidenfrost)" : "Transition / Nucleate Boiling"}
5. Vapor Cushion Thickness: ${vaporFilmUm} μm
6. Droplet Lifetime: ${lifetimeSec} seconds
7. Boiling Heat Flux: ${heatFlux} kW/m²

EXPLANATION INQUIRY:
1. Layman Physics: Why does a splash of liquid nitrogen glide harmlessly across human skin for a brief second instead of causing instant frostbite?
2. Thermal Conductivity of Vapor: Contrast the thermal conductivity of nitrogen gas (~0.025 W/m·K) with liquid nitrogen (~0.13 W/m·K) to explain why the vapor cushion acts as a heat shield.
3. Industrial Relevance: Why is the Leidenfrost effect actually a major engineering obstacle during cryogenic pipe chill-down and metal quench cooling?`,
    [fluidData, surfaceTempK, deltaT, isLeidenfrost, vaporFilmUm, lifetimeSec, heatFlux]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={200} maxWidth={280} />

      <PillRow>
        <Pill active={fluid === "ln2"} onClick={() => setFluid("ln2")} color={T.accent}>
          Liquid N2 (77K)
        </Pill>
        <Pill active={fluid === "lhe"} onClick={() => setFluid("lhe")} color={T.gold}>
          Liquid He (4K)
        </Pill>
        <Pill active={fluid === "water"} onClick={() => setFluid("water")} color={T.cyan}>
          Water (373K)
        </Pill>
      </PillRow>

      <Slider label="Surface Temperature" value={surfaceTempK} onChange={setSurfaceTempK} min={80} max={380} step={5} unit=" K" color={surfaceTempK > fluidData.leidenfrostK ? T.orange : T.cyan} />
      <Slider label="Droplet Diameter" value={dropletSizeMm} onChange={setDropletSizeMm} min={2} max={10} step={1} unit=" mm" color={T.accent} />

      <DataRow>
        <DataBox label="State" value={isLeidenfrost ? "LEVITATING" : "WETTING"} color={isLeidenfrost ? T.green : T.red} />
        <DataBox label="Vapor Film" value={vaporFilmUm} unit="μm" color={T.cyan} />
        <DataBox label="Lifespan" value={lifetimeSec} unit="s" color={T.gold} />
        <DataBox label="Heat Flux" value={heatFlux} unit="kW/m²" color={T.orange} />
      </DataRow>

      <InfoBox color={T.accent}>
        <strong style={{ color: T.accent }}>Why Doesn't LN2 Burn Your Hand Instantly?</strong> Because human skin (310 K) is over 230°C hotter than liquid nitrogen (77 K). The liquid touching your hand flashes into a micro-layer of gas within milliseconds. Because gas conducts heat 100 times slower than liquid, this vapor cushion acts as an invisible heat shield!
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.accent} />

      <ExportBtn
        simId="leidenfrost"
        getData={() => ({
          fluid,
          surfaceTempK,
          dropletSizeMm,
          isLeidenfrost,
          vaporFilmUm,
          lifetimeSec,
          heatFlux,
        })}
        color={T.accent}
      />
    </div>
  );
}
