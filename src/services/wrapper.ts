import { Characteristic, CharacteristicValue, HAPStatus, Service, type HAP } from 'homebridge';
import type { Device } from '../device/device.js';
import { IgnorableError } from '../errors.js';
import { race } from '../lib/tools.js';
import type { SamsungPlatform } from '../platform.js';
import { LinkedService } from '../types/index.js';

type AccessoryLike = {
  device: Device;
  platform: SamsungPlatform;
};

type HandleSetOptions = {
  errorMessage?: string;
  onError?: (error: unknown) => unknown;
};

export type CharacteristicRef = Parameters<Service['getCharacteristic']>[0];

export abstract class ServiceWrapper {
  public abstract service: LinkedService;

  protected device: Device;
  protected platform: SamsungPlatform;
  protected hap: HAP;
  protected characteristic: typeof Characteristic;

  constructor(accessory: AccessoryLike) {
    this.device = accessory.device;
    this.platform = accessory.platform;
    this.hap = accessory.platform.api.hap;
    this.characteristic = this.hap.Characteristic;
  }

  public async updateValue(): Promise<void> {}

  protected handleUpdateValue(characteristic: CharacteristicRef, value: CharacteristicValue): void {
    if (this.service.getCharacteristic(characteristic)?.value === value) {
      return;
    }

    this.service.updateCharacteristic(characteristic, value);
  }

  protected throwStatusError(status: HAPStatus = HAPStatus.SERVICE_COMMUNICATION_FAILURE): never {
    throw new this.hap.HapStatusError(status);
  }

  protected async handleSet(action: Promise<unknown>, { errorMessage, onError }: HandleSetOptions): Promise<void> {
    try {
      await race(action);
    } catch (error) {
      if (error instanceof IgnorableError) {
        return;
      }

      this.device.log.error(errorMessage || error?.message || error);

      if (error.stack) {
        this.device.log.debug(error.stack);
      }

      if (onError?.(error)) {
        return;
      }

      this.throwStatusError();
    }
  }
}
