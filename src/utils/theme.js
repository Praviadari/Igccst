// ═══════════════════════════════════════
// THEME — Single source of truth for colors
// ═══════════════════════════════════════

export const THEMES = {
  dark: {
    bg: "#040B16",
    card: "rgba(20, 34, 64, 0.6)",
    cardAlt: "rgba(26, 45, 74, 0.7)",
    glass: "rgba(255, 255, 255, 0.03)",
    glassBorder: "rgba(255, 255, 255, 0.08)",
    accent: "#4CC9F0",
    accentDark: "#4361EE",
    orange: "#FF6B35",
    gold: "#F8961E",
    white: "#F8F9FA",
    gray: "#94A3B8",
    dimText: "#475569",
    green: "#4DFFB8",
    red: "#FF4D6D",
    purple: "#7209B7",
    pink: "#F72585",
    lime: "#B5E48C",
    cyan: "#4CC9F0",
  },
  light: {
    bg: "#F8FAFF",
    card: "rgba(255, 255, 255, 0.72)",
    cardAlt: "rgba(245, 248, 255, 0.78)",
    glass: "rgba(15, 23, 42, 0.08)",
    glassBorder: "rgba(15, 23, 42, 0.12)",
    accent: "#2563EB",
    accentDark: "#1D4ED8",
    orange: "#EA580C",
    gold: "#C27803",
    white: "#0F172A",
    gray: "#475569",
    dimText: "#64748B",
    green: "#047857",
    red: "#991B1B",
    purple: "#5B21B6",
    pink: "#BE185D",
    lime: "#16A34A",
    cyan: "#0EA5E9",
  },
};

export function getCurrentThemeKey() {
  if (typeof window === "undefined" || typeof document === "undefined") return "dark";
  return document.body.dataset.theme === "light" ? "light" : "dark";
}

export function getCanvasTheme(themeKey = getCurrentThemeKey()) {
  if (themeKey === "light") {
    return {
      bgStart: "rgba(247, 250, 255, 1)",
      bgEnd: "rgba(226, 232, 240, 0.95)",
      canvasBackground: "rgba(247, 250, 255, 1)",
      canvasSurface: "rgba(226, 232, 240, 0.95)",
      panelFill: "rgba(255, 255, 255, 0.95)",
      panelStroke: "rgba(148, 163, 184, 0.18)",
      detail: "rgba(15, 23, 42, 0.12)",
    };
  }
  return {
    bgStart: "#0d1b2a",
    bgEnd: "#050b14",
    canvasBackground: "#0d1b2a",
    canvasSurface: "#050b14",
    panelFill: "rgba(13, 27, 42, 0.95)",
    panelStroke: "rgba(255, 255, 255, 0.08)",
    detail: "rgba(255, 255, 255, 0.1)",
  };
}

export const T = new Proxy(
  {},
  {
    get(_, prop) {
      const theme = THEMES[getCurrentThemeKey()];
      return theme[prop];
    },
  },
);

export const FONT = "'Outfit', sans-serif";
export const TECH_FONT = "'Orbitron', sans-serif";
export const MONO_FONT = "'JetBrains Mono', monospace";
