import { useState, useEffect, useRef, Suspense } from "react";
import { THEMES, T, FONT, TECH_FONT, MONO_FONT, sound } from "./utils";
import { SIM_REGISTRY, CATEGORIES } from "./sims";
import { Pill, ErrorBoundary, RelatedSims, SchedulePanel, CryoDatabasePanel } from "./components";
import { conferenceItemsForSim } from "./data/conference";
import "./styles/global.css";

// Label/icon/colour of every sim, handed to the schedule (it cannot import the registry: circular import)
const SIM_META = Object.fromEntries(SIM_REGISTRY.map((s) => [s.id, { label: s.label, icon: s.icon, color: s.color }]));

/* Skeleton loader for lazy-loaded simulations */
function SimSkeleton({ color }) {
  const fallback = color || THEMES.dark.accent;

  return (
    <div
      style={{
        padding: "40px 20px",
        textAlign: "center",
        borderRadius: 14,
        background: `${fallback}08`,
        border: `1px solid ${fallback}20`,
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    >
      <div
        style={{
          fontFamily: TECH_FONT,
          fontSize: 11,
          fontWeight: 800,
          color: fallback,
          letterSpacing: 2,
          opacity: 0.6,
        }}
      >
        LOADING CRYOGENIC SIMULATION...
      </div>
    </div>
  );
}

export default function App() {
  const [activeSim, setActiveSim] = useState(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const match = hash.match(/sim=([a-z0-9_]+)/);
      if (match && SIM_REGISTRY.some((s) => s.id === match[1])) {
        return match[1];
      }
    }
    return "absolute_zero"; // Start with the fun, intuitive basics!
  });

  const [catFilter, setCatFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("sims"); // "sims" | "database" | "schedule"
  const [scheduleFocus, setScheduleFocus] = useState(null); // talk/poster to highlight when jumping from a sim

  // Open a sim from the schedule or database tab and bring it into view
  const openSimFromTab = (simId) => {
    const match = SIM_REGISTRY.find((s) => s.id === simId);
    if (match) setActiveSim(match.id);
    setActiveTab("sims");
    setTimeout(() => document.getElementById("active-sim")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  // Jump from a sim to its talk/poster in the programme
  const showInSchedule = (item) => {
    setScheduleFocus({ dayIdx: item.dayIdx, evIdx: item.evIdx, abs: item.abs, poster: item.type === "poster-item", nonce: Date.now() });
    setActiveTab("schedule");
  };
  const [kioskMode, setKioskMode] = useState(false);
  const [autoSimIndex, setAutoSimIndex] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const [favorites, setFavorites] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem("igccst_favs") || "[]");
    } catch {
      return [];
    }
  });

  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    const saved = window.localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const currentTheme = THEMES[theme];
  const [compareMode, setCompareMode] = useState(false);
  const [isMuted, setIsMuted] = useState(() => sound.isMuted());

  const toggleSound = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) sound.click();
  };

  // Sync hash to URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.hash = `sim=${activeSim}&tab=${activeTab}`;
    }
  }, [activeSim, activeTab]);

  useEffect(() => {
    document.body.dataset.theme = theme;
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem("igccst_favs", JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  useEffect(() => {
    setCompareMode(false);
  }, [activeSim]);

  // Toggle favorite
  const toggleFavorite = (id) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  // Kiosk Auto-Cycle
  useEffect(() => {
    if (!kioskMode) return;
    const allSims = SIM_REGISTRY.map((s) => s.id);
    const interval = setInterval(() => {
      setAutoSimIndex((prev) => {
        const next = (prev + 1) % allSims.length;
        setActiveSim(allSims[next]);
        setActiveTab("sims");
        return next;
      });
    }, 14000);
    return () => clearInterval(interval);
  }, [kioskMode]);

  useEffect(() => {
    if (!kioskMode) return;
    const pause = () => setKioskMode(false);
    window.addEventListener("touchstart", pause, { once: true });
    window.addEventListener("click", pause, { once: true });
    return () => {
      window.removeEventListener("touchstart", pause);
      window.removeEventListener("click", pause);
    };
  }, [kioskMode]);

  useEffect(() => {
    if (sessionStorage.getItem("igccst_splash_seen")) setShowSplash(false);
  }, []);

  const dismissSplash = () => {
    setShowSplash(false);
    sessionStorage.setItem("igccst_splash_seen", "1");
  };

  // Keyboard navigation: Left/Right arrows cycle simulations, D toggles database, S toggles schedule
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight") {
        const idx = SIM_REGISTRY.findIndex((s) => s.id === activeSim);
        if (idx < SIM_REGISTRY.length - 1) setActiveSim(SIM_REGISTRY[idx + 1].id);
      } else if (e.key === "ArrowLeft") {
        const idx = SIM_REGISTRY.findIndex((s) => s.id === activeSim);
        if (idx > 0) setActiveSim(SIM_REGISTRY[idx - 1].id);
      } else if (e.key === "d" || e.key === "D") {
        setActiveTab((prev) => (prev === "database" ? "sims" : "database"));
      } else if (e.key === "s" || e.key === "S") {
        setActiveTab((prev) => (prev === "schedule" ? "sims" : "schedule"));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeSim]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  // Filtering: Category + Search + Favorites
  const filtered = SIM_REGISTRY.filter((s) => {
    if (catFilter === "favorites") {
      if (!favorites.includes(s.id)) return false;
    } else if (catFilter !== "all" && s.cat !== catFilter) {
      return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.label.toLowerCase().includes(q) || s.tags.some((t) => t.toLowerCase().includes(q));
  });

  const activeIndex = SIM_REGISTRY.findIndex((s) => s.id === activeSim);
  const active = SIM_REGISTRY[activeIndex] || SIM_REGISTRY[0];
  const ActiveComp = active?.comp;

  const navigateSim = (delta) => {
    const nextIdx = (activeIndex + delta + SIM_REGISTRY.length) % SIM_REGISTRY.length;
    setActiveSim(SIM_REGISTRY[nextIdx].id);
    document.getElementById("active-sim")?.scrollIntoView({ behavior: "smooth" });
  };

  // Fullscreen / Exhibition Mode
  const [exhibition, setExhibition] = useState(false);
  const wakeLockRef = useRef(null);

  const toggleExhibition = async () => {
    try {
      if (!exhibition) {
        if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
        if ("wakeLock" in navigator) wakeLockRef.current = await navigator.wakeLock.request("screen");
        setExhibition(true);
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        if (wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        }
        setExhibition(false);
      }
    } catch (err) {
      console.warn("Exhibition mode requires user gesture.", err);
    }
  };

  const appBgStart = theme === "dark" ? "#040b16" : currentTheme.cardAlt;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at 50% 0%, ${appBgStart} 0%, ${currentTheme.bg} 100%)`,
        color: currentTheme.white,
        fontFamily: FONT,
        padding: "14px 10px 48px",
        maxWidth: 820,
        margin: "0 auto",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Decorative ambient background glows */}
      <div
        style={{
          position: "fixed",
          top: "-10%",
          left: "-10%",
          width: "45%",
          height: "45%",
          background: `${currentTheme.accent}08`,
          filter: "blur(100px)",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "10%",
          right: "-10%",
          width: "35%",
          height: "35%",
          background: `${currentTheme.cyan}06`,
          filter: "blur(80px)",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Header */}
      <header style={{ textAlign: "center", marginBottom: 16, paddingTop: 4, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end", marginBottom: 8 }}>
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              background: currentTheme.glass,
              border: `1px solid ${currentTheme.glassBorder}`,
              color: currentTheme.accent,
              padding: "5px 10px",
              borderRadius: 8,
              fontFamily: TECH_FONT,
              fontSize: 8,
              fontWeight: 800,
              cursor: "pointer",
              letterSpacing: 1,
            }}
          >
            {theme === "dark" ? "☀️ LIGHT" : "🌙 DARK"}
          </button>

          <button
            type="button"
            onClick={toggleSound}
            style={{
              background: isMuted ? currentTheme.glass : `${currentTheme.cyan}20`,
              border: `1px solid ${isMuted ? currentTheme.glassBorder : currentTheme.cyan}`,
              color: isMuted ? currentTheme.gray : currentTheme.cyan,
              padding: "5px 10px",
              borderRadius: 8,
              fontFamily: TECH_FONT,
              fontSize: 8,
              fontWeight: 800,
              cursor: "pointer",
              letterSpacing: 1,
            }}
            title={isMuted ? "Unmute simulation audio" : "Mute simulation audio"}
          >
            {isMuted ? "🔇 SOUND" : "🔊 SOUND"}
          </button>

          <button
            onClick={() => setKioskMode((prev) => !prev)}
            style={{
              padding: "5px 10px",
              borderRadius: 8,
              border: `1px solid ${currentTheme.glassBorder}`,
              background: kioskMode ? `${currentTheme.green}20` : currentTheme.glass,
              color: kioskMode ? currentTheme.green : currentTheme.gray,
              fontFamily: TECH_FONT,
              fontSize: 8,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {kioskMode ? "🟢 KIOSK ON" : "📺 KIOSK"}
          </button>

          {ActiveComp && (
            <button
              type="button"
              onClick={() => setCompareMode((prev) => !prev)}
              style={{
                padding: "5px 10px",
                borderRadius: 8,
                border: `1px solid ${currentTheme.glassBorder}`,
                background: compareMode ? `${currentTheme.accent}20` : currentTheme.glass,
                color: compareMode ? currentTheme.accent : currentTheme.gray,
                fontFamily: TECH_FONT,
                fontSize: 8,
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: 1,
              }}
            >
              {compareMode ? "✕ SINGLE" : "⇄ COMPARE"}
            </button>
          )}

          <button
            type="button"
            onClick={toggleExhibition}
            style={{
              background: exhibition ? `${currentTheme.red}20` : currentTheme.glass,
              border: `1px solid ${exhibition ? currentTheme.red : currentTheme.glassBorder}`,
              color: exhibition ? currentTheme.red : currentTheme.gray,
              padding: "5px 10px",
              borderRadius: 8,
              fontFamily: TECH_FONT,
              fontSize: 8,
              fontWeight: 800,
              cursor: "pointer",
              letterSpacing: 1,
            }}
          >
            {exhibition ? "EXIT FULL" : "⛶ FULLSCREEN"}
          </button>
        </div>

        {/* Conference Branding */}
        <div
          style={{
            fontSize: "clamp(8px, 2.3vw, 10px)",
            color: currentTheme.accent,
            letterSpacing: 2.2,
            fontWeight: 800,
            textTransform: "uppercase",
            textShadow: `0 0 10px ${currentTheme.accent}30`,
          }}
        >
          IGCCST 2026 • INDO-GERMAN CONFERENCE ON CRYOGENICS
        </div>

        <div
          style={{
            fontSize: "clamp(19px, 5.2vw, 30px)",
            fontWeight: 900,
            color: "transparent",
            fontFamily: TECH_FONT,
            letterSpacing: 1.5,
            marginTop: 4,
            background: `linear-gradient(to bottom, ${currentTheme.white}, ${currentTheme.cyan})`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          CRYOGENICS SIMULATION HUB
        </div>

        <div
          style={{
            width: 50,
            height: 3,
            background: `linear-gradient(90deg, ${currentTheme.cyan}, ${currentTheme.accent})`,
            margin: "8px auto 0",
            borderRadius: 2,
            boxShadow: `0 0 10px ${currentTheme.cyan}40`,
          }}
        />

        <div
          style={{
            fontSize: "clamp(8px, 2vw, 10px)",
            color: currentTheme.dimText,
            marginTop: 6,
            fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          IIT KHARAGPUR • GARGI AUDITORIUM • NOVEMBER 09 – 11, 2026
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 14,
          borderBottom: `1px solid ${currentTheme.glassBorder}`,
          position: "relative",
          zIndex: 1,
        }}
      >
        {[
          { id: "sims", label: `⚡ SIMULATIONS (${SIM_REGISTRY.length})` },
          { id: "database", label: "📚 CRYO DATABASE" },
          { id: "schedule", label: "📅 LIVE SCHEDULE" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              background: "transparent",
              borderBottom: activeTab === tab.id ? `2px solid ${currentTheme.accent}` : "2px solid transparent",
              color: activeTab === tab.id ? currentTheme.accent : currentTheme.gray,
              fontFamily: TECH_FONT,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.2,
              cursor: "pointer",
              transition: "color 0.2s, border-bottom-color 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cryo Database Tab */}
      {activeTab === "database" && (
        <div
          style={{
            background: currentTheme.card,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 18,
            padding: "16px 14px",
            border: `1px solid ${currentTheme.glassBorder}`,
            boxShadow: "0 15px 30px rgba(0,0,0,0.3)",
            position: "relative",
            zIndex: 1,
            marginBottom: 20,
          }}
        >
          <CryoDatabasePanel
            onOpenSim={(simId) => {
              openSimFromTab(simId);
              setActiveTab("sims");
            }}
          />
        </div>
      )}

      {/* Live Schedule Tab */}
      {activeTab === "schedule" && (
        <div
          style={{
            background: currentTheme.card,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 18,
            padding: "16px 14px",
            border: `1px solid ${currentTheme.glassBorder}`,
            boxShadow: "0 15px 30px rgba(0,0,0,0.3)",
            position: "relative",
            zIndex: 1,
            marginBottom: 20,
          }}
        >
          <SchedulePanel onOpenSim={openSimFromTab} simMeta={SIM_META} focus={scheduleFocus} />
        </div>
      )}

      {/* Simulations Tab Content */}
      {activeTab === "sims" && (
        <>
          {/* Search bar & Live Filter */}
          <div style={{ marginBottom: 12, position: "relative", zIndex: 1 }}>
            <input
              type="text"
              placeholder="🔍 Search simulations, keywords (e.g. hydrogen, rocket, qubit, leak)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 12,
                background: currentTheme.glass,
                border: `1px solid ${currentTheme.glassBorder}`,
                color: currentTheme.white,
                fontSize: 11,
                fontFamily: FONT,
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = currentTheme.accent)}
              onBlur={(e) => (e.target.style.borderColor = currentTheme.glassBorder)}
            />
          </div>

          {/* Category Filter Pills */}
          <nav
            aria-label="Filter simulations by track"
            className="no-scrollbar"
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 14,
              overflowX: "auto",
              paddingBottom: 4,
              position: "relative",
              zIndex: 1,
            }}
          >
            {CATEGORIES.map((c) => (
              <Pill key={c.id} active={catFilter === c.id} onClick={() => setCatFilter(c.id)} color={c.color}>
                {c.label}
              </Pill>
            ))}
            {favorites.length > 0 && (
              <Pill active={catFilter === "favorites"} onClick={() => setCatFilter("favorites")} color={T.gold}>
                ⭐ Favorites ({favorites.length})
              </Pill>
            )}
          </nav>

          {/* Grid of Simulation Icons */}
          <div
            role="list"
            aria-label="Available cryogenic simulations"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(115px, 1fr))",
              gap: 10,
              marginBottom: 18,
              position: "relative",
              zIndex: 1,
            }}
          >
            {filtered.map((s) => (
              <button
                type="button"
                role="listitem"
                aria-current={activeSim === s.id ? "true" : undefined}
                key={s.id}
                onClick={() => {
                  setActiveSim(s.id);
                  document.getElementById("active-sim")?.scrollIntoView({ behavior: "smooth" });
                }}
                style={{
                  padding: "10px",
                  borderRadius: 14,
                  border: activeSim === s.id ? `2px solid ${s.color}` : `1px solid ${currentTheme.glassBorder}`,
                  background: activeSim === s.id ? `${s.color}18` : currentTheme.glass,
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  color: activeSim === s.id ? s.color : currentTheme.white,
                  fontFamily: TECH_FONT,
                  fontSize: "clamp(9px, 2.5vw, 11px)",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all .2s cubic-bezier(0.4, 0, 0.2, 1)",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  boxShadow: activeSim === s.id ? `0 6px 18px ${s.color}25` : "0 2px 8px rgba(0,0,0,0.15)",
                  transform: activeSim === s.id ? "scale(1.02)" : "scale(1)",
                  minHeight: 64,
                  position: "relative",
                }}
              >
                {favorites.includes(s.id) && (
                  <span style={{ position: "absolute", top: 4, right: 6, fontSize: 8 }}>⭐</span>
                )}
                <div
                  style={{
                    fontSize: 22,
                    marginBottom: 2,
                    filter: activeSim === s.id ? `drop-shadow(0 0 8px ${s.color}60)` : "grayscale(0.4)",
                    transition: "all .2s",
                  }}
                >
                  {s.icon}
                </div>
                <div style={{ lineHeight: 1.2, fontSize: "clamp(9px, 2.5vw, 11px)" }}>{s.label}</div>
              </button>
            ))}
          </div>

          {/* Active Simulation Panel */}
          {ActiveComp && (
            <div
              id="active-sim"
              style={{
                background: currentTheme.card,
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderRadius: 18,
                padding: "16px 12px",
                border: `1px solid ${currentTheme.accent}25`,
                boxShadow: `0 15px 35px rgba(0,0,0,0.35), inset 0 0 20px ${currentTheme.accent}05`,
                position: "relative",
                zIndex: 1,
                width: "100%",
              }}
            >
              {/* Header with Navigation & Favorite Toggle */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: `1px solid ${active.color}25`,
                  paddingBottom: 10,
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 28, filter: `drop-shadow(0 0 10px ${active.color}80)` }}>{active.icon}</span>
                  <div>
                    <div style={{ fontSize: 8, color: active.color, letterSpacing: 2, fontWeight: 800, fontFamily: TECH_FONT }}>
                      SIMULATION {activeIndex + 1} OF {SIM_REGISTRY.length}
                    </div>
                    <div style={{ fontSize: "clamp(13px, 3.5vw, 17px)", fontWeight: 900, color: currentTheme.white, fontFamily: TECH_FONT }}>
                      {active.label}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button
                    onClick={() => toggleFavorite(active.id)}
                    style={{
                      background: favorites.includes(active.id) ? `${T.gold}20` : currentTheme.glass,
                      border: `1px solid ${favorites.includes(active.id) ? T.gold : currentTheme.glassBorder}`,
                      color: favorites.includes(active.id) ? T.gold : currentTheme.gray,
                      padding: "6px 10px",
                      borderRadius: 8,
                      fontSize: 10,
                      cursor: "pointer",
                    }}
                    title="Bookmark this simulation"
                  >
                    {favorites.includes(active.id) ? "★ SAVED" : "☆ SAVE"}
                  </button>

                  <button
                    onClick={() => navigateSim(-1)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: `1px solid ${currentTheme.glassBorder}`,
                      background: currentTheme.glass,
                      color: currentTheme.white,
                      fontFamily: TECH_FONT,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                    title="Previous Simulation (Left Arrow)"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => navigateSim(1)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: `1px solid ${currentTheme.glassBorder}`,
                      background: currentTheme.glass,
                      color: currentTheme.white,
                      fontFamily: TECH_FONT,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                    title="Next Simulation (Right Arrow)"
                  >
                    ▶
                  </button>
                </div>
              </div>

              {/* Simulation Component */}
              <ErrorBoundary color={active.color}>
                <Suspense fallback={<SimSkeleton color={active.color} />}>
                  {compareMode ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: typeof window !== "undefined" && window.innerWidth < 600 ? "1fr" : "1fr 1fr",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          borderRight:
                            typeof window !== "undefined" && window.innerWidth < 600
                              ? "none"
                              : `1px solid ${currentTheme.glassBorder}`,
                          paddingRight: 8,
                        }}
                      >
                        <div style={{ fontSize: 9, color: currentTheme.accent, fontFamily: TECH_FONT, marginBottom: 6, textAlign: "center" }}>
                          CONFIG A
                        </div>
                        <ActiveComp key={`${activeSim}-a`} />
                      </div>
                      <div style={{ paddingLeft: 8 }}>
                        <div style={{ fontSize: 9, color: currentTheme.green, fontFamily: TECH_FONT, marginBottom: 6, textAlign: "center" }}>
                          CONFIG B
                        </div>
                        <ActiveComp key={`${activeSim}-b`} />
                      </div>
                    </div>
                  ) : (
                    <ActiveComp />
                  )}
                </Suspense>
              </ErrorBoundary>

              {/* Bottom Quick Navigation & Related Sims */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, paddingTop: 10, borderTop: `1px solid ${currentTheme.glassBorder}` }}>
                <button
                  onClick={() => navigateSim(-1)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: `1px solid ${currentTheme.glassBorder}`,
                    background: currentTheme.glass,
                    color: currentTheme.gray,
                    fontFamily: TECH_FONT,
                    fontSize: 9,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ◀ PREV SIM
                </button>

                <button
                  onClick={() => navigateSim(1)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: `1px solid ${currentTheme.accent}40`,
                    background: `${currentTheme.accent}15`,
                    color: currentTheme.accent,
                    fontFamily: TECH_FONT,
                    fontSize: 9,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  NEXT SIM ▶
                </button>
              </div>

              {/* At IGCCST 2026: talks and posters on this topic, each a jump into the schedule */}
              {(() => {
                const items = conferenceItemsForSim(activeSim);
                if (!items.length) return null;
                return (
                  <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 12, border: `1px solid ${T.gold}40`, background: `${T.gold}0d` }}>
                    <div style={{ fontFamily: TECH_FONT, fontSize: 9, fontWeight: 800, color: T.gold, letterSpacing: 1.5, marginBottom: 8 }}>
                      📅 AT IGCCST 2026 — {items.length} {items.length === 1 ? "TALK / POSTER" : "TALKS & POSTERS"} ON THIS TOPIC
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {items.map((it, k) => (
                        <button
                          key={k}
                          onClick={() => showInSchedule(it)}
                          style={{
                            textAlign: "left", padding: "7px 9px", borderRadius: 8, cursor: "pointer",
                            border: `1px solid ${currentTheme.glassBorder}`, background: currentTheme.glass, color: currentTheme.white,
                          }}
                          title="Show in the conference schedule"
                        >
                          <div style={{ fontSize: 8, fontFamily: MONO_FONT, color: T.gold }}>
                            {it.dayLabel} · {it.time} · {it.type === "poster-item" ? "POSTER" : it.type === "oral" ? "ORAL" : it.type === "industry" ? "INDUSTRY" : "INVITED"}
                            {it.abs ? ` · ${it.abs}` : ""}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 700, marginTop: 1 }}>{it.title}</div>
                          {it.speaker && <div style={{ fontSize: 9, color: currentTheme.gray }}>{it.speaker}</div>}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {activeSim && (
                <RelatedSims
                  currentId={activeSim}
                  onNavigate={(id) => {
                    setActiveSim(id);
                    document.getElementById("active-sim")?.scrollIntoView({ behavior: "smooth" });
                  }}
                />
              )}
            </div>
          )}

          {/* Topic Tags */}
          {active && (
            <div
              style={{
                marginTop: 10,
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                position: "relative",
                zIndex: 1,
              }}
            >
              {active.tags.map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: "clamp(8px, 2vw, 10px)",
                    padding: "4px 10px",
                    borderRadius: 20,
                    background: `${active.color}12`,
                    color: active.color,
                    border: `1px solid ${active.color}28`,
                    fontFamily: TECH_FONT,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* About IGCCST 2026 */}
          <div
            style={{
              marginTop: 36,
              padding: "22px 16px",
              borderRadius: 16,
              background: `linear-gradient(135deg, ${currentTheme.card}, ${currentTheme.bg})`,
              border: `1px solid ${currentTheme.glassBorder}`,
              position: "relative",
              zIndex: 1,
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: currentTheme.accent,
                fontFamily: TECH_FONT,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 2,
                marginBottom: 6,
              }}
            >
              ABOUT THE CONFERENCE
            </div>
            <div style={{ color: currentTheme.white, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
              Indo-German Conference on Cryogenics for Sustainable Technologies
            </div>
            <p
              style={{
                color: currentTheme.gray,
                fontSize: 12,
                lineHeight: 1.6,
                maxWidth: 620,
                margin: "0 auto",
                marginBottom: 16,
              }}
            >
              IGCCST 2026 convenes global experts from academia, research institutions, and industry to foster scientific
              collaboration between India and Germany. Hosted at the <strong>Cryogenic Engineering Centre, IIT Kharagpur</strong>,
              the conference features cutting-edge tracks in <strong>Cryogenic Systems</strong> (liquefaction cycles, cryocoolers),{" "}
              <strong>Infrastructure</strong> (storage vessels, transfer lines, vacuum insulations), <strong>Clean Energy</strong>{" "}
              (liquid hydrogen, LNG regasification), and <strong>Quantum Technologies</strong> (superconductivity and dilution refrigeration).
            </p>
            <a
              href="https://igccst2026.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "8px 18px",
                borderRadius: 20,
                background: `${currentTheme.accent}15`,
                border: `1px solid ${currentTheme.accent}40`,
                color: currentTheme.accent,
                fontFamily: TECH_FONT,
                fontSize: 10,
                fontWeight: 700,
                textDecoration: "none",
                letterSpacing: 1,
              }}
            >
              VISIT OFFICIAL CONFERENCE WEBSITE →
            </a>
          </div>

          {/* Footer */}
          <footer
            style={{
              textAlign: "center",
              marginTop: 28,
              fontSize: "clamp(8px, 2.2vw, 10px)",
              color: currentTheme.dimText,
              lineHeight: 1.9,
              position: "relative",
              zIndex: 1,
            }}
          >
            <div
              style={{
                background: `linear-gradient(90deg, transparent, ${currentTheme.dimText}40, transparent)`,
                height: 1,
                width: "100%",
                marginBottom: 14,
              }}
            />
            INTERACTIVE CRYOGENICS SIMULATOR • IGCCST 2026
            <br />
            <strong style={{ color: currentTheme.gray }}>NOVEMBER 09 – 11, 2026</strong> • GARGI AUDITORIUM, IIT KHARAGPUR
            <br />
            HOSTED AT:{" "}
            <a
              href="https://igccst.adaripraveen.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: currentTheme.cyan, textDecoration: "none", fontWeight: 700 }}
            >
              IGCCST.ADARIPRAVEEN.COM
            </a>
          </footer>
        </>
      )}

      {/* Kiosk Mode Banner */}
      {kioskMode && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "8px 0",
            background: `linear-gradient(transparent, ${currentTheme.bg})`,
            textAlign: "center",
            zIndex: 100,
          }}
        >
          <div style={{ fontSize: 11, color: currentTheme.accent, fontFamily: TECH_FONT, fontWeight: 700 }}>
            ❄️ IGCCST 2026 CRYOGENICS HUB — Touch anywhere to interact
          </div>
          <div style={{ fontSize: 8, color: currentTheme.dimText }}>
            {autoSimIndex + 1}/{SIM_REGISTRY.length} simulations • Auto-cycling in exhibit mode
          </div>
        </div>
      )}

      {/* Splash Modal */}
      {showSplash && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(10px)",
            padding: 16,
          }}
          onClick={dismissSplash}
        >
          <div
            style={{
              maxWidth: 380,
              padding: 24,
              borderRadius: 18,
              background: currentTheme.card,
              border: `1px solid ${currentTheme.glassBorder}`,
              textAlign: "center",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 34, marginBottom: 8 }}>❄️</div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: currentTheme.accent,
                fontFamily: TECH_FONT,
                letterSpacing: 2,
                marginBottom: 4,
              }}
            >
              IGCCST 2026
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: currentTheme.white,
                fontFamily: TECH_FONT,
                marginBottom: 12,
              }}
            >
              CRYOGENICS SIMULATION HUB
            </div>
            <div
              style={{
                fontSize: 11,
                color: currentTheme.gray,
                lineHeight: 1.6,
                marginBottom: 16,
              }}
            >
              Welcome to the interactive simulation portal for the{" "}
              <strong>Indo-German Conference on Cryogenics for Sustainable Technologies</strong>. Explore real-time physics models
              covering gas liquefaction, cryocoolers, liquid hydrogen storage, LNG regasification, quantum cooling, and everyday cryogenic phenomena.
              <br />
              <br />
              <strong style={{ color: currentTheme.accent }}>{SIM_REGISTRY.length} Interactive Simulations</strong> •
              <strong style={{ color: currentTheme.cyan }}> Reference Database</strong> •
              <strong style={{ color: currentTheme.gold }}> Live Schedule</strong>
            </div>

            <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
              {["Cryo 101", "Liquefaction", "Liquid H2", "LNG", "Superconductivity", "Quantum mK"].map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "3px 8px",
                    borderRadius: 8,
                    fontSize: 8,
                    background: `${currentTheme.accent}15`,
                    color: currentTheme.accent,
                    fontFamily: TECH_FONT,
                    fontWeight: 600,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <button
              onClick={dismissSplash}
              style={{
                padding: "11px 28px",
                borderRadius: 12,
                border: "none",
                background: currentTheme.accent,
                color: "#000",
                fontFamily: TECH_FONT,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 2,
                cursor: "pointer",
              }}
            >
              ENTER HUB →
            </button>
            <div style={{ fontSize: 8, color: currentTheme.dimText, marginTop: 10 }}>
              IIT Kharagpur, India • November 09 – 11, 2026
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
