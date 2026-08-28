<script setup>
import { computed } from 'vue';
import { useConfig } from '../composables/useConfig';
import { useRouter } from '../composables/useRouter';

const props = defineProps({
  deviceIndex: {
    type: Number,
    default: undefined,
  },
});

const { config } = useConfig();
const { navigateTo } = useRouter();

const switches = computed(() => {
  if (props.deviceIndex !== undefined && config.value?.devices?.[props.deviceIndex]) {
    return config.value.devices[props.deviceIndex].switches || [];
  }

  return config.value?.switches || [];
});

const VALID_KEYS = ['power', 'sleep', 'mute', 'volume', 'app', 'input', 'channel', 'picture_mode', 'command'];

const switchEntries = (switchItem) => Object.entries(switchItem).filter(([key]) => VALID_KEYS.includes(key));

const formatKey = (key) => key.replace('_', ' ');

const formatValue = (value) => (Array.isArray(value) ? value.join(', ') : value || 'N/A');
</script>

<template>
  <div v-if="switches.length > 0">
    <table class="table table-hover mb-0">
      <thead>
        <tr>
          <th>Name</th>
          <th>Value</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="(switchItem, index) in switches" :key="index" class="align-middle">
          <td class="text-dark fw-semibold text-nowrap w-25">{{ switchItem.name }}</td>

          <td class="text-muted">
            <ul class="mb-0 small">
              <li v-for="[key, value] in switchEntries(switchItem)" :key="key" class="text-capitalize">
                <span class="text-dark">{{ formatKey(key) }}:</span>
                <span class="fw-semibold ms-1">{{ formatValue(value) }}</span>
              </li>
            </ul>
          </td>

          <td class="text-end">
            <button type="button" class="btn btn-primary" @click="navigateTo('switch', { action: 'edit', switchIndex: index, deviceIndex })">Edit</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-else class="card text-center mb-4 border-dashed">
    <div class="card-body">
      <h6 class="fw-semibold">No switches configured</h6>
      <p class="small">Add your first switch</p>

      <button type="button" class="btn btn-primary" @click="navigateTo('switch', { action: 'add', deviceIndex })"><i class="fas fa-plus" /> Add your first switch</button>
    </div>
  </div>
</template>
