import { ref } from 'vue';
import { decodeDeviceName } from '../lib/device';
import { useHomebridge } from './useHomebridge';

function withDecodedName(device) {
  return { ...device, name: decodeDeviceName(device.name) };
}

export function useDiscovery() {
  const { hb, serverRequest } = useHomebridge();
  const devices = ref([]);
  const isDiscovering = ref(false);

  // The server reports each TV as soon as it is confirmed, so the list fills in while the search is still running.
  function onFound(event) {
    const device = withDecodedName(event.data);

    if (!devices.value.some((item) => item.ip === device.ip)) {
      devices.value = [...devices.value, device];
    }
  }

  // Searches the network for Samsung TVs, which takes a few seconds. A failed search keeps the last results.
  async function discover() {
    isDiscovering.value = true;
    hb?.addEventListener('device:found', onFound);

    try {
      devices.value = (await serverRequest('/device/discover')).map(withDecodedName);
    } catch {
    } finally {
      hb?.removeEventListener('device:found', onFound);
      isDiscovering.value = false;
    }
  }

  return {
    devices,
    isDiscovering,
    discover,
  };
}
