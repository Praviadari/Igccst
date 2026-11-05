import { useState, useEffect, useRef, Suspense } from "react";
import { THEMES, FONT, TECH_FONT } from "./utils";
import { SIM_REGISTRY, CATEGORIES } from "./sims";
import { Pill, ErrorBoundary, RelatedSims, SchedulePanel, CryoDatabasePanel } from "./components";
import "./styles/global.css";

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
  const [activeSim, setActiveSim] = useState("linde_hampson");
  const [catFilter, setCatFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("sims"); // "sims" | "database" | "schedule"
  const [kioskMode, setKioskMode] = useState(false);
  const [autoSimIndex, setAutoSimIndex] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    const saved = window.localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const currentTheme = THEMES[theme];
  const [compareMode, setCompareMode] = useState(false);

  const catCounts = SIM_REGISTRY.reduce((acc, s) => {
    acc[s.cat] = (acc[s.cat] || 0) + 1;
    return acc;
  }, {});

  useEffect(() => {
    document.body.dataset.theme = theme;
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    setCompareMode(false);
  }, [activeSim]);

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
    }, 15000);
    return () => clearInterval(interval);
  }, [kioskMode]);

  useEffect(() => {
    if (!kioskMode) return;
    const pause = () => {
      setKioskMode(false);
    };
    window.addEventListener("touchstart", pause, { once: true });
    window.addEventListener("click", pause, { once: true });
    return () => {
      window.removeEventListener("touchstart", pause);
      window.removeEventListener("click", pause);
    };
  }, [kioskMode]);

  useEffect(() => {
    if (kioskMode) return;
    let timer = setTimeout(() => setKioskMode(true), 90000);
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setKioskMode(true), 90000);
    };
    window.addEventListener("touchstart", reset);
    window.addEventListener("mousemove", reset);
    window.addEventListener("click", reset);
    window.addEventListener("keydown", reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("touchstart", reset);
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("click", reset);
      window.removeEventListener("keydown", reset);
    };
  }, [kioskMode]);

  useEffect(() => {
    if (sessionStorage.getItem("igccst_splash_seen")) setShowSplash(false);
  }, []);

  const dismissSplash = () => {
    setShowSplash(false);
    sessionStorage.setItem("igccst_splash_seen", "1");
  };

  // Keyboard shortcut: D toggles database, S toggles schedule
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "d" || e.key === "D") setActiveTab((prev) => (prev === "database" ? "sims" : "database"));
      if (e.key === "s" || e.key === "S") setActiveTab((prev) => (prev === "schedule" ? "sims" : "schedule"));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const filtered = catFilter === "all" ? SIM_REGISTRY : SIM_REGISTRY.filter((s) => s.cat === catFilter);

  const active = SIM_REGISTRY.find((s) => s.id === activeSim);
  const ActiveComp = active?.comp;

  // Swipe gestures
  const [touchStart, setTouchStart] = useState(null);
  const onTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const onTouchEnd = (e) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const dir = touchStart - touchEnd;
    if (Math.abs(dir) > 50) {
      const idx = filtered.findIndex((s) => s.id === activeSim);
      if (dir > 0 && idx < filtered.length - 1) setActiveSim(filtered[idx + 1].id);
      if (dir < 0 && idx > 0) setActiveSim(filtered[idx - 1].id);
    }
    setTouchStart(null);
  };

  // Exhibition Mode (Fullscreen + Wake Lock)
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
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at 50% 0%, ${appBgStart} 0%, ${currentTheme.bg} 100%)`,
        color: currentTheme.white,
        fontFamily: FONT,
        padding: "14px 10px 48px",
        maxWidth: "100%",
        margin: "0 auto",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Decorative blobs */}
      <div
        style={{
          position: "fixed",
          top: "-10%",
          left: "-10%",
          width: "40%",
          height: "40%",
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
          width: "30%",
          height: "30%",
          background: `${currentTheme.cyan}05`,
          filter: "blur(80px)",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Header */}
      <header style={{ textAlign: "center", marginBottom: 18, paddingTop: 6, position: "relative", zIndex: 1 }}>
        <div style={{ position: "absolute", top: 0, right: 0, display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
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
            {theme === "dark" ? "LIGHT" : "DARK"}
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
            {exhibition ? "EXIT FULL" : "FULLSCREEN"}
          </button>
        </div>

        <div
          style={{
            fontSize: "clamp(8px, 2.4vw, 11px)",
            color: currentTheme.accent,
            letterSpacing: 2.5,
            fontWeight: 800,
            textTransform: "uppercase",
            textShadow: `0 0 10px ${currentTheme.accent}30`,
          }}
        >
          IGCCST 2026 • INDO-GERMAN CONFERENCE ON CRYOGENICS
        </div>

        <div
          style={{
            fontSize: "clamp(18px, 5vw, 28px)",
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
            fontWeight: 500,
            letterSpacing: 0.5,
          }}
        >
          IIT KHARAGPUR • GARGI AUDITORIUM • NOVEMBER 09 – 11, 2026
        </div>
      </header>

      {/* Tab bar */}
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
          { id: "sims", label: "⚡ SIMULATIONS" },
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
              letterSpacing: 1.5,
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
              const match = SIM_REGISTRY.find((s) => s.id === simId);
              if (match) setActiveSim(match.id);
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
          <SchedulePanel />
        </div>
      )}

      {/* Simulations Tab Content */}
      {activeTab === "sims" && (
        <>
          {/* Category filter */}
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
          </nav>

          {/* Sim grid */}
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
                onClick={() => setActiveSim(s.id)}
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
                  transition: "all .25s cubic-bezier(0.4, 0, 0.2, 1)",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  boxShadow: activeSim === s.id ? `0 6px 18px ${s.color}25` : "0 2px 8px rgba(0,0,0,0.15)",
                  transform: activeSim === s.id ? "scale(1.03)" : "scale(1)",
                  minHeight: 64,
                }}
              >
                <div
                  style={{
                    fontSize: 22,
                    marginBottom: 2,
                    filter: activeSim === s.id ? `drop-shadow(0 0 8px ${s.color}60)` : "grayscale(0.4)",
                    transition: "all .25s",
                  }}
                >
                  {s.icon}
                </div>
                <div style={{ lineHeight: 1.2, fontSize: "clamp(9px, 2.5vw, 11px)" }}>{s.label}</div>
              </button>
            ))}
          </div>

          {/* Counts */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
              padding: "6px 0",
              marginBottom: 12,
              borderTop: `1px solid ${currentTheme.glassBorder}`,
            }}
          >
            <span style={{ fontSize: 9, color: currentTheme.accent, fontFamily: TECH_FONT, fontWeight: 700 }}>
              {SIM_REGISTRY.length} CRYOGENIC SIMULATIONS
            </span>
            {Object.entries(catCounts).map(([cat, count]) => (
              <span key={cat} style={{ fontSize: 8, color: currentTheme.dimText, fontFamily: TECH_FONT }}>
                {cat.toUpperCase()}: {count}
              </span>
            ))}
          </div>

          {/* Active simulation panel */}
          {ActiveComp && (
            <div
              id="active-sim"
              style={{
                background: currentTheme.card,
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderRadius: 18,
                padding: "14px 10px",
                border: `1px solid ${currentTheme.accent}20`,
                boxShadow: `0 15px 30px rgba(0,0,0,0.3), inset 0 0 20px ${currentTheme.accent}05`,
                position: "relative",
                zIndex: 1,
                width: "100%",
              }}
            >
              {/* Panel header */}
              <div
                style={{
                  fontSize: "clamp(13px, 3.5vw, 17px)",
                  fontWeight: 900,
                  color: currentTheme.white,
                  fontFamily: TECH_FONT,
                  marginBottom: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  borderBottom: `1px solid ${active.color}20`,
                  paddingBottom: 10,
                }}
              >
                <span style={{ fontSize: 26, filter: `drop-shadow(0 0 10px ${active.color}80)` }}>{active.icon}</span>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "clamp(8px, 2vw, 10px)", color: active.color, letterSpacing: 2, fontWeight: 800 }}>
                    ACTIVE SIMULATION
                  </span>
                  {active.label}
                </div>
              </div>

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

          {/* Topic tags */}
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

          {/* About IGCCST 2026 & Organizers */}
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
              collaboration between India and Germany. Hosted at the historic <strong>IIT Kharagpur</strong> campus, the conference
              features three primary thrust areas: <strong>Cryogenic Systems</strong> (gas liquefaction, cryocoolers),{" "}
              <strong>Infrastructure</strong> (storage vessels, transfer lines, boil-off mitigation), and <strong>Clean Energy</strong>{" "}
              (liquid hydrogen, LNG value chain), alongside pioneering tracks in quantum cooling and superconductivity.
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
              VISIT IGCCST2026.COM →
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
                fontFamily: currentTheme.font || "Outfit, sans-serif",
              }}
            >
              Welcome to the interactive simulation portal for the{" "}
              <strong>Indo-German Conference on Cryogenics for Sustainable Technologies</strong>. Explore real-time physics models
              covering gas liquefaction, cryocoolers, liquid hydrogen storage, LNG regasification, and quantum cooling.
              <br />
              <br />
              <strong style={{ color: currentTheme.accent }}>{SIM_REGISTRY.length} Interactive Simulations</strong> •
              <strong style={{ color: currentTheme.cyan }}> Reference Database</strong> •
              <strong style={{ color: currentTheme.gold }}> Live Schedule</strong>
            </div>

            <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
              {["Liquefaction", "Cryocoolers", "Liquid H2", "LNG", "Superconductivity", "Quantum mK"].map((tag) => (
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
