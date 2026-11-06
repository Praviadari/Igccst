import { useRef, useEffect } from "react";
import { T, TECH_FONT, MONO_FONT, haptics, sound } from "../utils";
import { SIM_REGISTRY } from "../sims";

export const Pill = ({ active, onClick, children, color = T.accent, label }) => (
  <button
    type="button"
    onClick={(e) => {
      haptics.light();
      sound.click();
      onClick && onClick(e);
    }}
    aria-label={label ?? (typeof children === "string" ? children : undefined)}
    aria-pressed={active}
    style={{
      padding: "7px 13px",
      borderRadius: 24,
      border: active ? `2px solid ${color}` : `1px solid ${T.glassBorder}`,
      background: active ? `${color}20` : T.glass,
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      color: active ? color : T.gray,
      fontFamily: TECH_FONT,
      fontSize: 10,
      fontWeight: active ? 700 : 500,
      cursor: "pointer",
      transition: "all .2s cubic-bezier(0.4, 0, 0.2, 1)",
      whiteSpace: "nowrap",
      letterSpacing: "0.5px",
      textTransform: "uppercase",
      boxShadow: active ? `0 0 15px ${color}30` : "none",
      WebkitTapHighlightColor: "transparent",
      minHeight: 44,
      touchAction: "manipulation",
    }}
    onTouchStart={(e) => {
      e.currentTarget.style.opacity = "0.7";
    }}
    onTouchEnd={(e) => {
      e.currentTarget.style.opacity = "1";
    }}
  >
    {children}
  </button>
);

export const Slider = ({ label, value, onChange, min, max, step = 1, unit = "", color = T.accent }) => {
  const id = `slider-${label.replace(/\s+/g, "-").toLowerCase()}`;
  const position = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <label htmlFor={id} style={{ color: T.gray, fontSize: 11, fontWeight: 500 }}>
          {label}
        </label>
        <span style={{ color, fontSize: 13, fontWeight: 800, fontFamily: MONO_FONT }} aria-live="polite">
          {typeof value === "number" ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}
          <span style={{ fontSize: 10, opacity: 0.8, marginLeft: 2 }}>{unit}</span>
        </span>
      </div>
      <div style={{ position: "relative", height: 16, display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div style={{
          position: "absolute",
          top: -12,
          left: `${position}%`,
          transform: "translateX(-50%)",
          fontSize: 9,
          fontFamily: MONO_FONT,
          color: color,
          pointerEvents: "none",
          fontWeight: 700,
          padding: "2px 6px",
          background: `${color}30`,
          borderRadius: 4,
          opacity: 0.9,
          textAlign: "center",
          minWidth: 28,
        }}>
          {typeof value === "number" ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}
        </div>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={`${label}: ${value}${unit}`}
          onChange={(e) => {
            haptics.light();
            sound.click();
            onChange(Number(e.target.value));
          }}
          style={{
            width: "100%",
            accentColor: color,
            height: 8,
            cursor: "pointer",
            background: T.glass,
            border: `1px solid ${T.glassBorder}`,
            borderRadius: 4,
            touchAction: "pan-x",
          }}
        />
      </div>
    </div>
  );
};

export const DataBox = ({ label, value, unit, color = T.accent }) => (
  <div
    style={{
      background: `linear-gradient(135deg, ${color}15, ${color}05)`,
      border: `1px solid ${color}30`,
      borderRadius: 12,
      padding: "10px 12px",
      textAlign: "center",
      minWidth: 78,
      flex: "1 1 78px",
      backdropFilter: "blur(4px)",
      WebkitBackdropFilter: "blur(4px)",
      transition: "transform 0.2s",
    }}
  >
    <div style={{ fontSize: 19, fontWeight: 900, color, fontFamily: MONO_FONT, letterSpacing: "-0.5px" }}>{value}</div>
    <div
      style={{
        fontSize: 9,
        color: T.gray,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginTop: 2,
      }}
    >
      {label}
      {unit && <span style={{ opacity: 0.6, marginLeft: 2 }}>[{unit}]</span>}
    </div>
  </div>
);

export const InfoBox = ({ color = T.accent, children }) => (
  <div
    style={{
      marginTop: 15,
      padding: "12px 16px",
      background: T.glass,
      borderRadius: 12,
      borderLeft: `3px solid ${color}`,
      borderTop: `1px solid ${T.glassBorder}`,
      borderRight: `1px solid ${T.glassBorder}`,
      borderBottom: `1px solid ${T.glassBorder}`,
      fontSize: 12,
      color: T.gray,
      lineHeight: 1.65,
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
    }}
  >
    {children}
  </div>
);

export const PillRow = ({ children }) => (
  <div
    style={{
      display: "flex",
      gap: 8,
      margin: "12px 0",
      flexWrap: "wrap",
      overflowX: "auto",
      paddingBottom: 4,
      scrollbarWidth: "none",
    }}
  >
    {children}
  </div>
);

export const DataRow = ({ children }) => (
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "14px 0" }}>{children}</div>
);

export const StripChart = ({ data = [], color = T.accent, label = "", height = 50, maxVal = 100 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || data.length === 0) return;
    const ctx = c.getContext("2d");
    const W = c.width,
      H = c.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = T.glass;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = `${T.glassBorder}`;
    ctx.lineWidth = 0.5;
    for (let y = 0; y <= 4; y += 1) {
      const yy = (y / 4) * H;
      ctx.beginPath();
      ctx.moveTo(0, yy);
      ctx.lineTo(W, yy);
      ctx.stroke();
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const max = maxVal || Math.max(...data, 1);
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - (v / max) * (H - 4) - 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.font = `700 8px 'Orbitron', sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.fillText(label, 4, 10);
  }, [data, color, label, maxVal]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={height}
      style={{
        width: "100%",
        height,
        borderRadius: 8,
        border: `1px solid ${T.glassBorder}`,
        marginTop: 8,
      }}
    />
  );
};

export const ExportBtn = ({ getData, simId, color = T.accent }) => {
  const handleExport = () => {
    haptics.medium();
    const data = getData();
    const json = JSON.stringify({ simId, timestamp: new Date().toISOString(), params: data }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `igccst_${simId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        border: `1px solid ${color}30`,
        background: `${color}10`,
        color: color,
        fontFamily: TECH_FONT,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 1,
        cursor: "pointer",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      ⬇ EXPORT JSON
    </button>
  );
};

export const ActionBtn = ({ onClick, disabled, color, children, label }) => (
  <button
    type="button"
    onClick={(e) => {
      haptics.heavy();
      onClick && onClick(e);
    }}
    disabled={disabled}
    aria-label={label ?? (typeof children === "string" ? children : undefined)}
    aria-disabled={disabled}
    style={{
      flex: 1,
      padding: "13px 0",
      borderRadius: 12,
      border: "none",
      background: disabled ? T.dimText : `linear-gradient(135deg, ${color}, ${T.pink})`,
      color: T.white,
      fontFamily: TECH_FONT,
      fontSize: 13,
      fontWeight: 800,
      cursor: disabled ? "not-allowed" : "pointer",
      letterSpacing: 2,
      textTransform: "uppercase",
      boxShadow: disabled ? "none" : `0 4px 15px ${color}40`,
      transition: "all 0.15s",
      touchAction: "manipulation",
      WebkitTapHighlightColor: "transparent",
      minHeight: 48,
    }}
    onTouchStart={(e) => {
      if (!disabled) e.currentTarget.style.transform = "scale(0.97)";
    }}
    onTouchEnd={(e) => {
      e.currentTarget.style.transform = "scale(1)";
    }}
    onMouseDown={(e) => {
      if (!disabled) e.currentTarget.style.transform = "scale(0.97)";
    }}
    onMouseUp={(e) => {
      e.currentTarget.style.transform = "scale(1)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "scale(1)";
    }}
  >
    {children}
  </button>
);

export const ResetBtn = ({ onClick }) => (
  <button
    type="button"
    onClick={(e) => {
      haptics.medium();
      onClick && onClick(e);
    }}
    aria-label="Reset simulation"
    style={{
      padding: "13px 16px",
      borderRadius: 12,
      border: `1px solid ${T.glassBorder}`,
      background: T.glass,
      color: T.gray,
      cursor: "pointer",
      fontSize: 11,
      fontFamily: TECH_FONT,
      fontWeight: 600,
      letterSpacing: 1,
      transition: "all 0.15s",
      touchAction: "manipulation",
      WebkitTapHighlightColor: "transparent",
      minHeight: 48,
    }}
    onTouchStart={(e) => {
      e.currentTarget.style.opacity = "0.6";
    }}
    onTouchEnd={(e) => {
      e.currentTarget.style.opacity = "1";
    }}
    onMouseDown={(e) => {
      e.currentTarget.style.opacity = "0.7";
    }}
    onMouseUp={(e) => {
      e.currentTarget.style.opacity = "1";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.opacity = "1";
    }}
  >
    RESET
  </button>
);

export const SimCanvas = ({ canvasRef, width, height, maxWidth, label = "Simulation visualization" }) => (
  <div
    role="img"
    aria-label={label}
    style={{
      position: "relative",
      margin: "0 auto 14px",
      width,
      maxWidth: maxWidth ?? width,
      minHeight: height,
      display: "grid",
      placeItems: "center",
    }}
  >
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width,
        height,
        background: "radial-gradient(circle at center, var(--sim-bg-from), var(--card))",
        borderRadius: 12,
        border: "1px solid var(--glass-border)",
        display: "block",
        boxShadow: "inset 0 0 40px rgba(0,0,0,0.15), 0 10px 30px rgba(0,0,0,0.16)",
        touchAction: "none",
      }}
    />
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        borderRadius: 12,
        boxShadow: "inset 0 0 20px rgba(var(--accent-rgb), 0.12)",
        border: "1px solid rgba(var(--accent-rgb), 0.16)",
        animation: "radarPulse 4s infinite ease-in-out",
      }}
    />
  </div>
);

export const RelatedSims = ({ currentId, onNavigate }) => {
  const current = SIM_REGISTRY.find(s => s.id === currentId);
  if (!current?.related) return null;
  const related = current.related.map(id => SIM_REGISTRY.find(s => s.id === id)).filter(Boolean);

  return (
    <div style={{ marginTop: 12, paddingTop: 8, borderTop: `1px solid ${T.glassBorder}` }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: T.dimText, fontFamily: TECH_FONT, marginBottom: 6 }}>
        RELATED SIMULATIONS
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
        {related.map(s => (
          <button key={s.id} onClick={() => onNavigate(s.id)}
            style={{
              padding: "6px 10px", borderRadius: 8, border: `1px solid ${s.color}30`,
              background: `${s.color}10`, color: s.color,
              fontSize: 9, fontFamily: TECH_FONT, fontWeight: 600, cursor: "pointer",
            }}
          >{s.icon} {s.label}</button>
        ))}
      </div>
    </div>
  );
};

export const ChallengeBox = ({ title = "Inquiry Challenge", goal, isCompleted, hint, color = T.gold }) => {
  useEffect(() => {
    if (isCompleted) {
      sound.chime();
      haptics.success();
    }
  }, [isCompleted]);

  return (
    <div
      style={{
        margin: "12px 0",
        padding: "10px 12px",
        borderRadius: 10,
        background: isCompleted ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.08)",
        border: `1px solid ${isCompleted ? T.green : color}40`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 13 }}>{isCompleted ? "🏆" : "🎯"}</span>
          <span style={{ fontFamily: TECH_FONT, fontSize: 10, fontWeight: 800, color: isCompleted ? T.green : color, letterSpacing: 1 }}>
            {title.toUpperCase()}
          </span>
        </div>
        <div style={{ fontSize: 10, color: T.white, fontWeight: 500 }}>
          {goal}
        </div>
        {hint && !isCompleted && (
          <div style={{ fontSize: 8.5, color: T.gray, marginTop: 2 }}>
            💡 Hint: {hint}
          </div>
        )}
      </div>
      <div>
        <span
          style={{
            padding: "4px 8px",
            borderRadius: 6,
            background: isCompleted ? `${T.green}25` : `${color}15`,
            color: isCompleted ? T.green : color,
            border: `1px solid ${isCompleted ? T.green : color}50`,
            fontFamily: TECH_FONT,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: 0.5,
            whiteSpace: "nowrap",
          }}
        >
          {isCompleted ? "✓ ACHIEVED" : "IN PROGRESS"}
        </span>
      </div>
    </div>
  );
};

export const SimControls = ({ isPlaying = true, onTogglePlay, speed = 1, onToggleSpeed, onReset, color = T.accent }) => (
  <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "center", margin: "8px 0 12px", flexWrap: "wrap" }}>
    {onTogglePlay && (
      <button
        onClick={() => { sound.click(); onTogglePlay(); }}
        style={{
          padding: "5px 12px",
          borderRadius: 8,
          border: `1px solid ${isPlaying ? color : T.red}40`,
          background: isPlaying ? `${color}18` : `${T.red}18`,
          color: isPlaying ? color : T.red,
          fontSize: 9,
          fontFamily: TECH_FONT,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {isPlaying ? "⏸ PAUSE" : "▶ PLAY"}
      </button>
    )}
    {onToggleSpeed && (
      <button
        onClick={() => { sound.click(); onToggleSpeed(); }}
        style={{
          padding: "5px 10px",
          borderRadius: 8,
          border: `1px solid ${T.glassBorder}`,
          background: T.glass,
          color: speed === 1 ? T.gray : T.cyan,
          fontSize: 9,
          fontFamily: TECH_FONT,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        ⏱ {speed}x SPEED
      </button>
    )}
    {onReset && (
      <button
        onClick={() => { sound.click(); onReset(); }}
        style={{
          padding: "5px 10px",
          borderRadius: 8,
          border: `1px solid ${T.glassBorder}`,
          background: T.glass,
          color: T.gray,
          fontSize: 9,
          fontFamily: TECH_FONT,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        🔄 RESET
      </button>
    )}
  </div>
);
