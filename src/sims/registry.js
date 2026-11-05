// ═══════════════════════════════════════
// IGCCST 2026 SIMULATION REGISTRY
// Indo-German Conference on Cryogenics for Sustainable Technologies
// ═══════════════════════════════════════

import { T } from "../utils";

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

export const CATEGORIES = [
  { id: "all", label: "All", color: T.accent },
  { id: "systems", label: "Cooling & Liquefaction", color: T.cyan },
  { id: "infrastructure", label: "Storage & Distribution", color: T.orange },
  { id: "energy", label: "Hydrogen & LNG", color: T.green },
  { id: "quantum", label: "Quantum & Superconductivity", color: T.purple },
];

export const SIM_REGISTRY = [
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
    icon: "🌡️",
    label: "Cryogenic PFHX",
    cat: "systems",
    color: T.accent,
    comp: HeatExchangerSim,
    tags: ["plate-fin", "counter-flow", "NTU", "pinch point", "exergy efficiency"],
    related: ["linde_hampson", "claude_collins", "transfer_line"],
  },
  {
    id: "hydrogen_storage",
    icon: "💧",
    label: "LH2 Storage & BOR",
    cat: "energy",
    color: T.pink,
    comp: HydrogenStorageSim,
    tags: ["liquid hydrogen", "20K", "boil-off", "MLI vacuum", "ortho-para"],
    related: ["dewar_insulation", "lng_supply_chain", "transfer_line"],
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
  {
    id: "dewar_insulation",
    icon: "🧪",
    label: "Dewar & Vacuum",
    cat: "infrastructure",
    color: T.gold,
    comp: DewarInsulationSim,
    tags: ["vacuum insulation", "MLI", "neck conduction", "hold time", "dewar"],
    related: ["hydrogen_storage", "transfer_line", "linde_hampson"],
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
    related: ["superconductor", "claude_collins", "cryocooler"],
  },
];
