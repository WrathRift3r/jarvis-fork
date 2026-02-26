import React from "react";
import { useApiData } from "../../hooks/useApi";

type Config = {
  llm: {
    primary: string;
    fallback: string[];
    anthropic: { model?: string } | null;
    openai: { model?: string } | null;
    ollama: { base_url?: string; model?: string } | null;
  };
};

export function LLMPanel() {
  const { data: config, loading } = useApiData<Config>("/api/config", []);

  if (loading || !config) {
    return <div style={cardStyle}><span style={{ color: "var(--j-text-muted)", fontSize: "13px" }}>Loading...</span></div>;
  }

  const providers = [
    { name: "Anthropic", data: config.llm.anthropic, key: "anthropic" },
    { name: "OpenAI", data: config.llm.openai, key: "openai" },
    { name: "Ollama", data: config.llm.ollama, key: "ollama" },
  ];

  return (
    <div style={cardStyle}>
      <h3 style={headerStyle}>LLM Configuration</h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Primary */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
          <span style={{ color: "var(--j-text-dim)" }}>Primary Provider</span>
          <span style={{ color: "var(--j-accent)", fontWeight: 600, textTransform: "capitalize" }}>
            {config.llm.primary}
          </span>
        </div>

        {/* Fallback chain */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
          <span style={{ color: "var(--j-text-dim)" }}>Fallback Chain</span>
          <span style={{ color: "var(--j-text)" }}>
            {config.llm.fallback.join(" \u2192 ")}
          </span>
        </div>

        {/* Providers */}
        <div style={{ borderTop: "1px solid var(--j-border)", paddingTop: "12px", marginTop: "4px" }}>
          <div style={labelStyle}>Providers</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {providers.map((p) => (
              <div
                key={p.key}
                style={{
                  padding: "8px 12px",
                  background: "var(--j-bg)",
                  border: "1px solid var(--j-border)",
                  borderRadius: "6px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "13px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: p.data ? "var(--j-success)" : "var(--j-text-muted)",
                      display: "inline-block",
                    }}
                  />
                  <span style={{ color: "var(--j-text)", fontWeight: 500 }}>{p.name}</span>
                  {p.key === config.llm.primary && (
                    <span style={{ fontSize: "10px", color: "var(--j-accent)", fontWeight: 600 }}>PRIMARY</span>
                  )}
                </div>
                <span style={{ color: "var(--j-text-muted)", fontSize: "12px" }}>
                  {p.data ? ((p.data as any).model ?? "default") : "not configured"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  padding: "20px",
  background: "var(--j-surface)",
  border: "1px solid var(--j-border)",
  borderRadius: "8px",
};

const headerStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "var(--j-text)",
  marginBottom: "16px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--j-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: "8px",
};
