// ═══════════════════════════════════════
// IGCCST 2026 programme + abstract booklet, and the link from each talk/poster to a simulation.
// Sources (organisers): "PROGRAMME SCHEDULE" PDF and the Abstract Booklet, both linked from
// https://igccst2026.com/ (#schedule and Conference Resources). Times IST.
// `abs` = abstract ID in the booklet. `sim` = related simulation in this hub (our link, not the organisers').
// ═══════════════════════════════════════

export const OFFICIAL_SCHEDULE_URL = "https://igccst2026.com/#schedule";
export const ABSTRACT_BOOKLET_URL = "https://drive.google.com/file/d/1DGa_4g_ctqE4Wj9fyCgIzMaYnCt_35ep/view";

export const SCHEDULE = [
  {
    day: "Day 1 — Mon, Nov 09",
    date: "2026-11-09",
    events: [
      { time: "08:00–10:00", title: "Registration", type: "registration" },
      { time: "10:00–10:30", title: "Inaugural Programme", type: "ceremony" },
      { time: "10:30–11:00", title: "High Tea", type: "break" },
      { title: "Session 1 | Cooling and Liquefaction Technologies", speaker: "Chair: Prof. T. S. Dutta", type: "session" },
      { time: "11:00–11:30", title: "General Aspects in Cryogenics", speaker: "Prof. Christoph Haberstroh, Technische Universität Dresden", type: "talk", abs: "SP05", sim: "absolute_zero" },
      { time: "11:30–12:00", title: "Recent Advances in Cryogenic Technology Development at BARC", speaker: "Dr. Anindya Chakraborty, Head, Cryo-Technology Division, BARC", type: "talk", abs: "SP01", sim: "claude_collins" },
      { time: "12:00–12:30", title: "Cryogenic Aspects in a Global Green Hydrogen Economy", speaker: "Prof. Dirk Lindackers, Research Technology Department, IFW Dresden", type: "talk", abs: "SP17", sim: "hydrogen_storage" },
      { time: "12:30–13:00", title: "A Novel Turboexpander for Cryogenic Liquefaction Applications", speaker: "Prof. Parthasarathi Ghosh, Professor & Head, Cryogenic Engineering Centre, IIT Kharagpur", type: "talk", abs: "SP22", sim: "claude_collins" },
      { time: "13:00–14:00", title: "Lunch Break", type: "break" },
      { title: "Session 2 | Quantum Materials and Technology", speaker: "Chair: Prof. Prasanna Kumar Sahoo", type: "session" },
      { time: "14:00–14:30", title: "The Cryogenic–Quantum Interface: Enabling Next-Generation Quantum Systems", speaker: "Dr. Prashant C. Upadhya, Director, Wadhwani Innovation Network, CoE for Quantum Technologies, IISc", type: "talk", abs: "SP13", sim: "dilution_fridge" },
      { time: "14:30–15:00", title: "Classical and Quantum Effects on the Vortex State in Superconducting Thin Films", speaker: "Prof. Pratap Raychaudhuri, TIFR Mumbai", type: "talk", abs: "SP21", sim: "superconductor" },
      { time: "15:00–15:30", title: "Non-volatile Josephson Memory Devices", speaker: "Dr. Avradeep Pal, Physics, IIT Bombay", type: "talk", abs: "SP10", sim: "superconductor" },
      { time: "15:30–16:00", title: "Quantum Materials for Cryogenic Applications", speaker: "Prof. Venimadhav Adyam, IIT Kharagpur", type: "talk", abs: "SP24", sim: "adr" },
      { time: "16:00–16:15", title: "Tea Break", type: "break" },
      { time: "16:15–16:45", title: "Pulse Schemes for Increasing Coherence Time in an Ensemble of Nitrogen-Vacancy Centres in Diamond", speaker: "Prof. Chiranjib Mitra, IISER Kolkata", type: "talk", abs: "SP20" },
      { title: "Oral Presentations by Students & Faculty (10 min each)", type: "oral-head" },
      { time: "16:45–16:55", title: "CFD Investigation of Fluid Transient-Induced Cavitation in a Cryogenic Environment", speaker: "Arjun Garva, Research Scholar, IIT Kharagpur", type: "oral", abs: "OP06", sim: "transfer_line" },
      { time: "16:55–17:05", title: "A Hybrid Mass Transfer Model for Direct Contact Condensation on Structured and Unstructured Meshes: Towards Cryogenic Applications", speaker: "Jishad K., Research Scholar, IIST", type: "oral", abs: "OP02" },
      { time: "17:05–17:15", title: "Transient CFD Investigation of Regenerator Thermal Non-Equilibrium in a Free-Piston Stirling Cryocooler", speaker: "Dr. Kishore Singh Patel, NIT Rourkela", type: "oral", abs: "OP03", sim: "cryocooler" },
      { time: "17:15–17:25", title: "Novel Magnetoresistive Heat Switch for Ultralow Temperature Refrigeration in Quantum Technologies: A Thermomagnetic Analysis", speaker: "Dr. B. Kiran Naik, NIT Rourkela", type: "oral", abs: "OP04", sim: "adr" },
      { time: "17:25–17:35", title: "Development of a Fast-Response, High-Sensitivity, Transistor-Based Temperature Sensor for Cryogenic Applications", speaker: "Ayush Kori, SVKM's Mithibai College", type: "oral", abs: "OP01" },
      { time: "17:35–18:35", title: "Panel Discussion: Cryogenics for Energy Security and Sustainability – A Way Forward", type: "panel" },
      { time: "19:30–22:30", title: "Gala Dinner", speaker: "Coupons at the registration desk (if mentioned in your registration confirmation mail)", type: "social" },
    ],
  },
  {
    day: "Day 2 — Tue, Nov 10",
    date: "2026-11-10",
    events: [
      { title: "Session 3 | Cryogenic Refrigeration Technology", speaker: "Chair: Prof. Danny Baumann", type: "session" },
      { time: "09:30–10:00", title: "Challenges in Cryogenic and Superconducting Technology in Whole-Body MRI Magnets", speaker: "Dr. Soumen Kar, Scientist-G, Inter-University Accelerator Centre (IUAC)", type: "talk", abs: "SP03", sim: "mri_quench" },
      { time: "10:00–10:30", title: "Adiabatic Demagnetization Refrigerators for Sub-Kelvin Applications", speaker: "Dr. Vivek Singh, Space Applications Centre (SAC), ISRO, Ahmedabad", type: "talk", abs: "SP18", sim: "adr" },
      { time: "10:30–11:00", title: "Cryo- and Vacuum Solutions for Emerging and Sustainable Technologies", speaker: "Dipl.-Ing. Christoph Mühsig, Leybold Dresden GmbH", type: "talk", abs: "SP08", sim: "dewar_insulation" },
      { time: "11:00–11:15", title: "Tea Break", type: "break" },
      { time: "11:15–11:45", title: "Magnetocaloric Hydrogen Liquefaction — From Materials to Prototypes", speaker: "Dr. Tino Gottschall, HZDR Dresden High Magnetic Field Laboratory & Magnotherm Solutions GmbH", type: "talk", abs: "SP11", sim: "magnetocaloric_h2" },
      { time: "11:45–12:15", title: "Investigations on a Novel Pressure Wave Refrigerator Using Three-Stage Cooling", speaker: "Prof. Tapas Kumar Nandi, IIT Kharagpur", type: "talk", abs: "SP09", sim: "cryocooler" },
      { title: "Session 4 | Cryogenic Infrastructure", speaker: "Chair: Dr. Tino Gottschall", type: "session" },
      { time: "12:15–12:45", title: "Cryogenic Instruments for Material Science", speaker: "Prof. Danny Baumann, Research Technology Department, IFW Dresden", type: "talk", abs: "SP07" },
      { time: "12:45–13:45", title: "Lunch Break", type: "break" },
      { time: "13:45–14:15", title: "Developmental Activities for Dry Dilution Refrigerator (DryDR) at VECC, Kolkata", speaker: "Dr. Jedidiah Pradhan, Helium Technology and Low Temperature Section, VECC", type: "talk", abs: "SP06", sim: "dilution_fridge" },
      { time: "14:15–14:45", title: "Contactless Cryogenic Levelmeter Based on Surface Acoustic Wave Sensors", speaker: "Prof. Hagen Schmidt, Institute for Solid State Physics, IFW Dresden", type: "talk", abs: "SP15" },
      { title: "Session 5 | Storage and Distribution of Cryogenic Fluids", speaker: "Chair: Prof. Christoph Haberstroh", type: "session" },
      { time: "14:45–15:15", title: "Earth to Orbit: Cryogenic Production, Storage and Distribution", speaker: "Dr. Jegesh David, Scientist G, Group Director, IPRC, ISRO", type: "talk", abs: "SP02", sim: "rocket_expansion" },
      { time: "15:15–15:45", title: "LH2 Container Logistics — Demand-Driven LH2 Supply for Future Applications", speaker: "Prof. Hans Weber, IFW Dresden", type: "talk", abs: "SP16", sim: "hydrogen_storage" },
      { time: "15:45–17:00", title: "Poster and Tea Session", type: "poster" },
      { time: "17:00–17:30", title: "Hydrogen Storage by Cryosorption", speaker: "Prof. Indranil Ghosh, IIT Kharagpur", type: "talk", abs: "SP23", sim: "cryosorption" },
      { time: "17:30–18:00", title: "Emerging Cryogenic Technologies for Clean Energy: Carbon Capture, Energy Recovery and Liquid Cryogenic Fuel Storage", speaker: "Dr. Pavitra Sandilya, IIT Kharagpur", type: "talk", abs: "SP04", sim: "carbon_capture" },
    ],
  },
  {
    day: "Day 3 — Wed, Nov 11",
    date: "2026-11-11",
    events: [
      { title: "Session 6 | Applied Superconductivity", speaker: "Chair: Prof. Anindya Chakraborty", type: "session" },
      { time: "10:00–10:30", title: "Superconductivity and Cryogenics for High Energy Particle Accelerators: Present Trend", speaker: "Prof. Tripti Sekhar Datta, former Visiting Professor, IIT Kharagpur; former Head, Cryogenics and Superconductivity Programme, IUAC Delhi", type: "talk", abs: "SP19", sim: "superfluid_fountain" },
      { time: "10:30–11:00", title: "Levitated Bearings Based on HTS Materials in Cryogenic Pumps: Potential and Challenges", speaker: "Dr. Paul Saß, ScIDre Scientific Instruments Dresden GmbH", type: "talk", abs: "SP14", sim: "superconductor" },
      { time: "11:00–11:30", title: "Superconducting Technology for Power Applications: An Overview of Research at the Applied Superconductivity Lab", speaker: "Dr. Abhay Singh Gour, IIT Kharagpur", type: "talk", abs: "SP12", sim: "superconducting_cable" },
      { time: "11:30–11:45", title: "Tea Break", type: "break" },
      { time: "11:45–12:15", title: "Industry Presentations by Linde and IHVP", type: "industry", sim: "air_separation" },
      { time: "12:15–12:45", title: "Prize Distribution and Closing Remarks", type: "ceremony" },
      { time: "12:45–13:15", title: "Certificate Distribution by Volunteers", type: "ceremony" },
      { time: "13:30–14:30", title: "Lunch", type: "break" },
    ],
  },
];

// Poster session: Day 2, 15:45–17:00. OP05 is in the booklet but has no slot in the printed programme.
export const POSTER_DAY = 1; // index into SCHEDULE
export const POSTERS = [
  { abs: "PP01", title: "Rare-Earth RGa2 Intermetallics as Promising Materials for Complex Magnetism & Ultra-Low-Temperature Magnetic Refrigeration", who: "Sanat Kumar Adhikari", sim: "adr" },
  { abs: "PP02", title: "A Real-Fluid Simulation Framework for Cryogenic Propulsion: Cooling-Channel Heat Transfer of Methane, Hydrogen and Oxygen", who: "Bidesh Sengupta", sim: "regenerative_cooling" },
  { abs: "PP03", title: "Compressible Helium Flow and Thermodynamic Irreversibility Analysis in a Joule–Thomson Micro-Orifice Valve", who: "Soumya Ranjan Mohanty", sim: "joule_thomson" },
  { abs: "PP04", title: "Nested Nb3Sn Superconducting Magnet for Ultralow Temperature Refrigeration in Quantum Technologies: A Numerical Analysis", who: "Gautam Ranjan", sim: "adr" },
  { abs: "PP05", title: "Sensitivity-Based Parametric Optimization of a Moving-Magnet Pressure Wave Generator for Lightweight Space Cryocoolers", who: "Sidhartha Banerjee", sim: "cryocooler" },
  { abs: "PP06", title: "Atomization and Combustion Performance of Porous Injectors in Liquid Rocket Engines", who: "Dandu Yashaswini Yadav", sim: "rocket_expansion" },
  { abs: "PP07", title: "Enhanced Dielectric Properties of Pb-Free BCT–BZT Ceramics Synthesized by the Solid-State Reaction Route", who: "Ram Kumar" },
  { abs: "PP08", title: "CO2 Capture and Comparison of Liquefaction Systems for Efficient and Sustainable Carbon Management", who: "Amit Kumar Srivastava", sim: "carbon_capture" },
  { abs: "PP09", title: "Miniaturized Cryogenic Thermal Management: Prospects, Constraints, and Emerging Frontiers in Compact Electronic and Scientific Systems", who: "Jinshid P", sim: "cryocooler" },
  { abs: "PP10", title: "Integrating Raman Spectroscopy with Cryogenic Engineering for Sustainable Analytical Platforms", who: "Subhasis Basu" },
  { abs: "PP11", title: "Rayleigh–Taylor and Parametric Instabilities in Three-Component Bose–Einstein Condensate", who: "Susovan Giri", sim: "superfluid_fountain" },
  { abs: "PP12", title: "Cryogenic Technologies for Sustainable Energy Systems: A Review of Advances, Challenges and Future Prospects", who: "Subhankar Ghosh" },
  { abs: "PP13", title: "Surface-Phase Superconductivity in a Mg-Deficient V-Doped MgTi2O4 Spinel", who: "Priyanka Maji", sim: "superconductor" },
  { abs: "PP14", title: "Heat Exchanger Characterization for Active Magnetic Regenerative Refrigeration in Hydrogen Liquefaction", who: "Aakash Chakrabarty", sim: "magnetocaloric_h2" },
  { abs: "PP15", title: "A Conceptual Study on a New Technique of Liquid Methane Sub-cooling for Launch Vehicles", who: "Debanjan", sim: "rocket_expansion" },
  { abs: "PP16", title: "Thermometry at Low Temperatures up to 10 K: A Review of Secondary Thermometry", who: "Shalini Samasi" },
  { abs: "PP17", title: "Cryogenic Energy Storage for Lunar Nocturnal Survivability: A Comprehensive Literature Analysis and Performance Study of Supercapacitors", who: "Smrti K" },
  { abs: "PP18", title: "Prediction of Boil off Rate of Liquid Cryogen During Storage and Transport", who: "Soumen Bera", sim: "dewar_insulation" },
  { abs: "PP19", title: "Effect of Static and Sloshing Conditions on Boil-Off of Liquid Cryogens", who: "Rohan Kundu", sim: "hydrogen_storage" },
  { abs: "PP20", title: "No Load Characterization of Moving Magnet Linear Synchronous Motor for Pulse Tube Cryocooler Pressure Wave Generator", who: "Ankit Kumar Sinha", sim: "cryocooler" },
  { abs: "PP21", title: "High Voltage Testing of Cold Dielectric Material", who: "Neetu Rashmi Gautam", sim: "superconducting_cable" },
  { abs: "PP22", title: "Mitigation of Screening-Current-Induced Field Inhomogeneity in an Optimized 1 T HTS Magnet for Extremity MRI Using the Current Sweep Reversal Technique", who: "Sumit Kumar Chand", sim: "mri_quench" },
  { abs: "PP23", title: "Nonequilibrium Dynamic Phases Obtained in Driven Vortex Lattices in Superconducting Periodic Pinning Landscapes", who: "Ninad Jadkar", sim: "superconductor" },
  { abs: "PP24", title: "On the Edge of Polar Order: Quantum Paraelectricity for Spin-Tunable Dielectrics and Cryogenic Electrocaloric Cooling", who: "Archit Banerjee", sim: "adr" },
  { abs: "PP25", title: "Integrating LNG Cold Energy with CO2 Capture for a Sustainable Energy Future", who: "Kaviliga N S R Anurag", sim: "carbon_capture" },
  { abs: "PP26", title: "Numerical Modeling of Various Components of Superconducting Heat Switch for ADR Applications", who: "Ashutosh Sharma", sim: "adr" },
  { abs: "PP27", title: "Process Intensification of Desublimation-Based Cryogenic Carbon Capture Using a Cryogenically Cooled Cyclone Separator", who: "Emel V Kurian", sim: "carbon_capture" },
  { abs: "PP28", title: "Feasibility Study and Design of Viscous Traction Driven Turbine for Cryogenic Liquefaction", who: "Sauvik Sayan Bandyopadhyay", sim: "claude_collins" },
  { abs: "PP29", title: "Research Studies on Packed Bed Cryogenic Energy Recovery", who: "Bharat Surya Chamarthi", sim: "lng_supply_chain" },
  { abs: "OP05", title: "Optimal Utilization of Cold Energy from LNG Regasification Systems", who: "Parag K. Muley", sim: "lng_supply_chain", note: "Oral abstract in the booklet; no slot in the printed programme" },
];

/** Every talk, oral and poster that links to a simulation, with where to find it in the programme. */
export function conferenceItemsForSim(simId) {
  const out = [];
  SCHEDULE.forEach((d, dayIdx) =>
    d.events.forEach((ev, evIdx) => {
      if (ev.sim === simId) out.push({ ...ev, dayIdx, evIdx, dayLabel: d.day });
    })
  );
  POSTERS.forEach((p) => {
    if (p.sim === simId) out.push({ ...p, type: "poster-item", dayIdx: POSTER_DAY, time: "15:45–17:00", speaker: p.who, dayLabel: SCHEDULE[POSTER_DAY].day });
  });
  return out;
}
