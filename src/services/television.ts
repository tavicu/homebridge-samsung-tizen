import { CharacteristicValue } from 'homebridge';
import { TelevisionAccessory } from '../accessories/television.js';
import { getRemoteKeysMap } from '../lib/remote.js';
import { sleep } from '../lib/tools.js';
import { LinkedService } from '../types/types.js';
import { InputService } from './input.js';
import { CharacteristicRef, ServiceWrapper } from './wrapper.js';

export class TelevisionService extends ServiceWrapper {
  public service: LinkedService;
  private remoteKeys: Record<number, string>;

  constructor(private accessory: TelevisionAccessory) {
    super(accessory);

    this.remoteKeys = getRemoteKeysMap(this.device, this.characteristic);

    const displayOrder = this.accessory.inputs.map((input: InputService) => input.config.identifier);

    this.service = new this.hap.Service.Television(this.device.config.name)
      .setCharacteristic(this.characteristic.ConfiguredName, this.device.config.name)
      .setCharacteristic(this.characteristic.DisplayOrder, this.hap.encode(1, displayOrder).toString('base64'))
      .setCharacteristic(this.characteristic.SleepDiscoveryMode, this.characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);

    this.service.getCharacteristic(this.characteristic.Active).onGet(this.getActive.bind(this)).onSet(this.setActive.bind(this));
    this.service.getCharacteristic(this.characteristic.ActiveIdentifier).onGet(this.getInput.bind(this)).onSet(this.setInput.bind(this));
    this.service.getCharacteristic(this.characteristic.RemoteKey).onSet(this.setRemoteKey.bind(this));
  }

  public addLinkedService(newLinkedService: LinkedService) {
    return this.service.addLinkedService(newLinkedService);
  }

  public async updateValue(characteristic?: CharacteristicRef, value?: CharacteristicValue): Promise<void> {
    this.handleUpdateValue(characteristic ?? this.characteristic.Active, value !== undefined ? value : await this.getActive());
  }

  private async getActive(): Promise<CharacteristicValue> {
    return this.device.power ? this.characteristic.Active.ACTIVE : this.characteristic.Active.INACTIVE;
  }

  private async setActive(value: CharacteristicValue) {
    await this.handleSet(this.device.setPower(value as boolean), { errorMessage: `Failed to set power state to ${value}` });
  }

  private async setRemoteKey(value: CharacteristicValue) {
    const tvCommand = this.remoteKeys[value as number];

    if (!tvCommand) {
      return;
    }

    await this.handleSet(this.device.sendCommand(tvCommand), { errorMessage: `Failed to send remote key ${tvCommand}` });
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
      this.throwStatusError(this.hap.HAPStatus.RESOURCE_DOES_NOT_EXIST);
    }

    await this.handleSet(targetInput.setInput(), { errorMessage: `Failed to set input to ${targetInput.config.name}` });

    if (targetInput.stateless) {
      setTimeout(() => this.updateValue(this.characteristic.ActiveIdentifier, 0), 500);
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
          this.updateValue(this.characteristic.ActiveIdentifier, input.config.identifier);
          return;
        }
      } catch {}

      await sleep(100);
    }

    this.updateValue(this.characteristic.ActiveIdentifier, 0);
  }
}
