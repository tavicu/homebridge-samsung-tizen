<script setup>
import { computed, watch } from 'vue';
import { useConfig } from '../composables/useConfig';
import { useRouter } from '../composables/useRouter';
import { useToast } from '../composables/useToast';
import ConfirmDelete from './ConfirmDelete.vue';

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
const { navigateTo } = useRouter();
const toast = useToast();

const switchItem = computed(() => {
  if (props.deviceIndex !== undefined) {
    return config.value?.devices?.[props.deviceIndex]?.switches?.[props.switchIndex];
  }

  return config.value?.switches?.[props.switchIndex];
});

function goBack() {
  if (props.deviceIndex !== undefined) {
    navigateTo('device', { action: 'edit', deviceIndex: props.deviceIndex });
    return;
  }

  navigateTo('dashboard');
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

    toast.success('Switch deleted successfully');
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
  <div class="mb-3">
    <h6 class="fw-bold mb-0">Delete Switch</h6>
    <div class="text-muted">Delete the switch {{ switchItem?.name }}</div>
  </div>

  <ConfirmDelete
    :title="`Delete switch ${switchItem?.name}`"
    :text="`Are you sure you want to delete the switch ${switchItem?.name} from configuration?`"
    confirm-label="Delete Switch"
    @cancel="navigateTo('switch', { action: 'edit', switchIndex, deviceIndex })"
    @confirm="confirmDelete"
  />
</template>
