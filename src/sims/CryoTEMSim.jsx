import { useState, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function CryoTEMSim() {
  const [specimen, setSpecimen] = useState("spike_protein"); // spike_protein, ribosome, ion_channel
  const [cryogenLiquid, setCryogenLiquid] = useState("liquid_ethane"); // liquid_ethane (-188C), liquid_nitrogen (-196C)
  const [plungeSpeedMS, setPlungeSpeedMS] = useState(2.0); // m/s (guillotine plunge velocity)
  const [iceThicknessNm, setIceThicknessNm] = useState(35); // nanometers (optimal is 20-50nm)

  const specimenData = {
    spike_protein: { name: "SARS-CoV-2 Spike (Prefusion)", mwtKD: 450, resA: 2.4, color: T.pink },
    ribosome: { name: "70S Bacterial Ribosome", mwtKD: 2500, resA: 1.8, color: T.accent },
    ion_channel: { name: "Voltage-Gated Ion Channel", mwtKD: 180, resA: 2.8, color: T.green },
  }[specimen];

  // Cooling rate in liquid ethane vs liquid nitrogen:
  // Liquid nitrogen suffers from Leidenfrost vapor insulation (cooling rate ~1,000°C/s -> ICE CRYSTALS DESTROY RESOLUTION)
  // Liquid ethane has no Leidenfrost effect (cooling rate > 100,000°C/s -> PERFECT VITREOUS GLASS!)
  const isEthane = cryogenLiquid === "liquid_ethane";
  const coolingRateCPerSec = isEthane ? 120000 : 1200;
  const isVitrified = isEthane && iceThicknessNm < 80;

  // Achievable imaging resolution in Angstroms (lower is better, < 3Å gives atomic resolution)
  const resolutionA = isVitrified
    ? (specimenData.resA + (iceThicknessNm > 50 ? (iceThicknessNm - 50) * 0.04 : 0)).toFixed(1)
    : "14.5 (Crystalline Ice Blur)";

  // Plunge drop duration into cryogen (milliseconds)
  const plungeDurationMs = (25 / plungeSpeedMS).toFixed(1);

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

      // 1. Plunge Freezer Chamber (Left Half)
      const rigX = 65;
      const rigY = 25;
      const rigW = 75;
      const rigH = 150;

      ctx.fillStyle = T.glass;
      ctx.strokeStyle = T.glassBorder;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(rigX - rigW / 2, rigY, rigW, rigH);

      // Outer Liquid Nitrogen Bath Jacket (Cooling Ethane to -188°C)
      const potY = rigY + rigH - 45;
      ctx.fillStyle = "rgba(76, 201, 240, 0.2)";
      ctx.fillRect(rigX - 28, potY, 56, 40);
      ctx.strokeStyle = T.cyan;
      ctx.strokeRect(rigX - 28, potY, 56, 40);

      // Inner Liquid Ethane Cup
      ctx.fillStyle = isEthane ? "rgba(247, 37, 133, 0.4)" : "rgba(76, 201, 240, 0.4)";
      ctx.fillRect(rigX - 14, potY + 10, 28, 28);
      ctx.strokeStyle = isEthane ? T.pink : T.cyan;
      ctx.strokeRect(rigX - 14, potY + 10, 28, 28);

      ctx.fillStyle = T.white;
      ctx.font = `700 5px ${TECH_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText(isEthane ? "ETHANE" : "LN2", rigX, potY + 24);

      // Guillotine Plunger Rod dropping into pot
      const dropProgress = ((frame * 0.05 * plungeSpeedMS) % 1);
      const rodY = rigY + 10 + dropProgress * (potY - rigY);

      ctx.strokeStyle = T.gray;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(rigX, rigY + 5);
      ctx.lineTo(rigX, rodY);
      ctx.stroke();

      // Tweezers holding EM Grid at bottom of rod
      ctx.strokeStyle = T.gold;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rigX - 4, rodY);
      ctx.lineTo(rigX, rodY + 12);
      ctx.lineTo(rigX + 4, rodY);
      ctx.stroke();

      // Carbon/Gold EM Grid disc
      ctx.fillStyle = T.gold;
      ctx.beginPath();
      ctx.arc(rigX, rodY + 13, 3, 0, Math.PI * 2);
      ctx.fill();

      // 2. Cryo-TEM Electron Microscope Field (Right Half)
      const temX = W - 70;
      const temY = cy;
      const temR = 48;

      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.strokeStyle = isVitrified ? T.green : T.red;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(temX, temY, temR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Electron Beam Cone (Vertical green scanning beam)
      const beamGrad = ctx.createLinearGradient(temX, temY - temR, temX, temY + temR);
      beamGrad.addColorStop(0, "rgba(77, 255, 184, 0.35)");
      beamGrad.addColorStop(1, "transparent");
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(temX - 12, temY - temR);
      ctx.lineTo(temX + 12, temY - temR);
      ctx.lineTo(temX + 24, temY + temR);
      ctx.lineTo(temX - 24, temY + temR);
      ctx.closePath();
      ctx.fill();

      // Protein Structure under TEM
      if (isVitrified) {
        // High resolution crisp atomic density map
        ctx.fillStyle = specimenData.color;
        for (let i = 0; i < 22; i++) {
          const ang = i * 0.45 + frame * 0.01;
          const rad = 6 + (Math.sin(i * 1.5) * 20);
          const px = temX + Math.cos(ang) * rad;
          const py = temY + Math.sin(ang) * rad;
          ctx.beginPath();
          ctx.arc(px, py, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.strokeStyle = `${specimenData.color}80`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 16; i++) {
          const a1 = i * 0.5;
          const r1 = 8 + (i * 2);
          ctx.lineTo(temX + Math.cos(a1) * r1, temY + Math.sin(a1) * r1);
        }
        ctx.stroke();
      } else {
        // Blurry crystalline ice diffraction rings destroying the image
        ctx.strokeStyle = "rgba(255, 77, 109, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(temX, temY, 15, 0, Math.PI * 2);
        ctx.arc(temX, temY, 28, 0, Math.PI * 2);
        ctx.arc(temX, temY, 40, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = T.red;
        ctx.font = `800 7px ${TECH_FONT}`;
        ctx.fillText("ICE ARTIFACT", temX, temY + 4);
      }

      // Diagnostics & HUD
      ctx.font = `800 8px ${TECH_FONT}`;
      ctx.textAlign = "left";
      ctx.fillStyle = T.white;
      ctx.fillText("CRYO-TEM VITRIFICATION", 10, 16);

      ctx.font = `800 9px ${MONO_FONT}`;
      ctx.fillStyle = isVitrified ? T.green : T.red;
      ctx.fillText(
        isVitrified ? `● ATOMIC RES: ${resolutionA} Å` : `▲ BLURRED: ${resolutionA}`,
        10,
        H - 10
      );

      ctx.textAlign = "right";
      ctx.fillStyle = isEthane ? T.pink : T.cyan;
      ctx.fillText(`Cooling: ${coolingRateCPerSec.toLocaleString()}°C/s`, W - 10, 16);
    },
    [specimen, cryogenLiquid, plungeSpeedMS, iceThicknessNm, specimenData, isEthane, isVitrified, resolutionA, coolingRateCPerSec],
    { animate: true }
  );

  const buildPrompt = useCallback(
    () => `Cryo-Electron Microscopy (Cryo-EM) Plunge Vitrification — IGCCST 2026:
ROLE: Structural biologist and cryogenic biophysics researcher (2017 Nobel Prize in Chemistry context).
CONFERENCE: Indo-German Conference on Cryogenics for Sustainable Technologies.

SAMPLE & PLUNGE FREEZING PARAMETERS:
1. Macromolecular Target: ${specimenData.name} (Molecular Weight: ${specimenData.mwtKD} kDa)
2. Plunge Cryogen: ${cryogenLiquid === "liquid_ethane" ? "Liquid Ethane at -188°C (LN2 jacketed)" : "Direct Liquid Nitrogen (-196°C)"}
3. Plunge Velocity: ${plungeSpeedMS} m/s (${plungeDurationMs} ms immersion time)
4. Vitreous Ice Film Thickness: ${iceThicknessNm} nm
5. Effective Cooling Rate: ${coolingRateCPerSec.toLocaleString()} °C/second
6. Cryo-TEM Structural Resolution Achieved: ${resolutionA}
7. Vitrification Quality: ${isVitrified ? "PURE AMORPHOUS GLASS (No crystalline diffraction)" : "CRYSTALLINE ICE ARTIFACTS"}

INQUIRY TOPICS:
1. Why Liquid Ethane Beats Liquid Nitrogen: Explain why liquid nitrogen boils violently (Leidenfrost effect) and cools too slowly to vitrify water, whereas liquid ethane has high thermal conductivity and zero vapor barrier.
2. The 2017 Nobel Prize: Discuss Jacques Dubochet's discovery of water vitrification that opened the atomic-resolution revolution in structural biology.
3. Indian Cryo-EM Facilities: Highlight the National Cryo-EM Facility at IISc Bengaluru and collaborative structural biology initiatives between India and Germany (Max Planck Institutes).`,
    [specimenData, cryogenLiquid, plungeSpeedMS, plungeDurationMs, iceThicknessNm, coolingRateCPerSec, resolutionA, isVitrified]
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={200} maxWidth={280} />

      <PillRow>
        <Pill active={cryogenLiquid === "liquid_ethane"} onClick={() => setCryogenLiquid("liquid_ethane")} color={T.pink}>
          Liquid Ethane (-188°C)
        </Pill>
        <Pill active={cryogenLiquid === "liquid_nitrogen"} onClick={() => setCryogenLiquid("liquid_nitrogen")} color={T.cyan}>
          Liquid N2 (-196°C)
        </Pill>
      </PillRow>

      <PillRow>
        <Pill active={specimen === "spike_protein"} onClick={() => setSpecimen("spike_protein")} color={T.pink}>
          COVID-19 Spike
        </Pill>
        <Pill active={specimen === "ribosome"} onClick={() => setSpecimen("ribosome")} color={T.accent}>
          Ribosome (70S)
        </Pill>
        <Pill active={specimen === "ion_channel"} onClick={() => setSpecimen("ion_channel")} color={T.green}>
          Ion Channel
        </Pill>
      </PillRow>

      <Slider label="Plunge Plunger Speed" value={plungeSpeedMS} onChange={setPlungeSpeedMS} min={0.5} max={3.5} step={0.5} unit=" m/s" color={T.accent} />
      <Slider label="Vitreous Ice Thickness" value={iceThicknessNm} onChange={setIceThicknessNm} min={15} max={100} step={5} unit=" nm" color={T.cyan} />

      <DataRow>
        <DataBox label="Resolution" value={`${resolutionA}`} color={isVitrified ? T.green : T.red} />
        <DataBox label="Cool Rate" value={`${(coolingRateCPerSec / 1000).toFixed(0)}k°/s`} color={T.cyan} />
        <DataBox label="Immersion" value={`${plungeDurationMs}ms`} color={T.gold} />
        <DataBox label="State" value={isVitrified ? "GLASS" : "ICE"} color={isVitrified ? T.green : T.red} />
      </DataRow>

      <InfoBox color={T.pink}>
        <strong style={{ color: T.pink }}>The Nobel-Winning Secret of Cryo-EM:</strong> If you freeze a protein in liquid nitrogen, boiling gas bubbles insulate it, allowing sharp ice crystals to form that scatter electron beams. In Cryo-EM, the grid is shot into <strong>liquid ethane</strong> at 2 m/s. Ethane cools at over 100,000°C per second, freezing the water into a flawless glass window so transparent you can see individual atoms!
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.pink} />

      <ExportBtn
        simId="cryo_tem"
        getData={() => ({
          specimen,
          cryogenLiquid,
          plungeSpeedMS,
          iceThicknessNm,
          coolingRateCPerSec,
          resolutionA,
          isVitrified,
        })}
        color={T.pink}
      />
    </div>
  );
}
