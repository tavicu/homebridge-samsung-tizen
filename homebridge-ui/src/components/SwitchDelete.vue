<script setup>
import { computed, watch } from 'vue';
import { useConfig } from '../composables/useConfig';
import { useRouter } from '../composables/useRouter';
import { useToast } from '../composables/useToast';
import Confirm from './Confirm.vue';

const props = defineProps({
  switchIndex: {
    type: Number,
    required: true,
  },
  deviceIndex: {
    type: Number,
    default: undefined,
  },
});

const { config, updateConfig } = useConfig();
const { navigateBack } = useRouter();
const toast = useToast();

const switchItem = computed(() => {
  if (props.deviceIndex !== undefined) {
    return config.value?.devices?.[props.deviceIndex]?.switches?.[props.switchIndex];
  }

  return config.value?.switches?.[props.switchIndex];
});

function goBack() {
  if (props.deviceIndex !== undefined) {
    navigateBack('device', { action: 'edit', deviceIndex: props.deviceIndex, tab: 'switches' });
    return;
  }

  navigateBack('dashboard', { tab: 'switches' });
}

async function confirmDelete() {
  try {
    if (props.deviceIndex !== undefined) {
      const updatedDevices = config.value.devices.map((item, dIndex) => {
        if (dIndex !== props.deviceIndex) {
          return item;
        }

        return {
          ...item,
          switches: item.switches.filter((_, index) => index !== props.switchIndex),
        };
      });

      await updateConfig({ devices: updatedDevices });
    } else {
      const updatedSwitches = config.value.switches.filter((_, index) => index !== props.switchIndex);
      await updateConfig({ switches: updatedSwitches });
    }

    toast.success('Switch deleted successfully. Restart Homebridge for the change to take effect.');
    goBack();
  } catch {
    toast.error('Failed to delete switch');
  }
}

watch(
  () => [props.switchIndex, props.deviceIndex],
  () => {
    if (!switchItem.value) {
      toast.error('Switch not found');
      goBack();
    }
  },
  { immediate: true },
);
</script>

<template>
  <Confirm title="Delete switch" confirm-label="Delete Switch" @cancel="navigateBack('switch', { action: 'edit', switchIndex, deviceIndex })" @confirm="confirmDelete">
    <p>
      Are you sure you want to delete the switch <span class="fw-semibold">{{ switchItem?.name }}</span> from configuration?
    </p>
    <p>This action is irreversible. Confirming saves the plugin configuration immediately.</p>
  </Confirm>
</template>
