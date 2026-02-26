import React, { useEffect, useRef } from "react";
import type { ChatMessage } from "../../hooks/useWebSocket";
import { MessageBubble } from "./MessageBubble";

type Props = {
  messages: ChatMessage[];
};

export function MessageList({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div
        ref={containerRef}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          color: "var(--j-text-muted)",
          padding: "40px",
        }}
      >
        <div
          style={{
            fontSize: "48px",
            opacity: 0.3,
            color: "var(--j-accent)",
          }}
        >
          &#9670;
        </div>
        <div style={{ fontSize: "16px", color: "var(--j-text-dim)" }}>
          Ready to assist
        </div>
        <div style={{ fontSize: "13px", maxWidth: "400px", textAlign: "center", lineHeight: "1.6" }}>
          Type a message below to start a conversation with JARVIS.
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        padding: "16px 0",
      }}
    >
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
