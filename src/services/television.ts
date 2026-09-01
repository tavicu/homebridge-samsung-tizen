import { Characteristic, CharacteristicValue } from 'homebridge';
import { TelevisionAccessory } from '../accessories/television.js';
import { Device } from '../device/device.js';
import { getRemoteKeysMap } from '../lib/remote.js';
import { race, sleep } from '../lib/tools.js';
import { SamsungPlatform } from '../platform.js';
import { LinkedService } from '../types/types.js';
import { InputService } from './input.js';

export class TelevisionService {
  public service: LinkedService;
  private device: Device;
  private platform: SamsungPlatform;
  private remoteKeys: Record<number, string>;
  private characteristic: typeof Characteristic;

  constructor(private accessory: TelevisionAccessory) {
    this.device = this.accessory.device;
    this.platform = this.accessory.platform;
    this.characteristic = this.platform.api.hap.Characteristic;

    this.remoteKeys = getRemoteKeysMap(this.device, this.characteristic);

    const displayOrder = this.accessory.inputs.map((input: InputService) => input.config.identifier);

    this.service = new this.platform.api.hap.Service.Television(this.device.config.name)
      .setCharacteristic(this.characteristic.ConfiguredName, this.device.config.name)
      .setCharacteristic(this.characteristic.DisplayOrder, this.platform.api.hap.encode(1, displayOrder).toString('base64'))
      .setCharacteristic(this.characteristic.SleepDiscoveryMode, this.characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);

    this.service.getCharacteristic(this.characteristic.Active).onGet(this.getActive.bind(this)).onSet(this.setActive.bind(this));
    this.service.getCharacteristic(this.characteristic.ActiveIdentifier).onGet(this.getInput.bind(this)).onSet(this.setInput.bind(this));
    this.service.getCharacteristic(this.characteristic.RemoteKey).onSet(this.setRemoteKey.bind(this));
  }

  public addLinkedService(newLinkedService: LinkedService) {
    return this.service.addLinkedService(newLinkedService);
  }

  public async updateValue(): Promise<void> {
    const value = await this.getActive();
    this.service.updateCharacteristic(this.characteristic.Active, value);
  }

  private async getActive(): Promise<CharacteristicValue> {
    return this.device.power ? this.characteristic.Active.ACTIVE : this.characteristic.Active.INACTIVE;
  }

  private async setActive(value: CharacteristicValue) {
    try {
      await race(this.device.setPower(value as boolean));
    } catch (error: any) {
      this.device.log.error(`Failed to set power state to ${value}: ${error.message || error}`);
      this.device.log.debug(error.stack);

      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  private async setRemoteKey(value: CharacteristicValue) {
    const tvCommand = this.remoteKeys[value as number];

    if (!tvCommand) {
      return;
    }

    try {
      await race(this.device.sendCommand(tvCommand));
    } catch (error: any) {
      this.device.log.error(`Failed to send remote key ${tvCommand}: ${error.message || error}`);
      this.device.log.debug(error.stack);

      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  private async getInput(): Promise<CharacteristicValue> {
    const currentIdentifier = (this.service.getCharacteristic(this.characteristic.ActiveIdentifier).value as number) || 0;

    this.runAsyncInputUpdate().catch(() => {});

    return currentIdentifier;
  }

  private async setInput(value: CharacteristicValue) {
    const targetIdentifier = value as number;

    const targetInput = this.accessory.inputs.find((input: InputService) => input.config.identifier === targetIdentifier);

    if (!targetInput) {
      this.device.log.warn(`Input with identifier ${targetIdentifier} not found.`);

      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.RESOURCE_DOES_NOT_EXIST);
    }

    try {
      await race(targetInput.setInput());

      if (targetInput.stateless) {
        setTimeout(() => this.service.updateCharacteristic(this.characteristic.ActiveIdentifier, 0), 150);
      }
    } catch (error: any) {
      this.device.log.error(`Failed to set input to ${targetInput.config.name}: ${error.message || error}`);
      this.device.log.debug(error.stack);

      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  private async runAsyncInputUpdate(): Promise<void> {
    if (!this.device.power) {
      return;
    }

    const currentIdentifier = (this.service.getCharacteristic(this.characteristic.ActiveIdentifier).value as number) || 0;

    const prioritizedInputs = [...this.accessory.inputs].sort((a, b) => {
      if (a.config.identifier === currentIdentifier) {
        return -1;
      }
      if (b.config.identifier === currentIdentifier) {
        return 1;
      }
      return 0;
    });

    for (const input of prioritizedInputs) {
      try {
        const isActive = await input.getInput();

        if (isActive) {
          if (currentIdentifier !== input.config.identifier) {
            this.service.updateCharacteristic(this.characteristic.ActiveIdentifier, input.config.identifier);
          }
          return;
        }
      } catch {}

      await sleep(100);
    }

    this.service.updateCharacteristic(this.characteristic.ActiveIdentifier, 0);
  }
}
