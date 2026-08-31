export const SsdpEvent = {
  ALIVE: 'ssdp:alive',
  BYEBYE: 'ssdp:byebye',
} as const;

export type SsdpEvent = (typeof SsdpEvent)[keyof typeof SsdpEvent];
