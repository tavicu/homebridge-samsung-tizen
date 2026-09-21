export type SwitchConfig = {
  name: string;
  identifier: number;
  power?: boolean;
  sleep?: number;
  mute?: boolean;
  volume?: number;
  app?: string;
  input?: string;
  channel?: number;
  picture_mode?: string;
  sound_mode?: string;
  command?: string | string[];
};

export type SwitchOption = {
  key: string;
  offable?: boolean;
  polled?: boolean;
  get?: () => Promise<boolean>;
  set: (switchValue: boolean) => Promise<void>;
};
