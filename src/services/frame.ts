import { CharacteristicValue } from 'homebridge';
import { FrameAccessory } from '../accessories/index.js';
import { LinkedService } from '../types/index.js';
import { ServiceWrapper } from './wrapper.js';

const FRAME_SWITCHES = {
  art: {
    name: 'Art Mode',
    get: (service: FrameService) => service.getArtMode(),
    set: (service: FrameService, value: CharacteristicValue) => service.setArtMode(value),
  },
  power: {
    name: 'Power',
    get: (service: FrameService) => service.getPower(),
    set: (service: FrameService, value: CharacteristicValue) => service.setPower(value),
  },
} as const;

type FrameSwitchKind = keyof typeof FRAME_SWITCHES;

export class FrameService extends ServiceWrapper {
  public service: LinkedService;
  private readonly onGet: () => boolean;
  private readonly onSet: (value: CharacteristicValue) => Promise<void>;

  constructor(accessory: FrameAccessory, kind: FrameSwitchKind) {
    super(accessory);

    const { name, get, set } = FRAME_SWITCHES[kind];
    const prefixName = this.device.hasOption('Switch.DeviceName.Disable') ? '' : `${this.device.config.name} `;
    const switchName = prefixName + name;

    this.onGet = () => get(this);
    this.onSet = (value) => set(this, value);

    this.service = new this.hap.Service.Switch(switchName, `frame.${kind}`).setCharacteristic(this.characteristic.ConfiguredName, switchName);
    this.service.getCharacteristic(this.characteristic.On).onGet(this.onGet).onSet(this.onSet);
  }

  public async updateValue(): Promise<void> {
    this.handleUpdateValue(this.characteristic.On, this.onGet());
  }

  public getArtMode(): boolean {
    return this.device.power && this.device.artmode;
  }

  public getPower(): boolean {
    return this.device.power;
  }

  public async setArtMode(value: CharacteristicValue): Promise<void> {
    await this.handleSet(this.device.setArtMode(value as boolean), { errorMessage: 'Failed to set Art Mode' });
  }

  public async setPower(value: CharacteristicValue): Promise<void> {
    await this.handleSet(this.device.setPower(value as boolean), { errorMessage: 'Failed to set Power' });
  }
}
