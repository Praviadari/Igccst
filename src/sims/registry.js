// ═══════════════════════════════════════
// IGCCST 2026 SIMULATION REGISTRY
// Indo-German Conference on Cryogenics for Sustainable Technologies
// ═══════════════════════════════════════

import { T } from "../utils";

// Core Engineering Sims
import LindeHampsonSim from "./LindeHampsonSim";
import CryocoolerSim from "./CryocoolerSim";
import HydrogenStorageSim from "./HydrogenStorageSim";
import LNGSupplyChainSim from "./LNGSupplyChainSim";
import SuperconductorSim from "./SuperconductorSim";
import HeatExchangerSim from "./HeatExchangerSim";
import DewarInsulationSim from "./DewarInsulationSim";
import ClaudeCollinsSim from "./ClaudeCollinsSim";
import TransferLineSim from "./TransferLineSim";
import DilutionFridgeSim from "./DilutionFridgeSim";

// Layman & Fundamentals Sims (Cryo 101)
import AbsoluteZeroSim from "./AbsoluteZeroSim";
import LeidenfrostSim from "./LeidenfrostSim";
import RocketExpansionSim from "./RocketExpansionSim";
import SuperfluidFountainSim from "./SuperfluidFountainSim";
import ThermosFlaskSim from "./ThermosFlaskSim";
import CryoFreezingSim from "./CryoFreezingSim";

export const CATEGORIES = [
  { id: "all", label: "All (16)", color: T.accent },
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
    id: "rocket_expansion",
    icon: "🚀",
    label: "Why Cryo for Rockets?",
    cat: "basics",
    color: T.pink,
    comp: RocketExpansionSim,
    tags: ["rocket propellant", "density", "expansion ratio", "860x", "ISRO CE-20", "deadweight"],
    related: ["hydrogen_storage", "lng_supply_chain", "absolute_zero"],
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
    icon: "🍓",
    label: "Flash vs Slow Freeze",
    cat: "basics",
    color: T.gold,
    comp: CryoFreezingSim,
    tags: ["ice crystals", "cellular damage", "vitrification", "food preservation", "stem cells"],
    related: ["absolute_zero", "leidenfrost", "thermos_flask"],
  },

  // ─── CRYOGENIC SYSTEMS & LIQUEFACTION ───
  {
    id: "linde_hampson",
    icon: "❄️",
    label: "Linde Liquefier",
    cat: "systems",
    color: T.cyan,
    comp: LindeHampsonSim,
    tags: ["Joule-Thomson", "liquefaction", "nitrogen", "gas separation", "inversion curve"],
    related: ["claude_collins", "heat_exchanger", "dewar_insulation"],
  },
  {
    id: "cryocooler",
    icon: "🔄",
    label: "Stirling Cryocooler",
    cat: "systems",
    color: T.orange,
    comp: CryocoolerSim,
    tags: ["Stirling cycle", "pulse tube", "regenerator", "space cryo", "IR sensors"],
    related: ["linde_hampson", "claude_collins", "superconductor"],
  },
  {
    id: "claude_collins",
    icon: "🌀",
    label: "Collins He Liquefier",
    cat: "systems",
    color: T.gold,
    comp: ClaudeCollinsSim,
    tags: ["helium liquefaction", "turbo-expander", "4.2K", "isentropic expansion"],
    related: ["linde_hampson", "cryocooler", "dilution_fridge"],
  },
  {
    id: "heat_exchanger",
    icon: "📐",
    label: "Cryogenic PFHX",
    cat: "systems",
    color: T.accent,
    comp: HeatExchangerSim,
    tags: ["plate-fin", "counter-flow", "NTU", "pinch point", "exergy efficiency"],
    related: ["linde_hampson", "claude_collins", "transfer_line"],
  },

  // ─── STORAGE & INFRASTRUCTURE ───
  {
    id: "dewar_insulation",
    icon: "🧪",
    label: "Dewar & Vacuum",
    cat: "infrastructure",
    color: T.gold,
    comp: DewarInsulationSim,
    tags: ["vacuum insulation", "MLI", "neck conduction", "hold time", "dewar"],
    related: ["thermos_flask", "hydrogen_storage", "transfer_line"],
  },
  {
    id: "transfer_line",
    icon: "📏",
    label: "Cryo Transfer Line",
    cat: "infrastructure",
    color: T.cyan,
    comp: TransferLineSim,
    tags: ["vacuum jacketed pipe", "thermal contraction", "bellows", "geysering", "chill-down"],
    related: ["dewar_insulation", "lng_supply_chain", "heat_exchanger"],
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
    related: ["rocket_expansion", "dewar_insulation", "lng_supply_chain"],
  },
  {
    id: "lng_supply_chain",
    icon: "🚢",
    label: "LNG Regasification",
    cat: "energy",
    color: T.green,
    comp: LNGSupplyChainSim,
    tags: ["LNG terminal", "cold energy recovery", "ORV", "exergy ORC", "methane"],
    related: ["hydrogen_storage", "heat_exchanger", "transfer_line"],
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
    related: ["cryocooler", "dilution_fridge", "claude_collins"],
  },
  {
    id: "dilution_fridge",
    icon: "⚛️",
    label: "Dilution Fridge (mK)",
    cat: "quantum",
    color: T.purple,
    comp: DilutionFridgeSim,
    tags: ["millikelvin", "He3-He4 dilution", "quantum computing", "qubit cooling", "mK"],
    related: ["superfluid_fountain", "superconductor", "claude_collins"],
  },
];
