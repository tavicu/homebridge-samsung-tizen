<script setup>
import { computed, ref, watch } from 'vue';
import { useConfig } from '../composables/useConfig';
import { useSmartThings } from '../composables/useSmartThings';
import { groupInputSources } from '../lib/device';

const value = defineModel({
  type: String,
  required: true,
});

const props = defineProps({
  deviceIndex: {
    type: Number,
    default: undefined,
  },
  placeholder: {
    type: String,
    default: 'None',
  },
  required: {
    type: Boolean,
    default: false,
  },
});

const { config } = useConfig();
const { getInputSources } = useSmartThings();
const sources = ref([]);

const deviceId = computed(() => {
  const device = config.value.devices?.[props.deviceIndex];
  return device?.deviceId || device?.device_id;
});

// Sources the TV reports come first; the defaults it did not report, and an unknown current value, go under Other.
const grouped = computed(() => groupInputSources(sources.value, value.value));

watch(
  deviceId,
  async (id) => {
    sources.value = await getInputSources(id);

    // Older configs use digitalTv for the source the TV reports as dtv.
    if (grouped.value.value !== value.value) {
      value.value = grouped.value.value;
    }
  },
  { immediate: true },
);
</script>

<template>
  <select v-model="value" class="form-select" :required="required">
    <option value="" :disabled="required">{{ placeholder }}</option>
    <template v-if="grouped.available.length">
      <optgroup label="Available">
        <option v-for="source in grouped.available" :key="source.id" :value="source.id">{{ source.name }}</option>
      </optgroup>
      <optgroup v-if="grouped.other.length" label="Other">
        <option v-for="source in grouped.other" :key="source.id" :value="source.id">{{ source.name }}</option>
      </optgroup>
    </template>
    <template v-else>
      <option v-for="source in grouped.other" :key="source.id" :value="source.id">{{ source.name }}</option>
    </template>
  </select>
</template>
