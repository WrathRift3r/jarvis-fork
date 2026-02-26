import React from "react";
import type { ChatMessage } from "../hooks/useWebSocket";
import type { UseVoiceReturn } from "../hooks/useVoice";
import { MessageList } from "../components/chat/MessageList";
import { ChatInput } from "../components/chat/ChatInput";

type ChatPageProps = {
  messages: ChatMessage[];
  isConnected: boolean;
  sendMessage: (text: string) => void;
  voice?: UseVoiceReturn;
};

export default function ChatPage({ messages, isConnected, sendMessage, voice }: ChatPageProps) {
  const voiceStatus = voice
    ? voice.voiceState === "speaking" || voice.ttsAudioPlaying
      ? "JARVIS is speaking..."
      : voice.voiceState === "processing"
        ? "Transcribing..."
        : voice.voiceState === "recording"
          ? "Listening..."
          : null
    : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "relative",
      }}
    >
      {/* Connection status bar */}
      {!isConnected && (
        <div
          style={{
            padding: "6px 16px",
            background: "rgba(239, 68, 68, 0.15)",
            borderBottom: "1px solid rgba(239, 68, 68, 0.3)",
            color: "var(--j-error)",
            fontSize: "12px",
            textAlign: "center",
          }}
        >
          Disconnected from JARVIS. Reconnecting...
        </div>
      )}

      {/* Voice status bar */}
      {voiceStatus && (
        <div
          style={{
            padding: "6px 16px",
            background: "rgba(0, 212, 255, 0.1)",
            borderBottom: "1px solid rgba(0, 212, 255, 0.2)",
            color: "var(--j-accent)",
            fontSize: "12px",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <span style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: voice?.voiceState === "recording" ? "var(--j-error)" : "var(--j-accent)",
            display: "inline-block",
            animation: voice?.voiceState === "recording" ? "micPulse 1s ease infinite" : "none",
          }} />
          {voiceStatus}
        </div>
      )}

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        disabled={!isConnected}
        voice={voice ? {
          voiceState: voice.voiceState,
          startRecording: voice.startRecording,
          stopRecording: voice.stopRecording,
          isMicAvailable: voice.isMicAvailable,
          isWakeWordReady: voice.isWakeWordReady,
          ttsAudioPlaying: voice.ttsAudioPlaying,
          cancelTTS: voice.cancelTTS,
        } : undefined}
      />

      {/* Animations */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes micPulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
