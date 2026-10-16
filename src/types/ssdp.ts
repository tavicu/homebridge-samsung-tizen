export const SsdpEvent = {
  ALIVE: 'ssdp:alive',
  BYEBYE: 'ssdp:byebye',
} as const;

export type SsdpEvent = (typeof SsdpEvent)[keyof typeof SsdpEvent];

export type SsdpHeaders = Record<string, string | undefined>;

export type SsdpAddress = {
  address: string;
  port: number;
};

export type SsdpMessage = {
  type: 'notify' | 'found';
  headers: SsdpHeaders;
};

export type SsdpListenerOptions = {
  // Listen for NOTIFY announcements on the multicast group. Not needed when only searching.
  notifications?: boolean;
};

export type SsdpListenerEvents = {
  ready: [];
  notify: [headers: SsdpHeaders, address: SsdpAddress];
  found: [headers: SsdpHeaders, address: SsdpAddress];
  error: [error: Error];
};
