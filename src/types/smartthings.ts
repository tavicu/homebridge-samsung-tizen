export type SmartThingsStorage = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  clear(): void;
};

export type SmartThingsCommand = {
  component?: string;
  capability: string;
  command: string;
  arguments?: (string | number | boolean | null)[];
};

export type SmartThingsRequestConfig = {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  commands?: SmartThingsCommand | SmartThingsCommand[];
};

export type SmartThingsAttribute<T = string | null> = {
  value?: T;
  timestamp?: string;
  unit?: string;
};

export type SmartThingsPictureMode = {
  id: string;
  name: string;
};

export type SmartThingsDeviceStatus = {
  components?: {
    main?: {
      tvChannel?: {
        tvChannel?: SmartThingsAttribute;
        tvChannelName?: SmartThingsAttribute;
      };
      mediaInputSource?: {
        inputSource?: SmartThingsAttribute;
      };
      'samsungvd.mediaInputSource'?: {
        inputSource?: SmartThingsAttribute;
      };
      'custom.picturemode'?: {
        pictureMode?: SmartThingsAttribute;
        supportedPictureModesMap?: SmartThingsAttribute<SmartThingsPictureMode[]>;
      };
    };
  };
};

export type SmartThingsClientState = {
  tvChannel: string | null;
  tvChannelName: string | null;
  inputSource: string | null;
  pictureMode: string | null;
};
