import React, { useState, useRef, useEffect } from "react";
import type { VoiceState } from "../../hooks/useVoice";

type VoiceProps = {
  voiceState: VoiceState;
  startRecording: () => void;
  stopRecording: () => void;
  isMicAvailable: boolean;
  isWakeWordReady: boolean;
  ttsAudioPlaying: boolean;
  cancelTTS: () => void;
};

type Props = {
  onSend: (text: string) => void;
  disabled?: boolean;
  voice?: VoiceProps;
};

export function ChatInput({ onSend, disabled, voice }: Props) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 150) + "px";
    }
  };

  const getMicTitle = () => {
    if (!voice) return "";
    if (voice.ttsAudioPlaying) return "Stop speaking";
    if (voice.voiceState === "recording") return "Click to send";
    if (voice.isWakeWordReady) return 'Say "Hey JARVIS" or click to speak';
    return "Click to speak";
  };

  const getMicIcon = () => {
    if (!voice) return "";
    if (voice.ttsAudioPlaying) return "\u23F9"; // stop
    if (voice.voiceState === "recording") return "\u25CF"; // filled circle
    if (voice.voiceState === "processing") return "\u23F3"; // hourglass
    return "\uD83C\uDFA4"; // microphone
  };

  const getMicBorder = () => {
    if (!voice) return "var(--j-border)";
    if (voice.voiceState === "recording") return "var(--j-error)";
    if (voice.ttsAudioPlaying) return "var(--j-accent)";
    return "var(--j-border)";
  };

  const getMicBg = () => {
    if (!voice) return "var(--j-bg)";
    if (voice.voiceState === "recording") return "rgba(239, 68, 68, 0.15)";
    if (voice.ttsAudioPlaying) return "rgba(0, 212, 255, 0.15)";
    return "var(--j-bg)";
  };

  const getMicColor = () => {
    if (!voice) return "var(--j-text-muted)";
    if (voice.voiceState === "recording") return "var(--j-error)";
    if (voice.ttsAudioPlaying) return "var(--j-accent)";
    if (voice.isWakeWordReady) return "var(--j-accent-dim)";
    return "var(--j-text-muted)";
  };

  const handleMicClick = () => {
    if (!voice) return;
    if (voice.ttsAudioPlaying) {
      voice.cancelTTS();
      return;
    }
    if (voice.voiceState === "recording") {
      // Click again to stop recording and send
      voice.stopRecording();
    } else if (voice.voiceState === "idle" || voice.voiceState === "wake_detected") {
      // Click to start recording
      voice.startRecording();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        padding: "16px 20px",
        borderTop: "1px solid var(--j-border)",
        background: "var(--j-surface)",
        alignItems: "flex-end",
      }}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder="Type a message..."
        disabled={disabled}
        rows={1}
        style={{
          flex: 1,
          resize: "none",
          background: "var(--j-bg)",
          border: "1px solid var(--j-border)",
          borderRadius: "8px",
          padding: "10px 14px",
          color: "var(--j-text)",
          fontSize: "14px",
          lineHeight: "1.5",
          outline: "none",
          fontFamily: "inherit",
          minHeight: "40px",
          maxHeight: "150px",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--j-accent-dim)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--j-border)")}
      />

      {/* Mic button */}
      {voice?.isMicAvailable && (
        <button
          onClick={handleMicClick}
          title={getMicTitle()}
          disabled={voice.voiceState === "processing"}
          style={{
            width: "40px",
            minHeight: "40px",
            borderRadius: "8px",
            border: `1px solid ${getMicBorder()}`,
            background: getMicBg(),
            color: getMicColor(),
            cursor: voice.voiceState === "processing" ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            flexShrink: 0,
            transition: "all 0.15s",
            animation: voice.voiceState === "recording" ? "micPulse 1s ease infinite" : "none",
          }}
        >
          {getMicIcon()}
        </button>
      )}

      <button
        onClick={handleSubmit}
        disabled={!text.trim() || disabled}
        style={{
          padding: "10px 20px",
          borderRadius: "8px",
          border: "none",
          background:
            text.trim() && !disabled
              ? "var(--j-accent)"
              : "var(--j-border)",
          color:
            text.trim() && !disabled ? "#000" : "var(--j-text-muted)",
          cursor: text.trim() && !disabled ? "pointer" : "not-allowed",
          fontSize: "13px",
          fontWeight: 600,
          transition: "all 0.15s",
          minHeight: "40px",
        }}
      >
        Send
      </button>
    </div>
  );
}
