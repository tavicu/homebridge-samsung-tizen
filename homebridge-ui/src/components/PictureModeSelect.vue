<script setup>
import { computed, ref, watch } from 'vue';
import { useConfig } from '../composables/useConfig';
import { useSmartThings } from '../composables/useSmartThings';
import { DEFAULT_PICTURE_MODES } from '../lib/device';

const value = defineModel({
  type: String,
  required: true,
});

const props = defineProps({
  deviceIndex: {
    type: Number,
    default: undefined,
  },
});

const { config } = useConfig();
const { getPictureModes } = useSmartThings();
const fetched = ref([]);

const deviceId = computed(() => {
  const device = config.value.devices?.[props.deviceIndex];
  return device?.deviceId || device?.device_id;
});

// The picture modes the TV reports, or the common ones when it reports none, plus the current value when it is not among them.
const modes = computed(() => {
  const list = fetched.value.length ? fetched.value : DEFAULT_PICTURE_MODES;

  if (value.value && !list.some((mode) => mode.id === value.value)) {
    return [...list, { id: value.value, name: value.value }];
  }

  return list;
});

watch(
  deviceId,
  async (id) => {
    fetched.value = await getPictureModes(id);
  },
  { immediate: true },
);
</script>

<template>
  <select v-model="value" class="form-select">
    <option value="">None</option>
    <option v-for="mode in modes" :key="mode.id" :value="mode.id">{{ mode.name }}</option>
  </select>
</template>
