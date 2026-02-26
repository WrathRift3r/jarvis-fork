import React from "react";
import { HealthPanel } from "../components/command/HealthPanel";
import { ObservationFeed } from "../components/command/ObservationFeed";
import { SystemStats } from "../components/command/SystemStats";

export default function CommandPage() {
  return (
    <div style={{ padding: "24px", overflow: "auto", height: "100%" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "20px",
            fontWeight: 600,
            color: "var(--j-text)",
            margin: 0,
          }}
        >
          Command Center
        </h1>
        <div style={{ fontSize: "13px", color: "var(--j-text-muted)", marginTop: "4px" }}>
          System health, performance, and activity monitoring
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        {/* Left column: Health + Observations */}
        <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: "16px" }}>
          <HealthPanel />
          <ObservationFeed />
        </div>

        {/* Right column: System stats */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
          <SystemStats />
        </div>
      </div>
    </div>
  );
}
