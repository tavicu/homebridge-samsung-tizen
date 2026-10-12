export type InputConfig = {
  name: string;
  type: 'app' | 'input' | 'command' | 'artmode';
  value?: string | string[];
  identifier: number;
};
