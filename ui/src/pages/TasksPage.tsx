import React, { useState, useCallback } from "react";
import { KanbanBoard } from "../components/mission/KanbanBoard";
import { TaskModal } from "../components/mission/TaskModal";
import type { TaskEvent } from "../hooks/useWebSocket";

type Props = {
  taskEvents: TaskEvent[];
};

export default function TasksPage({ taskEvents }: Props) {
  const [taskRefreshKey, setTaskRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const handleTaskCreated = useCallback(() => {
    setTaskRefreshKey((k) => k + 1);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        padding: "20px 24px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--j-text)",
              margin: 0,
            }}
          >
            Tasks
          </h1>
          <div style={{ fontSize: "13px", color: "var(--j-text-muted)", marginTop: "4px" }}>
            Track work across all agents
          </div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            marginLeft: "auto",
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            background: "var(--j-accent)",
            color: "#000",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          + New Task
        </button>
      </div>

      {/* Kanban board */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <KanbanBoard refreshKey={taskRefreshKey} taskEvents={taskEvents} />
      </div>

      {/* Task creation modal */}
      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleTaskCreated}
      />
    </div>
  );
}
