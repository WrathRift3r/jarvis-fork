import React, { useState } from "react";
import { EntityList } from "../components/knowledge/EntityList";
import { EntityDetail } from "../components/knowledge/EntityDetail";

type Entity = {
  id: string;
  type: string;
  name: string;
  properties: Record<string, unknown> | null;
  created_at: number;
  updated_at: number;
  source: string | null;
};

export default function KnowledgePage() {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  return (
    <div style={{ display: "flex", height: "100%" }}>
      {/* Left: Entity list */}
      <div
        style={{
          width: "340px",
          minWidth: "340px",
          borderRight: "1px solid var(--j-border)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid var(--j-border)",
          }}
        >
          <h1
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--j-text)",
              margin: 0,
            }}
          >
            Knowledge Browser
          </h1>
          <div style={{ fontSize: "12px", color: "var(--j-text-muted)", marginTop: "4px" }}>
            Explore JARVIS memory vault
          </div>
        </div>
        <EntityList
          onSelect={setSelectedEntity}
          selectedId={selectedEntity?.id}
        />
      </div>

      {/* Right: Detail view */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {selectedEntity ? (
          <EntityDetail entity={selectedEntity} />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--j-text-muted)",
              fontSize: "14px",
            }}
          >
            Select an entity to view details
          </div>
        )}
      </div>
    </div>
  );
}
