<script setup>
import { computed, onMounted } from 'vue';
import { useConfig } from '../composables/useConfig';
import { useDiscovery } from '../composables/useDiscovery';
import { normalizeMac } from '../lib/device';
import DocsLink from './DocsLink.vue';

defineProps({
  selectedIp: {
    type: String,
    default: '',
  },
});

defineEmits(['select']);

const { config } = useConfig();
const { devices, isDiscovering, discover } = useDiscovery();

// TVs already in the config are left out, matched by MAC address or IP.
const newDevices = computed(() => {
  const configured = config.value?.devices || [];
  const ips = new Set(configured.map((device) => device.ip));
  const macs = new Set(configured.map((device) => normalizeMac(device.mac)));

  return devices.value
    .filter((device) => !ips.has(device.ip) && !(device.mac && macs.has(normalizeMac(device.mac))))
    .sort((a, b) => (a.name || a.ip).localeCompare(b.name || b.ip));
});

onMounted(() => {
  discover();
});
</script>

<template>
  <div v-if="newDevices.length" class="card card-discovered shadow">
    <div class="card-header d-flex align-items-center justify-content-between gap-3">
      <h6 class="fw-semibold mb-0">TVs found on your network</h6>
      <button type="button" class="btn btn-sm btn-outline-secondary flex-shrink-0" :disabled="isDiscovering" @click="discover">
        <i class="fas fa-arrows-rotate me-1" :class="{ 'fa-spin': isDiscovering }" />
        {{ isDiscovering ? 'Searching...' : 'Search again' }}
      </button>
    </div>

    <table class="table table-compact mb-0">
      <tbody>
        <tr v-for="device in newDevices" :key="device.ip" class="align-middle">
          <td>
            <div class="text-body fw-semibold">{{ device.name || device.ip }}</div>
            <div v-if="device.model" class="small text-secondary">{{ device.model }}</div>
          </td>
          <td>{{ device.ip }}</td>
          <td class="text-end text-nowrap">
            <template v-if="!device.tokenSupport">
              <span class="badge rounded-pill bg-secondary">Not supported</span>
              <DocsLink path="tvNotSupported" />
            </template>
            <button v-else-if="device.ip === selectedIp" type="button" class="btn btn-sm btn-outline-success" disabled><i class="fas fa-check" /> Selected</button>
            <button v-else type="button" class="btn btn-sm btn-primary" @click="$emit('select', device)">Use</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* Tinted with the primary color, so the TVs found stand out from the form below. */
.card-discovered {
  --bs-card-cap-padding-y: 0.5rem;
  --bs-card-cap-bg: color-mix(in srgb, var(--bs-primary) 6%, transparent);
  --bs-card-border-color: color-mix(in srgb, var(--bs-primary) 30%, transparent);
}

.card-discovered .card-header h6 {
  font-size: 0.9rem;
}

.dark-mode .card-discovered {
  --bs-card-cap-bg: color-mix(in srgb, var(--bs-primary) 15%, transparent);
  --bs-card-border-color: color-mix(in srgb, var(--bs-primary) 40%, transparent);
}
</style>
