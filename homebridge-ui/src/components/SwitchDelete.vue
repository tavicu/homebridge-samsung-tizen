<script setup>
import { computed, ref, watch } from 'vue';
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

const { config, updateScoped } = useConfig();
const { navigateTo, navigateBack, parentRoute } = useRouter();
const toast = useToast();

const switches = computed(() => (props.deviceIndex !== undefined ? config.value?.devices?.[props.deviceIndex]?.switches : config.value?.switches) || []);
// Kept from when the screen opened: once the delete is saved, the index points at the next switch.
const switchName = ref('');
const switchItem = computed(() => switches.value[props.switchIndex]);

function goBack() {
  navigateBack(...parentRoute('switches', props.deviceIndex));
}

async function confirmDelete() {
  try {
    await updateScoped(
      'switches',
      props.deviceIndex,
      switches.value.filter((_, index) => index !== props.switchIndex),
    );

    toast.success('Switch deleted successfully.');

    // Going back could land on the edit screen of this index, which now holds the next switch.
    navigateTo(...parentRoute('switches', props.deviceIndex));
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
      return;
    }

    switchName.value = switchItem.value.name;
  },
  { immediate: true },
);
</script>

<template>
  <Confirm title="Delete switch" confirm-label="Delete Switch" @cancel="navigateBack('switch', { action: 'edit', switchIndex, deviceIndex })" @confirm="confirmDelete">
    <p>
      Are you sure you want to delete the switch <span class="fw-semibold">{{ switchName }}</span> from configuration?
    </p>
    <p>This action is irreversible. Confirming saves the plugin configuration immediately.</p>
  </Confirm>
</template>
