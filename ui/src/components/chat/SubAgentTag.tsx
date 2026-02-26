import React from "react";
import type { SubAgentEvent } from "../../hooks/useWebSocket";

type Props = {
  event: SubAgentEvent;
};

export function SubAgentTag({ event }: Props) {
  const color =
    event.type === "done"
      ? "var(--j-success)"
      : event.type === "tool_call"
        ? "var(--j-warning)"
        : "var(--j-accent2)";

  const label =
    event.type === "done"
      ? `${event.agentName} completed`
      : event.type === "tool_call"
        ? `${event.agentName} > ${(event.data as any)?.name ?? "tool"}`
        : event.agentName;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 8px",
        borderRadius: "4px",
        background: `${color}15`,
        border: `1px solid ${color}40`,
        color,
        fontSize: "11px",
        fontWeight: 500,
      }}
    >
      <span style={{ fontSize: "10px" }}>&#9670;</span>
      {label}
    </span>
  );
}
