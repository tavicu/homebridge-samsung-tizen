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
  private inputUpdatePromise: Promise<void> | null = null;

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
    if (this.inputUpdatePromise) {
      return this.inputUpdatePromise;
    }

    this.inputUpdatePromise = (async () => {
      if (!this.device.power) {
        return;
      }

      const currentIdentifier = (this.service.getCharacteristic(this.characteristic.ActiveIdentifier).value as number) || 0;

      // Stop at the first match, so check cheapest-first: current input, then non-app sources, then apps (each app hits the TV).
      const inputPriority = (input: InputService): number => {
        if (currentIdentifier && input.config.identifier === currentIdentifier) {
          return 0;
        }

        return input.config.type === 'app' ? 2 : 1;
      };

      const prioritizedInputs = [...this.accessory.inputs].sort((a, b) => inputPriority(a) - inputPriority(b));

      for (const input of prioritizedInputs) {
        try {
          const isActive = await input.getInput();

          if (isActive) {
            this.updateValue(this.characteristic.ActiveIdentifier, input.config.identifier);
            return;
          }
        } catch {}

        await sleep(150);
      }

      this.updateValue(this.characteristic.ActiveIdentifier, 0);
    })().finally(() => {
      this.inputUpdatePromise = null;
    });

    return this.inputUpdatePromise;
  }
}
