<script setup>
import { computed, onMounted } from 'vue';
import { useConfig } from '../composables/useConfig';
import { useRouter } from '../composables/useRouter';
import { useSmartThings } from '../composables/useSmartThings';
import Callout from './Callout.vue';

const props = defineProps({
  deviceIndex: {
    type: Number,
    default: undefined,
  },
});

const { config } = useConfig();
const { navigateTo } = useRouter();
const { isLoading, status, getToken } = useSmartThings();

const hasDeviceId = (device) => Boolean(device?.deviceId || device?.device_id);

// TVs that would skip SmartThings settings, because without a device ID SmartThings cannot reach them.
const missingDevices = computed(() => {
  if (props.deviceIndex !== undefined) {
    const device = config.value.devices?.[props.deviceIndex];
    return hasDeviceId(device) ? [] : [device];
  }

  return (config.value.devices || []).filter((device) => !hasDeviceId(device) && !device.options?.includes('Device.Disable'));
});

onMounted(getToken);
</script>

<template>
  <Callout v-if="!isLoading && status !== 'connected'" class="callout-sm" state="warning">
    <template v-if="status === 'expired'">The SmartThings authorization has expired, so this will not work until you re-authorize it.</template>
    <template v-else>SmartThings is not connected, so this will not work yet.</template>
    <a href="#" class="ms-1" @click.prevent="navigateTo('smartthings')">{{ status === 'expired' ? 'Re-authorize' : 'Connect SmartThings' }}</a>
  </Callout>

  <Callout v-else-if="!isLoading && missingDevices.length" class="callout-sm" state="warning">
    <template v-if="deviceIndex !== undefined">
      This TV has no SmartThings Device ID, so this will not work yet.
      <a href="#" @click.prevent="navigateTo('device', { action: 'edit', deviceIndex, tab: 'settings' })">Open TV settings</a>
    </template>
    <template v-else>TVs without a SmartThings Device ID skip this: {{ missingDevices.map((device) => device.name).join(', ') }}.</template>
  </Callout>
</template>
