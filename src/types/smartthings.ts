export type SmartThingsStorage = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  clear(): void;
};

export type SmartThingsCommand = {
  component: string;
  capability: string;
  command: string;
  arguments?: (string | number | boolean | null)[];
};

export type SmartThingsRequestConfig = {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  commands?: SmartThingsCommand | SmartThingsCommand[];
};

export type SmartThingsClientState = {
  tvChannel: string | null;
  tvChannelName: string | null;
  inputSource: string | null;
  pictureMode: string | null;
};
