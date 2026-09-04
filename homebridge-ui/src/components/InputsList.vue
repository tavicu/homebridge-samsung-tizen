<script setup>
import { computed } from 'vue';
import InputsIcon from '../assets/icons/inputs.svg';
import { useConfig } from '../composables/useConfig';
import { useRouter } from '../composables/useRouter';
import Dropdown from './Dropdown.vue';
import EmptyState from './EmptyState.vue';
import Tooltip from './Tooltip.vue';

const props = defineProps({
  title: {
    type: String,
    default: 'Inputs',
  },
  description: {
    type: String,
    default: '',
  },
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
  <div class="card card-table shadow">
    <div class="card-header d-flex align-items-center justify-content-between gap-3">
      <div>
        <h6 class="fw-semibold mb-0">{{ title }}</h6>
        <p v-if="description" class="small text-secondary mb-0 mt-1">{{ description }}</p>
      </div>
      <button v-if="inputs.length" type="button" class="btn btn-primary flex-shrink-0" @click="navigateTo('input', { action: 'add', deviceIndex })">
        <i class="fas fa-plus" /> Add input
      </button>
    </div>

    <table v-if="inputs.length" class="table mb-0">
      <thead>
        <tr class="text-secondary">
          <th>Name</th>
          <th>Type</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="(input, index) in inputs" :key="index" class="align-middle">
          <td class="text-body fw-semibold">{{ input.name }}</td>
          <td>
            <Tooltip :text="formatValue(input.value)">
              <span class="text-abbr text-capitalize">{{ input.type }}</span>
            </Tooltip>
          </td>
          <td class="text-end">
            <Dropdown>
              <button class="dropdown-item" type="button" @click="navigateTo('input', { action: 'edit', inputIndex: index, deviceIndex })"><i class="fas fa-pen" /> Edit</button>
              <button class="dropdown-item" type="button" @click="navigateTo('input', { action: 'delete', inputIndex: index, deviceIndex })">
                <i class="fas fa-trash" /> Delete
              </button>
            </Dropdown>
          </td>
        </tr>
      </tbody>
    </table>

    <EmptyState
      v-else
      :icon="InputsIcon"
      title="No inputs yet"
      description="You haven't added any inputs yet. Add one and it will show up as a source you can select from the Home app."
      action-label="Add first input"
      @action="navigateTo('input', { action: 'add', deviceIndex })"
    />
  </div>
</template>
