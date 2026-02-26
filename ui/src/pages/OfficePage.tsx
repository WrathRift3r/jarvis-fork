import React, { useState, useEffect, useCallback } from "react";
import { api } from "../hooks/useApi";
import { AgentDesk } from "../components/office/AgentDesk";
import { AgentActivityFeed } from "../components/office/AgentActivityFeed";
import type { DeskAgent, LiveAgentInfo } from "../components/office/AgentDesk";
import type { ActivityEvent } from "../components/office/AgentActivityFeed";
import type { AgentActivityEvent } from "../hooks/useWebSocket";

/* ---- Static roster arranged into rows (back → front) ---- */

const BACK_ROW: DeskAgent[] = [
  { roleId: "system-administrator", name: "Sys Admin", emoji: "\uD83D\uDDA5\uFE0F", items: ["coffee"] },
  { roleId: "project-coordinator", name: "Coordinator", emoji: "\uD83D\uDCCB", items: ["plant"] },
  { roleId: "hr-specialist", name: "HR", emoji: "\uD83D\uDC65", items: ["plant"] },
  { roleId: "financial-analyst", name: "Finance", emoji: "\uD83D\uDCB0" },
];

const MIDDLE_ROW: DeskAgent[] = [
  { roleId: "data-analyst", name: "Data Analyst", emoji: "\uD83D\uDCCA" },
  { roleId: "content-writer", name: "Writer", emoji: "\u270D\uFE0F", items: ["plant", "coffee"] },
  { roleId: "marketing-strategist", name: "Marketing", emoji: "\uD83D\uDCE2", items: ["coffee"] },
  { roleId: "legal-advisor", name: "Legal", emoji: "\u2696\uFE0F" },
];

const FRONT_ROW: DeskAgent[] = [
  { roleId: "research-analyst", name: "Researcher", emoji: "\uD83D\uDD0D", items: ["plant"] },
  { roleId: "software-engineer", name: "Engineer", emoji: "\uD83D\uDCBB", items: ["coffee"] },
  { roleId: "personal-assistant", name: "PA", emoji: "\uD83E\uDD16", alwaysActive: true, items: ["coffee"] },
  { roleId: "customer-support", name: "Support", emoji: "\uD83C\uDFA7", items: ["coffee"] },
];

const ALL_AGENTS = [...BACK_ROW, ...MIDDLE_ROW, ...FRONT_ROW];

/* ---- Stars for window ---- */
const STARS = [
  { x: 18, y: 18, s: 2 }, { x: 55, y: 32, s: 1.5 }, { x: 95, y: 15, s: 1 },
  { x: 140, y: 42, s: 2 }, { x: 195, y: 22, s: 1.5 }, { x: 42, y: 65, s: 1 },
  { x: 125, y: 55, s: 1.5 }, { x: 175, y: 72, s: 1 }, { x: 245, y: 30, s: 2 },
  { x: 78, y: 80, s: 1 }, { x: 220, y: 60, s: 1.5 }, { x: 160, y: 15, s: 1 },
];

type Props = {
  agentActivity: AgentActivityEvent[];
};

export default function OfficePage({ agentActivity }: Props) {
  const [liveAgents, setLiveAgents] = useState<LiveAgentInfo[]>([]);

  const fetchAgents = useCallback(async () => {
    try {
      const data = await api<LiveAgentInfo[]>("/api/agents");
      setLiveAgents(data);
    } catch {
      /* keep previous */
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 5000);
    return () => clearInterval(interval);
  }, [fetchAgents]);

  function getLive(roleId: string): LiveAgentInfo | null {
    return (
      liveAgents.find(
        (a) =>
          a.role?.id === roleId ||
          a.role?.name?.toLowerCase().replace(/\s+/g, "-") === roleId
      ) ?? null
    );
  }

  const activeCount = ALL_AGENTS.filter(
    (a) => a.alwaysActive || getLive(a.roleId)?.status === "active"
  ).length;

  const feedEvents: ActivityEvent[] = agentActivity
    .filter((e) => e.eventType === "tool_call" || e.eventType === "done")
    .map((e) => ({
      id: e.id,
      agentName: e.agentName,
      text:
        e.eventType === "done"
          ? "completed task"
          : `used tool: ${(e.data as any)?.name ?? "unknown"}`,
      timestamp: e.timestamp,
    }))
    .slice(0, 10);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: "#100d14",
      }}
    >
      {/* ===== Room background ===== */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, #1a1520 0%, #16121e 35%, #110e16 100%)",
        }}
      >
        {/* Window */}
        <div
          style={{
            position: "absolute",
            top: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "280px",
            height: "110px",
            borderRadius: "3px",
            border: "3px solid #2a2535",
            overflow: "hidden",
            background:
              "linear-gradient(180deg, #0a1628 0%, #142040 50%, #1a2848 100%)",
            boxShadow:
              "inset 0 0 30px rgba(20,40,80,0.3), 0 0 40px rgba(20,40,80,0.1)",
          }}
        >
          {/* Moon */}
          <div
            style={{
              position: "absolute",
              top: "14px",
              right: "28px",
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 40% 40%, #f5eedd, #d4c8a8)",
              boxShadow:
                "0 0 15px rgba(245,238,221,0.25), 0 0 40px rgba(245,238,221,0.08)",
            }}
          />
          {/* Stars */}
          {STARS.map((star, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: star.x,
                top: star.y,
                width: star.s,
                height: star.s,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.6)",
                animation: `twinkle ${2.5 + i * 0.3}s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
          {/* Window divider (cross pane) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              width: "2px",
              height: "100%",
              background: "#2a2535",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              width: "100%",
              height: "2px",
              background: "#2a2535",
            }}
          />
          {/* Sill */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              width: "100%",
              height: "6px",
              background: "#2a2535",
            }}
          />
        </div>

        {/* Clock on wall */}
        <div
          style={{
            position: "absolute",
            top: "36px",
            right: "12%",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            border: "2px solid #2a2535",
            background: "#1a1824",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "1px",
              height: "8px",
              background: "rgba(255,255,255,0.3)",
              transformOrigin: "bottom center",
              transform: "rotate(30deg)",
              position: "absolute",
              bottom: "50%",
            }}
          />
          <div
            style={{
              width: "1px",
              height: "6px",
              background: "rgba(0,200,240,0.4)",
              transformOrigin: "bottom center",
              animation: "clock-hand 60s linear infinite",
              position: "absolute",
              bottom: "50%",
            }}
          />
          <div
            style={{
              width: "3px",
              height: "3px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
            }}
          />
        </div>

        {/* Wall shelf decoration (left) */}
        <div
          style={{
            position: "absolute",
            top: "48px",
            left: "10%",
            width: "60px",
            height: "3px",
            background: "#2a2232",
            borderRadius: "1px",
          }}
        />
        {/* Small book on shelf */}
        <div
          style={{
            position: "absolute",
            top: "38px",
            left: "calc(10% + 8px)",
            width: "8px",
            height: "10px",
            background: "#4a3048",
            borderRadius: "1px",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "36px",
            left: "calc(10% + 18px)",
            width: "6px",
            height: "12px",
            background: "#2e4a50",
            borderRadius: "1px",
          }}
        />
      </div>

      {/* ===== Floor ===== */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "58%",
          background:
            "linear-gradient(180deg, #16121e 0%, #14101c 50%, #12101a 100%)",
          borderTop: "1px solid rgba(255,255,255,0.02)",
        }}
      >
        {/* Perspective floor lines */}
        {[0.12, 0.32, 0.58].map((y, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${y * 100}%`,
              left: "8%",
              right: "8%",
              height: "1px",
              background: `rgba(255,255,255,${0.018 - i * 0.004})`,
            }}
          />
        ))}
      </div>

      {/* ===== Desk area ===== */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: "16px",
          gap: "2px",
        }}
      >
        {/* Back row */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "16px",
            opacity: 0.65,
            marginBottom: "0px",
          }}
        >
          {BACK_ROW.map((agent) => (
            <AgentDesk
              key={agent.roleId}
              agent={agent}
              live={getLive(agent.roleId)}
              scale={0.68}
            />
          ))}
        </div>

        {/* Middle row */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "28px",
            opacity: 0.82,
            marginBottom: "0px",
          }}
        >
          {MIDDLE_ROW.map((agent) => (
            <AgentDesk
              key={agent.roleId}
              agent={agent}
              live={getLive(agent.roleId)}
              scale={0.82}
            />
          ))}
        </div>

        {/* Front row */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "40px",
          }}
        >
          {FRONT_ROW.map((agent) => (
            <AgentDesk
              key={agent.roleId}
              agent={agent}
              live={getLive(agent.roleId)}
              scale={1}
            />
          ))}
        </div>
      </div>

      {/* ===== Ambient warm glow ===== */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 35%, rgba(245,180,80,0.025) 0%, transparent 55%)",
          pointerEvents: "none",
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.35) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* ===== Header overlay ===== */}
      <div
        style={{
          position: "absolute",
          top: "14px",
          left: "20px",
          zIndex: 10,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "15px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.65)",
            textShadow: "0 1px 4px rgba(0,0,0,0.5)",
            letterSpacing: "0.5px",
          }}
        >
          The Office
        </h1>
        <p
          style={{
            margin: "2px 0 0",
            fontSize: "10px",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          {activeCount} active {"\u00B7"} {ALL_AGENTS.length - activeCount}{" "}
          available
        </p>
      </div>

      {/* ===== Activity feed overlay ===== */}
      {feedEvents.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: "14px",
            right: "14px",
            width: "260px",
            zIndex: 10,
            opacity: 0.85,
          }}
        >
          <AgentActivityFeed events={feedEvents} />
        </div>
      )}

      {/* ===== Keyframe animations ===== */}
      <style>{`
        @keyframes agent-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes code-line {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; width: 70%; }
        }
        @keyframes steam {
          0% { opacity: 0.25; transform: translateY(0) scaleX(1); }
          50% { opacity: 0.1; transform: translateY(-4px) scaleX(1.3); }
          100% { opacity: 0; transform: translateY(-8px) scaleX(0.8); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.9; }
        }
        @keyframes clock-hand {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
