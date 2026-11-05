# IGCCST 2026 — Interactive Cryogenics Simulation Hub ❄️

Interactive Cryogenics Simulation Hub created for the **Indo-German Conference on Cryogenics for Sustainable Technologies (IGCCST 2026)**, hosted at the **Cryogenic Engineering Centre, IIT Kharagpur**, November 09 – 11, 2026.

Live deployment: [https://igccst.adaripraveen.com](https://igccst.adaripraveen.com)  
Conference website: [https://igccst2026.com](https://igccst2026.com)

---

## 🔬 Interactive Simulations

The portal features 10 real-time physics simulations with interactive parameters, canvas animations, and AI-assisted scientific reasoning:

### 1. Cryogenic Systems (Cooling & Liquefaction)
* **Linde-Hampson Gas Liquefaction Cycle**: Explore Joule-Thomson throttling, inversion temperature boundaries (N₂, H₂, He), and counter-flow heat exchanger effectiveness.
* **Stirling / Pulse Tube Cryocooler**: Model regenerative cooling, frequency response, swept volume, Carnot COP, and cooldown dynamics for tactical IR & space sensors.
* **Claude-Collins Helium Liquefier**: Simulate helium liquefaction below 15K using multi-stage turbo-expanders and liquid nitrogen precooling.
* **Cryogenic Plate-Fin Heat Exchanger (PFHX)**: Calculate ε-NTU effectiveness, thermal pinch points, and LMTD for counter-flow and cross-flow brazed aluminum cores.

### 2. Infrastructure (Storage & Distribution)
* **Cryogenic Dewar & Vacuum Insulation**: Analyze radiation heat leak through Multi-Layer Insulation (MLI), neck tube conduction (G10 vs stainless steel), and residual molecular gas conduction below 10⁻⁴ mbar.
* **Vacuum Jacketed Cryogenic Transfer Line**: Model hydrodynamic friction drop (Darcy-Weisbach), thermal contraction shrinkage, bellows joints, and line chill-down transients.

### 3. Clean Energy (Hydrogen & LNG Technologies)
* **Liquid Hydrogen (LH₂) Storage & Boil-Off**: Estimate boil-off rate (BOR), tank geometry surface-to-volume ratio, ortho-para hydrogen conversion implications, and holding dormancy.
* **LNG Regasification & Cold Energy Recovery**: Model Open Rack Vaporizers (ORV), seawater heat duties, and Organic Rankine Cycle (ORC) power generation from cryogenic exergy.

### 4. Quantum & Advanced Technologies
* **Superconductor Cooling & Magnetic Levitation**: Explore Type-II high-temperature superconductors (YBCO, BSCCO, MgB₂), Meissner flux exclusion, and flux pinning levitation force.
* **Dilution Refrigerator (mK Cooling)**: Model ³He/⁴He spontaneous phase separation, osmotic cooling across phase boundaries, and microwatt cooling lift down to 10 mK for quantum processors.

---

## 🛠️ Features

* **Real-time Canvas Rendering**: HiDPI 60 FPS animated thermodynamic diagrams and fluid flow visualizations.
* **Compare Mode**: Side-by-side parameter comparison (Config A vs Config B).
* **Exhibit / Kiosk Mode**: Auto-cycling through simulations for conference booth touchscreens.
* **AI Analysis Prompt Generator**: Pre-formulates structured physics prompts with parameters for Gemini and ChatGPT.
* **JSON Export**: Export simulation parameters and calculated engineering metrics.
* **PWA & Offline Support**: Progressive Web App capabilities for mobile and desktop booth displays.

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/adaripraveen/Igccst.git

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 📜 Conference Details

* **Event**: Indo-German Conference on Cryogenics for Sustainable Technologies (IGCCST 2026)
* **Venue**: Gargi Auditorium, IIT Kharagpur, West Bengal, India
* **Dates**: November 09 – 11, 2026
* **Website**: [igccst2026.com](https://igccst2026.com/)
