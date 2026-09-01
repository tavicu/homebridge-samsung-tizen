import { CharacteristicValue, Service } from 'homebridge';

export const updateValueIfChanged = (service: Service, characteristic: Parameters<Service['getCharacteristic']>[0], value: CharacteristicValue): void => {
  if (service.getCharacteristic(characteristic)?.value === value) {
    return;
  }

  service.updateCharacteristic(characteristic, value);
};
