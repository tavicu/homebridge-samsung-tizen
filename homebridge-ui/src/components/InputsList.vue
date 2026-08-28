<script setup>
import { computed } from 'vue';
import Tooltip from '../components/Tooltip.vue';
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

const inputs = computed(() => {
  if (props.deviceIndex !== undefined && config.value?.devices?.[props.deviceIndex]) {
    return config.value.devices[props.deviceIndex].inputs || [];
  }

  return config.value?.inputs || [];
});

const formatValue = (value) => (Array.isArray(value) ? value.join(', ') : value || 'N/A');
</script>

<template>
  <div v-if="inputs.length > 0">
    <table class="table table-hover mb-0">
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="(input, index) in inputs" :key="index" class="align-middle">
          <td class="text-dark fw-semibold text-nowrap w-25">{{ input.name }}</td>
          <td class="text-muted">
            <Tooltip :text="formatValue(input.value)">
              <span class="text-abbr text-capitalize">{{ input.type }}</span>
            </Tooltip>
          </td>
          <td class="text-end">
            <button type="button" class="btn btn-primary" @click="navigateTo('input', { action: 'edit', inputIndex: index, deviceIndex })">Edit</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-else class="card text-center mb-4 border-dashed">
    <div class="card-body">
      <h6 class="fw-semibold">No inputs configured</h6>
      <p class="small">Add your first input</p>

      <button type="button" class="btn btn-primary" @click="navigateTo('input', { action: 'add', deviceIndex })"><i class="fas fa-plus" /> Add your first input</button>
    </div>
  </div>
</template>
