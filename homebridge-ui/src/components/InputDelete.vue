<script setup>
import { computed, ref, watch } from 'vue';
import { useConfig } from '../composables/useConfig';
import { useRouter } from '../composables/useRouter';
import { useToast } from '../composables/useToast';
import Confirm from './Confirm.vue';

const props = defineProps({
  inputIndex: {
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

const inputs = computed(() => (props.deviceIndex !== undefined ? config.value?.devices?.[props.deviceIndex]?.inputs : config.value?.inputs) || []);
// Kept from when the screen opened: once the delete is saved, the index points at the next input.
const inputName = ref('');
const inputItem = computed(() => inputs.value[props.inputIndex]);

function goBack() {
  navigateBack(...parentRoute('inputs', props.deviceIndex));
}

async function confirmDelete() {
  try {
    await updateScoped(
      'inputs',
      props.deviceIndex,
      inputs.value.filter((_, index) => index !== props.inputIndex),
    );

    toast.success('Input deleted successfully.');

    // Going back could land on the edit screen of this index, which now holds the next input.
    navigateTo(...parentRoute('inputs', props.deviceIndex));
  } catch {
    toast.error('Failed to delete input');
  }
}

watch(
  () => [props.inputIndex, props.deviceIndex],
  () => {
    if (!inputItem.value) {
      toast.error('Input not found');
      goBack();
      return;
    }

    inputName.value = inputItem.value.name;
  },
  { immediate: true },
);
</script>

<template>
  <Confirm title="Delete input" confirm-label="Delete Input" @cancel="navigateBack('input', { action: 'edit', inputIndex, deviceIndex })" @confirm="confirmDelete">
    <p>
      Are you sure you want to delete the input <span class="fw-semibold">{{ inputName }}</span> from configuration?
    </p>
    <p>This action is irreversible. Confirming saves the plugin configuration immediately.</p>
  </Confirm>
</template>
