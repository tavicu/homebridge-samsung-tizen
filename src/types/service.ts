import { Service } from 'homebridge';

export type LinkedService = Service & {
  linked?: boolean;
};
