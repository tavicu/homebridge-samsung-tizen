import { ref } from 'vue';
import { useHomebridge } from './useHomebridge';

export function useDevice() {
  const { serverRequest } = useHomebridge();
  const isTesting = ref(false);

  function canTest(ipInput) {
    return !isTesting.value && ipInput?.validity.valid === true;
  }

  async function testConnection(ip) {
    isTesting.value = true;

    try {
      const result = await serverRequest('/device/get-info', { ip });

      if (result?.reachable) {
        if (result.tokenSupport === false) {
          return {
            error: true,
            title: 'TV not supported',
            message: 'We have successfully connected, but this TV is not supported by this plugin!',
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
    };
  }

  return {
    canTest,
    isTesting,
    testConnection,
  };
}
