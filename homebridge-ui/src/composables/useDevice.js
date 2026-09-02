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
      const result = await serverRequest('/device/test-connection', { ip });

      if (result?.reachable) {
        return {
          reachable: true,
          mac: result.mac || null,
          message: 'The TV responded. The IP looks correct and the TV is reachable.',
        };
      }
    } catch {
    } finally {
      isTesting.value = false;
    }

    return {
      reachable: false,
      message: 'Could not reach the TV. Check the IP, that the TV is on, and that it is on the same network.',
    };
  }

  return {
    isTesting,
    canTest,
    testConnection,
  };
}
