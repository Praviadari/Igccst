import React from "react";
import { T, TECH_FONT } from "../utils/theme";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const color = this.props.color || T.red;
      return (
        <div
          style={{
            padding: "24px 16px",
            textAlign: "center",
            borderRadius: 14,
            background: `${color}08`,
            border: `1px solid ${color}30`,
          }}
        >
          <div
            style={{
              fontSize: 28,
              marginBottom: 10,
              filter: `drop-shadow(0 0 8px ${color}60)`,
            }}
          >
            ⚠
          </div>
          <div
            style={{
              fontFamily: TECH_FONT,
              fontSize: 12,
              fontWeight: 800,
              color,
              letterSpacing: 2,
              marginBottom: 8,
            }}
          >
            SIMULATION ERROR
          </div>
          <div
            style={{
              fontSize: 11,
              color: T.gray,
              lineHeight: 1.5,
              marginBottom: 14,
            }}
          >
            {this.state.error?.message || "An unexpected error occurred."}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: "10px 24px",
              borderRadius: 10,
              border: `1px solid ${color}40`,
              background: `${color}15`,
              color,
              fontFamily: TECH_FONT,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: 1,
              touchAction: "manipulation",
            }}
          >
            ↺ RETRY
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
