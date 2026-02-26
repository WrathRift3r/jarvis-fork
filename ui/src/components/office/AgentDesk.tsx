import React from "react";

export type DeskAgent = {
  roleId: string;
  name: string;
  emoji: string;
  alwaysActive?: boolean;
  items?: ("coffee" | "plant")[];
};

export type LiveAgentInfo = {
  id: string;
  role: { id: string; name: string };
  status: "active" | "idle" | "terminated";
  current_task: string | null;
  created_at: number;
};

type Props = {
  agent: DeskAgent;
  live: LiveAgentInfo | null;
  scale?: number;
};

export function AgentDesk({ agent, live, scale = 1 }: Props) {
  const isWorking = agent.alwaysActive || live?.status === "active";
  const task = live?.current_task ?? null;
  const items = agent.items ?? [];

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "bottom center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        width: "160px",
        flexShrink: 0,
      }}
    >
      {/* Warm lamp glow */}
      {isWorking && (
        <div
          style={{
            position: "absolute",
            top: "-30px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "140px",
            height: "120px",
            background:
              "radial-gradient(ellipse, rgba(245,180,80,0.10) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}

      {/* Monitor */}
      <div
        style={{
          width: "72px",
          height: "48px",
          background: "#1a1a24",
          borderRadius: "4px 4px 2px 2px",
          border: `1.5px solid ${isWorking ? "rgba(0,200,240,0.3)" : "#252530"}`,
          position: "relative",
          overflow: "hidden",
          zIndex: 1,
          boxShadow: isWorking
            ? "0 0 12px rgba(0,200,240,0.12), 0 0 24px rgba(0,200,240,0.04)"
            : "none",
          transition: "box-shadow 0.5s, border-color 0.5s",
        }}
      >
        {/* Screen */}
        <div
          style={{
            width: "100%",
            height: "100%",
            background: isWorking
              ? "linear-gradient(180deg, rgba(0,180,220,0.07), rgba(0,80,110,0.03))"
              : "#08080e",
            padding: "6px 8px",
            display: "flex",
            flexDirection: "column",
            gap: "3px",
            justifyContent: "center",
          }}
        >
          {isWorking ? (
            <>
              <div
                style={{
                  height: "2px",
                  width: "55%",
                  background: "rgba(0,200,240,0.3)",
                  borderRadius: "1px",
                  animation: "code-line 3s ease-in-out infinite",
                }}
              />
              <div
                style={{
                  height: "2px",
                  width: "40%",
                  background: "rgba(0,200,240,0.2)",
                  borderRadius: "1px",
                  marginLeft: "8px",
                  animation: "code-line 3s ease-in-out 0.4s infinite",
                }}
              />
              <div
                style={{
                  height: "2px",
                  width: "50%",
                  background: "rgba(0,200,240,0.25)",
                  borderRadius: "1px",
                  marginLeft: "4px",
                  animation: "code-line 3s ease-in-out 0.8s infinite",
                }}
              />
              <div
                style={{
                  height: "2px",
                  width: "30%",
                  background: "rgba(0,200,240,0.2)",
                  borderRadius: "1px",
                  animation: "code-line 3s ease-in-out 1.2s infinite",
                }}
              />
              <div
                style={{
                  width: "4px",
                  height: "2px",
                  background: "rgba(0,200,240,0.6)",
                  borderRadius: "1px",
                  animation: "cursor-blink 1s step-end infinite",
                }}
              />
            </>
          ) : (
            /* Off screen — faint reflection */
            <div
              style={{
                width: "100%",
                height: "100%",
                background:
                  "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.015) 50%, transparent 60%)",
              }}
            />
          )}
        </div>
      </div>

      {/* Monitor stand */}
      <div
        style={{
          width: "6px",
          height: "5px",
          background: "#22222c",
          zIndex: 1,
        }}
      />
      <div
        style={{
          width: "16px",
          height: "3px",
          background: "#22222c",
          borderRadius: "0 0 2px 2px",
          zIndex: 1,
        }}
      />

      {/* Desk surface */}
      <div
        style={{
          width: "130px",
          height: "16px",
          background: "linear-gradient(180deg, #3d2e24, #332618)",
          borderRadius: "2px 2px 0 0",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
          borderTop: "1px solid rgba(255,255,255,0.04)",
          marginTop: "-1px",
        }}
      >
        {/* Keyboard */}
        <div
          style={{
            width: "28px",
            height: "7px",
            background: "#252530",
            borderRadius: "1.5px",
            border: "0.5px solid #333340",
          }}
        />

        {/* Desk accessories */}
        <div
          style={{
            position: "absolute",
            right: "6px",
            top: "-8px",
            display: "flex",
            gap: "3px",
            alignItems: "flex-end",
          }}
        >
          {items.includes("coffee") && <CoffeeCup steaming={isWorking} />}
          {items.includes("plant") && <DeskPlant />}
        </div>
      </div>

      {/* Desk front panel */}
      <div
        style={{
          width: "130px",
          height: "20px",
          background: "linear-gradient(180deg, #2e2018, #241a12)",
          borderRadius: "0 0 3px 3px",
          borderTop: "1px solid rgba(0,0,0,0.25)",
          zIndex: 1,
        }}
      />

      {/* Shadow under desk */}
      <div
        style={{
          width: "110px",
          height: "4px",
          background:
            "radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, transparent 80%)",
          zIndex: 0,
          marginTop: "-1px",
        }}
      />

      {/* Agent avatar */}
      <div
        style={{
          fontSize: "30px",
          lineHeight: 1,
          marginTop: "3px",
          filter: isWorking ? "none" : "grayscale(0.5) opacity(0.55)",
          animation: isWorking ? "agent-bob 3s ease-in-out infinite" : "none",
          transition: "filter 0.6s",
          zIndex: 1,
        }}
      >
        {agent.emoji}
      </div>

      {/* Name */}
      <div
        style={{
          fontSize: "10px",
          fontWeight: 600,
          color: isWorking ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)",
          marginTop: "3px",
          textAlign: "center",
          zIndex: 1,
          textShadow: isWorking
            ? "0 0 8px rgba(245,180,80,0.2)"
            : "none",
          transition: "color 0.5s",
          whiteSpace: "nowrap",
        }}
      >
        {agent.name}
      </div>

      {/* Status badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "9px",
          marginTop: "2px",
          zIndex: 1,
        }}
      >
        <span
          style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: isWorking ? "#00d4ff" : "rgba(255,255,255,0.18)",
            display: "inline-block",
            animation: isWorking
              ? "pulse-dot 1.5s ease-in-out infinite"
              : "none",
          }}
        />
        <span
          style={{
            color: isWorking ? "#00d4ff" : "rgba(255,255,255,0.25)",
            transition: "color 0.5s",
          }}
        >
          {isWorking ? "Working" : "Available"}
        </span>
      </div>

      {/* Current task */}
      {isWorking && task && (
        <div
          style={{
            fontSize: "8px",
            color: "rgba(255,255,255,0.35)",
            marginTop: "2px",
            textAlign: "center",
            maxWidth: "130px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            zIndex: 1,
          }}
        >
          {task}
        </div>
      )}
    </div>
  );
}

/* ---------- Accessories ---------- */

function CoffeeCup({ steaming }: { steaming: boolean }) {
  return (
    <div style={{ position: "relative", width: "8px", height: "10px" }}>
      {steaming && (
        <>
          <div
            style={{
              position: "absolute",
              top: "-7px",
              left: "1px",
              width: "2px",
              height: "5px",
              background: "rgba(255,255,255,0.12)",
              borderRadius: "50%",
              animation: "steam 2.5s ease-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "-5px",
              left: "4px",
              width: "2px",
              height: "4px",
              background: "rgba(255,255,255,0.08)",
              borderRadius: "50%",
              animation: "steam 2.5s ease-out 0.8s infinite",
            }}
          />
        </>
      )}
      <div
        style={{
          width: "8px",
          height: "9px",
          background: "#c4956a",
          borderRadius: "1px 1px 2px 2px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: "-3px",
            top: "2px",
            width: "3px",
            height: "4px",
            border: "1px solid #c4956a",
            borderLeft: "none",
            borderRadius: "0 2px 2px 0",
          }}
        />
      </div>
    </div>
  );
}

function DeskPlant() {
  return (
    <div style={{ position: "relative", width: "10px", height: "14px" }}>
      {/* Leaves */}
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "0px",
          width: "5px",
          height: "6px",
          background: "#3a7a4a",
          borderRadius: "50% 50% 10% 50%",
          transform: "rotate(-20deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-1px",
          left: "4px",
          width: "5px",
          height: "7px",
          background: "#2d6a3a",
          borderRadius: "50% 50% 50% 10%",
          transform: "rotate(15deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "2px",
          left: "2px",
          width: "4px",
          height: "5px",
          background: "#45885a",
          borderRadius: "50%",
          transform: "rotate(5deg)",
        }}
      />
      {/* Pot */}
      <div
        style={{
          position: "absolute",
          bottom: "0",
          left: "1px",
          width: "8px",
          height: "6px",
          background: "#8b5e3c",
          borderRadius: "1px 1px 2px 2px",
        }}
      />
    </div>
  );
}
