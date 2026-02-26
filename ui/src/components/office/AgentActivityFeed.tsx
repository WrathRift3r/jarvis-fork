import React from "react";

export type ActivityEvent = {
  id: string;
  agentName: string;
  text: string;
  timestamp: number;
};

type Props = {
  events: ActivityEvent[];
};

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function AgentActivityFeed({ events }: Props) {
  if (events.length === 0) {
    return (
      <div
        style={{
          padding: "16px",
          textAlign: "center",
          color: "var(--j-text-muted)",
          fontSize: "12px",
          background: "var(--j-surface)",
          borderRadius: "8px",
          border: "1px solid var(--j-border)",
        }}
      >
        No recent agent activity
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--j-surface)",
        border: "1px solid var(--j-border)",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--j-border)",
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--j-text-dim)",
        }}
      >
        Recent Activity
      </div>
      <div
        style={{
          maxHeight: "200px",
          overflow: "auto",
        }}
      >
        {events.map((event) => (
          <div
            key={event.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "8px 14px",
              borderBottom: "1px solid var(--j-border)",
              fontSize: "12px",
            }}
          >
            <span
              style={{
                color: "var(--j-accent)",
                fontWeight: 600,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {event.agentName}
            </span>
            <span
              style={{
                color: "var(--j-text-dim)",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {event.text}
            </span>
            <span
              style={{
                color: "var(--j-text-muted)",
                fontSize: "10px",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {timeAgo(event.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
