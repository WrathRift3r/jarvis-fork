import React, { useState, useCallback, useEffect } from "react";
import { api } from "../hooks/useApi";
import { MemorySearchBar } from "../components/memory/MemorySearchBar";
import { MemoryGrid } from "../components/memory/MemoryGrid";
import type { MemoryProfile } from "../components/memory/MemoryDocumentCard";

const ENTITY_TYPES = ["all", "person", "project", "tool", "place", "concept", "event"] as const;

const TYPE_COLORS: Record<string, string> = {
  person: "#a78bfa",
  project: "#60a5fa",
  tool: "#34d399",
  place: "#fbbf24",
  concept: "#f472b6",
  event: "#00d4ff",
};

export default function MemoryPage() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [profiles, setProfiles] = useState<MemoryProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMemories = useCallback(async (q: string, type: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (type !== "all") params.set("type", type);
      params.set("limit", "100");
      const data = await api<MemoryProfile[]>(
        `/api/vault/search?${params.toString()}`
      );
      setProfiles(data);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchMemories(query, typeFilter);
  }, [query, typeFilter, fetchMemories]);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 24px 0",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--j-text)",
              }}
            >
              Memory
            </h1>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "12px",
                color: "var(--j-text-muted)",
              }}
            >
              {profiles.length} {profiles.length === 1 ? "entity" : "entities"}{" "}
              in JARVIS knowledge graph
            </p>
          </div>
        </div>

        {/* Search */}
        <MemorySearchBar onSearch={handleSearch} />

        {/* Type filter chips */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {ENTITY_TYPES.map((type) => {
            const isActive = typeFilter === type;
            const color =
              type === "all" ? "var(--j-accent)" : TYPE_COLORS[type] || "var(--j-text-muted)";
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "14px",
                  border: `1px solid ${isActive ? color : "var(--j-border)"}`,
                  background: isActive ? `${color}18` : "transparent",
                  color: isActive ? color : "var(--j-text-dim)",
                  fontSize: "11px",
                  fontWeight: isActive ? 600 : 400,
                  cursor: "pointer",
                  textTransform: "capitalize",
                  transition: "all 0.15s",
                }}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "16px 24px 24px",
        }}
      >
        <MemoryGrid
          profiles={profiles}
          searchQuery={query}
          loading={loading}
        />
      </div>
    </div>
  );
}
