import React from "react";
import type { ToolCall } from "../../hooks/useWebSocket";

type Props = {
  toolCall: ToolCall;
};

export function ToolCallBadge({ toolCall }: Props) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 8px",
        borderRadius: "4px",
        background: "rgba(245, 158, 11, 0.15)",
        border: "1px solid rgba(245, 158, 11, 0.3)",
        color: "var(--j-warning)",
        fontSize: "11px",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontWeight: 500,
      }}
    >
      <span style={{ fontSize: "10px" }}>&#9881;</span>
      {toolCall.name}
    </span>
  );
}
