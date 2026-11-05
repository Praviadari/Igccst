import { useState, useRef, useEffect } from "react";
import { T, TECH_FONT, MONO_FONT, haptics } from "../utils";

export function AIInsight({ buildPrompt, color = T.accent }) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [mlMode, setMlMode] = useState("analysis");
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getFinalPrompt = () => {
    const basePrompt = buildPrompt();
    const mlSuffix = {
      analysis: "",
      ml_predict: "\n\nADDITIONAL ML REQUEST: Based on the parameters above, describe what a trained neural network (ANN/GP) would predict for performance at ±20% parameter variations. What training data would be needed? Suggest a suitable ML architecture for this cryogenics prediction task.",
      optimization: "\n\nADDITIONAL OPTIMIZATION REQUEST: Formulate this as a multi-objective optimization problem. Define the objective functions (maximize efficiency, minimize energy consumption), constraints, and suggest a suitable optimizer (genetic algorithm, Bayesian optimization, or PSO). What is the Pareto front trade-off?",
      sensitivity: "\n\nADDITIONAL SENSITIVITY REQUEST: Perform a Sobol sensitivity analysis interpretation. Which input parameter has the highest first-order sensitivity index for the primary output? Which parameter interactions are most significant? How would you design a DOE for this cryogenic system?",
    };
    return basePrompt + mlSuffix[mlMode];
  };

  const copyPrompt = (prompt) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(prompt).catch(() => {});
    }
    setCopied(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setCopied(false), 8000);
  };

  const askAI = (url) => {
    haptics.medium();
    const prompt = getFinalPrompt();
    copyPrompt(prompt);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const buttonStyle = {
    flex: 1,
    padding: "11px 0",
    borderRadius: 12,
    border: `1px solid ${color}40`,
    background: `linear-gradient(135deg, ${color}18, ${color}08)`,
    color,
    fontFamily: TECH_FONT,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 2,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "all 0.2s",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    boxShadow: `0 0 20px ${color}15`,
  };

  const chatGptStyle = {
    ...buttonStyle,
    border: `1px solid ${T.green}40`,
    background: `linear-gradient(135deg, ${T.green}18, ${T.green}08)`,
    color: T.green,
    boxShadow: `0 0 20px ${T.green}15`,
  };

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
        {[
          { id: "analysis", label: "Expert Analysis" },
          { id: "ml_predict", label: "ML Prediction" },
          { id: "optimization", label: "Optimization" },
          { id: "sensitivity", label: "Sensitivity" },
        ].map(m => (
          <button key={m.id} onClick={() => setMlMode(m.id)}
            style={{
              padding: "4px 8px", borderRadius: 12, border: `1px solid ${mlMode === m.id ? color : T.glassBorder}`,
              background: mlMode === m.id ? `${color}20` : "transparent",
              color: mlMode === m.id ? color : T.dimText,
              fontSize: 8, fontFamily: TECH_FONT, fontWeight: 600, cursor: "pointer",
            }}
          >{m.label}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => askAI("https://gemini.google.com/app")}
          style={buttonStyle}
          onTouchStart={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
          onTouchEnd={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          ✦ ASK GEMINI AI
        </button>

        <button
          type="button"
          onClick={() => askAI("https://chatgpt.com")}
          style={chatGptStyle}
          onTouchStart={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
          onTouchEnd={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          ✦ ASK CHATGPT
        </button>
      </div>

      <button
        type="button"
        onClick={() => setShowPreview((prev) => !prev)}
        style={{
          width: "100%",
          marginTop: 10,
          padding: "9px 0",
          borderRadius: 12,
          border: `1px solid ${T.dimText}20`,
          background: T.glass,
          color: T.dimText,
          fontFamily: TECH_FONT,
          fontSize: 11,
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
          touchAction: "manipulation",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {showPreview ? "Hide Prompt Preview" : "Preview Prompt"}
      </button>

      {showPreview && (
        <pre
          style={{
            marginTop: 10,
            padding: 12,
            borderRadius: 12,
            background: T.glass,
            fontFamily: MONO_FONT,
            fontSize: 10,
            color: T.dimText,
            lineHeight: 1.4,
            maxHeight: 120,
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            border: `1px solid ${T.dimText}10`,
          }}
        >
          {getFinalPrompt()}
        </pre>
      )}

      {copied && (
        <ol
          style={{
            marginTop: 8,
            paddingLeft: 18,
            fontSize: 10,
            color: T.dimText,
            lineHeight: 1.4,
          }}
        >
          <li>Switch to the AI tab that just opened.</li>
          <li>Paste your prompt (Ctrl+V or ⌘+V).</li>
          <li>Read the expert analysis.</li>
        </ol>
      )}
    </div>
  );
}
