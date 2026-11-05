// ═══════════════════════════════════════
// IGCCST 2026 SIMULATION REGISTRY (26 SIMULATIONS)
// Indo-German Conference on Cryogenics for Sustainable Technologies
// ═══════════════════════════════════════

import { T } from "../utils";

// Cryo 101 & Fundamentals
import AbsoluteZeroSim from "./AbsoluteZeroSim";
import LeidenfrostSim from "./LeidenfrostSim";
import RocketExpansionSim from "./RocketExpansionSim";
import ThermosFlaskSim from "./ThermosFlaskSim";
import SuperfluidFountainSim from "./SuperfluidFountainSim";
import CryoFreezingSim from "./CryoFreezingSim";
import CryoTEMSim from "./CryoTEMSim";
import DuctileBrittleSim from "./DuctileBrittleSim";

// Cryogenic Systems & Cycles
import LindeHampsonSim from "./LindeHampsonSim";
import CryocoolerSim from "./CryocoolerSim";
import ClaudeCollinsSim from "./ClaudeCollinsSim";
import HeatExchangerSim from "./HeatExchangerSim";
import AirSeparationSim from "./AirSeparationSim";
import RegenerativeCoolingSim from "./RegenerativeCoolingSim";
import JouleThomsonSim from "./JouleThomsonSim";

// Storage & Infrastructure
import DewarInsulationSim from "./DewarInsulationSim";
import TransferLineSim from "./TransferLineSim";
import SuperconductingCableSim from "./SuperconductingCableSim";
import ThermalContractionSim from "./ThermalContractionSim";
import HeliumRecoverySim from "./HeliumRecoverySim";

// Hydrogen & Clean Energy
import HydrogenStorageSim from "./HydrogenStorageSim";
import LNGSupplyChainSim from "./LNGSupplyChainSim";
import OrthoParaSim from "./OrthoParaSim";

// Quantum & Superconductivity
import SuperconductorSim from "./SuperconductorSim";
import DilutionFridgeSim from "./DilutionFridgeSim";
import MRIQuenchSim from "./MRIQuenchSim";

export const CATEGORIES = [
  { id: "all", label: "All (26)", color: T.accent },
  { id: "basics", label: "Cryo 101 (Basics)", color: T.green },
  { id: "systems", label: "Cooling & Liquefaction", color: T.cyan },
  { id: "infrastructure", label: "Storage & Distribution", color: T.orange },
  { id: "energy", label: "Hydrogen & LNG", color: T.gold },
  { id: "quantum", label: "Quantum & Superconductivity", color: T.purple },
];

export const SIM_REGISTRY = [
  // ─── CRYO 101 (FUNDAMENTALS & BASICS) ───
  {
    id: "absolute_zero",
    icon: "🌡️",
    label: "Absolute Zero & Motion",
    cat: "basics",
    color: T.cyan,
    comp: AbsoluteZeroSim,
    tags: ["0 Kelvin", "Brownian motion", "atomic jiggle", "RMS speed", "thermal physics 101"],
    related: ["leidenfrost", "thermos_flask", "superfluid_fountain"],
  },
  {
    id: "leidenfrost",
    icon: "💧",
    label: "Leidenfrost Effect",
    cat: "basics",
    color: T.orange,
    comp: LeidenfrostSim,
    tags: ["gas cushion", "boiling curve", "why LN2 doesn't burn", "film boiling", "skittering"],
    related: ["absolute_zero", "thermos_flask", "cryo_freezing"],
  },
  {
    id: "ductile_brittle",
    icon: "🔨",
    label: "Brittle Fracture & Shatter",
    cat: "basics",
    color: T.red,
    comp: DuctileBrittleSim,
    tags: ["Challenger O-ring", "Titanic steel", "DBTT", "Charpy test", "FCC vs BCC", "embrittlement"],
    related: ["thermal_contraction", "absolute_zero", "dewar_insulation"],
  },
  {
    id: "rocket_expansion",
    icon: "🚀",
    label: "Why Cryo for Rockets?",
    cat: "basics",
    color: T.pink,
    comp: RocketExpansionSim,
    tags: ["rocket propellant", "density", "expansion ratio", "860x", "ISRO CE-20", "deadweight"],
    related: ["regenerative_cooling", "hydrogen_storage", "lng_supply_chain"],
  },
  {
    id: "thermos_flask",
    icon: "🫙",
    label: "The Thermos Principle",
    cat: "basics",
    color: T.green,
    comp: ThermosFlaskSim,
    tags: ["conduction", "convection", "radiation", "silver mirror", "vacuum flask", "dewar"],
    related: ["dewar_insulation", "absolute_zero", "leidenfrost"],
  },
  {
    id: "superfluid_fountain",
    icon: "⛲",
    label: "Superfluid Fountain",
    cat: "basics",
    color: T.accent,
    comp: SuperfluidFountainSim,
    tags: ["Helium II", "zero viscosity", "thermomechanical", "creeping film", "quantum fluid"],
    related: ["dilution_fridge", "claude_collins", "absolute_zero"],
  },
  {
    id: "cryo_freezing",
    icon: "❄️",
    label: "Flash Freezing vs Ice Daggers",
    cat: "basics",
    color: T.cyan,
    comp: CryoFreezingSim,
    tags: ["ice crystals", "cell membranes", "food preservation", "LN2 flash freeze", "vitrification"],
    related: ["cryo_tem", "absolute_zero", "leidenfrost"],
  },
  {
    id: "cryo_tem",
    icon: "🔬",
    label: "Cryo-EM Vitrification",
    cat: "basics",
    color: T.pink,
    comp: CryoTEMSim,
    tags: ["cryo-electron microscopy", "Nobel prize", "vitreous amorphous ice", "liquid ethane plunge"],
    related: ["cryo_freezing", "superfluid_fountain", "absolute_zero"],
  },

  // ─── COOLING & LIQUEFACTION (SYSTEMS) ───
  {
    id: "linde_hampson",
    icon: "🌀",
    label: "Linde-Hampson Liquefier",
    cat: "systems",
    color: T.cyan,
    comp: LindeHampsonSim,
    tags: ["Joule-Thomson", "counter-flow HX", "compressor", "liquefaction", "N2 cycle"],
    related: ["claude_collins", "heat_exchanger", "cryocooler", "joule_thomson"],
  },
  {
    id: "joule_thomson",
    icon: "💨",
    label: "Joule-Thomson Inversion",
    cat: "systems",
    color: T.cyan,
    comp: JouleThomsonSim,
    tags: ["throttling", "inversion curve", "van der Waals", "why H2 heats up", "isenthalpic"],
    related: ["linde_hampson", "claude_collins", "heat_exchanger"],
  },
  {
    id: "air_separation",
    icon: "🏭",
    label: "Air Separation Unit (ASU)",
    cat: "systems",
    color: T.accent,
    comp: AirSeparationSim,
    tags: ["fractional distillation", "liquid oxygen", "nitrogen", "reflux ratio", "tray column"],
    related: ["linde_hampson", "heat_exchanger", "lng_supply_chain"],
  },
  {
    id: "regenerative_cooling",
    icon: "🔥",
    label: "Rocket Nozzle Cooling",
    cat: "systems",
    color: T.orange,
    comp: RegenerativeCoolingSim,
    tags: ["rocket engine", "combustion chamber", "CE-20", "supercritical hydrogen", "Bartz flux"],
    related: ["rocket_expansion", "hydrogen_storage", "heat_exchanger"],
  },
  {
    id: "cryocooler",
    icon: "🔄",
    label: "Stirling / Pulse Tube",
    cat: "systems",
    color: T.orange,
    comp: CryocoolerSim,
    tags: ["Stirling cycle", "regenerator matrix", "satellite cooling", "pulse tube", "COP"],
    related: ["linde_hampson", "claude_collins", "superconductor"],
  },
  {
    id: "claude_collins",
    icon: "⚙️",
    label: "Claude-Collins Liquefier",
    cat: "systems",
    color: T.green,
    comp: ClaudeCollinsSim,
    tags: ["expansion engine", "isentropic expansion", "Helium liquefaction", "turboexpander"],
    related: ["linde_hampson", "cryocooler", "heat_exchanger", "joule_thomson"],
  },
  {
    id: "heat_exchanger",
    icon: "🔁",
    label: "Plate-Fin Heat Exchanger",
    cat: "systems",
    color: T.gold,
    comp: HeatExchangerSim,
    tags: ["BAHX", "pinch point", "NTU-effectiveness", "corrugated fins", "counterflow"],
    related: ["linde_hampson", "claude_collins", "air_separation"],
  },

  // ─── STORAGE & INFRASTRUCTURE ───
  {
    id: "dewar_insulation",
    icon: "🛡️",
    label: "Cryogenic Storage Dewar",
    cat: "infrastructure",
    color: T.cyan,
    comp: DewarInsulationSim,
    tags: ["MLI radiation shields", "high vacuum", "boil-off rate", "neck conduction", "storage"],
    related: ["thermos_flask", "transfer_line", "hydrogen_storage"],
  },
  {
    id: "thermal_contraction",
    icon: "📏",
    label: "Shrinkage & Bellows",
    cat: "infrastructure",
    color: T.gold,
    comp: ThermalContractionSim,
    tags: ["thermal contraction", "expansion bellows", "Invar 36", "pipe rupture", "thermal stress"],
    related: ["transfer_line", "ductile_brittle", "dewar_insulation"],
  },
  {
    id: "transfer_line",
    icon: "🚰",
    label: "Vacuum Transfer Line",
    cat: "infrastructure",
    color: T.orange,
    comp: TransferLineSim,
    tags: ["vacuum jacketed pipe", "thermal contraction", "bellows", "geysering", "chill-down"],
    related: ["thermal_contraction", "superconducting_cable", "dewar_insulation"],
  },
  {
    id: "helium_recovery",
    icon: "♻️",
    label: "Helium Conservation Loop",
    cat: "infrastructure",
    color: T.green,
    comp: HeliumRecoverySim,
    tags: ["helium recovery", "non-renewable", "77K cold trap", "gas balloon", "sustainability"],
    related: ["mri_quench", "dewar_insulation", "claude_collins"],
  },
  {
    id: "superconducting_cable",
    icon: "🔌",
    label: "Superconducting Grid",
    cat: "infrastructure",
    color: T.green,
    comp: SuperconductingCableSim,
    tags: ["HTS power cable", "zero resistance", "300MW in 15cm", "LN2 cooled", "AmpaCity"],
    related: ["superconductor", "transfer_line", "dewar_insulation"],
  },

  // ─── HYDROGEN & CLEAN ENERGY ───
  {
    id: "hydrogen_storage",
    icon: "⚡",
    label: "LH2 Storage & BOR",
    cat: "energy",
    color: T.pink,
    comp: HydrogenStorageSim,
    tags: ["liquid hydrogen", "20K", "boil-off", "MLI vacuum", "ortho-para"],
    related: ["ortho_para", "rocket_expansion", "dewar_insulation"],
  },
  {
    id: "ortho_para",
    icon: "⚛️",
    label: "Ortho-to-Para H2 Flip",
    cat: "energy",
    color: T.pink,
    comp: OrthoParaSim,
    tags: ["quantum spin", "nuclear isomers", "703 kJ/kg heat", "Fe2O3 catalyst", "boil-off"],
    related: ["hydrogen_storage", "rocket_expansion", "joule_thomson"],
  },
  {
    id: "lng_supply_chain",
    icon: "🚢",
    label: "LNG Regasification",
    cat: "energy",
    color: T.green,
    comp: LNGSupplyChainSim,
    tags: ["LNG terminal", "cold energy recovery", "ORV", "exergy ORC", "methane"],
    related: ["hydrogen_storage", "air_separation", "heat_exchanger"],
  },

  // ─── QUANTUM & SUPERCONDUCTIVITY ───
  {
    id: "superconductor",
    icon: "🧲",
    label: "Superconductor & MagLev",
    cat: "quantum",
    color: T.accent,
    comp: SuperconductorSim,
    tags: ["Meissner effect", "flux pinning", "YBCO", "HTS", "critical field", "MagLev"],
    related: ["mri_quench", "superconducting_cable", "dilution_fridge"],
  },
  {
    id: "mri_quench",
    icon: "🩻",
    label: "MRI Magnet & Quench",
    cat: "quantum",
    color: T.purple,
    comp: MRIQuenchSim,
    tags: ["hospital MRI", "persistent mode", "zero wall power", "thermal quench", "helium plume"],
    related: ["superconductor", "helium_recovery", "dilution_fridge"],
  },
  {
    id: "dilution_fridge",
    icon: "❄️",
    label: "Dilution Fridge (mK)",
    cat: "quantum",
    color: T.purple,
    comp: DilutionFridgeSim,
    tags: ["millikelvin", "He3-He4 dilution", "quantum computing", "qubit cooling", "mK"],
    related: ["superfluid_fountain", "superconductor", "claude_collins"],
  },
];
