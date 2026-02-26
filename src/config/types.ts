export type HeartbeatConfig = {
  interval_minutes: number;
  active_hours: { start: number; end: number };
  aggressiveness: 'passive' | 'moderate' | 'aggressive';
};

export type GoogleConfig = {
  client_id: string;
  client_secret: string;
};

export type ChannelConfig = {
  telegram?: {
    enabled: boolean;
    bot_token: string;
    allowed_users: number[];  // Telegram user IDs
  };
  discord?: {
    enabled: boolean;
    bot_token: string;
    allowed_users: string[];  // Discord user IDs
    guild_id?: string;        // restrict to single guild
  };
};

export type STTConfig = {
  provider: 'openai' | 'groq' | 'local';
  openai?: { api_key: string; model?: string };
  groq?: { api_key: string; model?: string };
  local?: { endpoint: string; model?: string };
};

export type TTSConfig = {
  enabled: boolean;
  provider?: 'edge' | 'elevenlabs';  // default: 'edge'
  voice?: string;       // e.g. 'en-US-AriaNeural' (edge)
  rate?: string;        // e.g. '+0%', '+10%' (edge)
  volume?: string;      // e.g. '+0%' (edge)
  elevenlabs?: {
    api_key: string;
    voice_id?: string;
    model?: string;           // 'eleven_flash_v2_5' | 'eleven_multilingual_v2'
    stability?: number;       // 0-1
    similarity_boost?: number; // 0-1
  };
};

export type DesktopConfig = {
  enabled: boolean;
  sidecar_port: number;
  sidecar_path?: string;
  auto_launch: boolean;
  tree_depth: number;
  snapshot_max_elements: number;
};

export type JarvisConfig = {
  daemon: {
    port: number;
    data_dir: string;
    db_path: string;
  };
  google?: GoogleConfig;
  channels?: ChannelConfig;
  stt?: STTConfig;
  tts?: TTSConfig;
  desktop?: DesktopConfig;
  llm: {
    primary: string;  // provider name
    fallback: string[];
    anthropic?: { api_key: string; model?: string };
    openai?: { api_key: string; model?: string };
    ollama?: { base_url?: string; model?: string };
  };
  personality: {
    core_traits: string[];
  };
  authority: {
    default_level: number;
  };
  heartbeat: HeartbeatConfig;
  active_role: string;  // role file name
};

export const DEFAULT_CONFIG: JarvisConfig = {
  daemon: {
    port: 3142,
    data_dir: '~/.jarvis',
    db_path: '~/.jarvis/jarvis.db',
  },
  channels: {
    telegram: { enabled: false, bot_token: '', allowed_users: [] },
    discord: { enabled: false, bot_token: '', allowed_users: [] },
  },
  stt: {
    provider: 'openai',
  },
  tts: {
    enabled: false,
    provider: 'edge',
    voice: 'en-US-AriaNeural',
    rate: '+0%',
    volume: '+0%',
  },
  desktop: {
    enabled: true,
    sidecar_port: 9224,
    auto_launch: true,
    tree_depth: 5,
    snapshot_max_elements: 60,
  },
  llm: {
    primary: 'anthropic',
    fallback: ['openai', 'ollama'],
    anthropic: {
      api_key: '',
      model: 'claude-sonnet-4-5-20250929',
    },
    openai: {
      api_key: '',
      model: 'gpt-4o',
    },
    ollama: {
      base_url: 'http://localhost:11434',
      model: 'llama3',
    },
  },
  personality: {
    core_traits: [
      'loyal',
      'efficient',
      'proactive',
      'respectful',
      'adaptive',
    ],
  },
  authority: {
    default_level: 3,
  },
  heartbeat: {
    interval_minutes: 15,
    active_hours: { start: 8, end: 23 },
    aggressiveness: 'aggressive',
  },
  active_role: 'personal-assistant',
};
