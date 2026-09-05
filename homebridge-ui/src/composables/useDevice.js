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
        return {
          reachable: true,
          mac: result.mac || null,
          title: 'Connection established',
          message: 'We have successfully connected to the TV, and the IP looks correct and the device is reachable!',
        };
      }
    } catch {
    } finally {
      isTesting.value = false;
    }

    return {
      reachable: false,
      title: 'Unable to connect',
      message: 'We could not reach the TV, confirm that the IP is correct and that the TV is turned on!',
    };
  }

  return {
    isTesting,
    canTest,
    testConnection,
  };
}
