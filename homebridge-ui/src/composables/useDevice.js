import { ref } from 'vue';
import { useHomebridge } from './useHomebridge';

export function useDevice() {
  const { serverRequest } = useHomebridge();
  const isTesting = ref(false);

  function canTest(ipInput) {
    return !isTesting.value && ipInput?.validity.valid === true;
  }

  async function getInfo(ip) {
    return serverRequest('/device/get-info', { ip });
  }

  // Apps installed on any of the given TVs, each listed once and sorted by name.
  async function getApps(devices) {
    const lists = await Promise.all(devices.filter((device) => device?.mac).map((device) => serverRequest('/device/get-apps', { mac: device.mac })));
    const apps = new Map(lists.flat().map((app) => [String(app.id), app]));

    return [...apps.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  async function testConnection(ip) {
    isTesting.value = true;

    try {
      const result = await getInfo(ip);

      if (result?.reachable) {
        if (result.tokenSupport === false) {
          return {
            error: true,
            title: 'TV not supported',
            message: 'We have successfully connected, but this TV is not supported by this plugin!',
            docs: 'tvNotSupported',
          };
        }

        return {
          error: false,
          mac: result.mac || null,
          title: 'Connection established',
          message: 'We have successfully connected, and the IP looks correct and the device is reachable!',
        };
      }
    } catch {
    } finally {
      isTesting.value = false;
    }

    return {
      error: true,
      title: 'Unable to connect',
      message: 'We could not reach the device, confirm that the IP is correct and that it is turned on!',
      docs: 'network',
    };
  }

  return {
    canTest,
    isTesting,
    testConnection,
    getInfo,
    getApps,
  };
}
