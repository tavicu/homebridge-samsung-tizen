<script setup>
import { computed } from 'vue';
import InputsIcon from '../assets/icons/inputs.svg';
import { useConfig } from '../composables/useConfig';
import { useRouter } from '../composables/useRouter';
import { useToast } from '../composables/useToast';
import DocsLink from './DocsLink.vue';
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

const { config, updateScoped } = useConfig();
const { navigateTo } = useRouter();
const toast = useToast();

const inputs = computed(() => {
  if (props.deviceIndex !== undefined && config.value?.devices?.[props.deviceIndex]) {
    return config.value.devices[props.deviceIndex].inputs || [];
  }

  return config.value?.inputs || [];
});

const formatValue = (input) => {
  if (input.type === 'artmode') {
    return '';
  }

  return Array.isArray(input.value) ? input.value.join(', ') : input.value || 'N/A';
};

async function move(index, offset) {
  const items = [...inputs.value];
  [items[index], items[index + offset]] = [items[index + offset], items[index]];

  try {
    await updateScoped('inputs', props.deviceIndex, items);
  } catch {
    toast.error('Failed to move input');
  }
}
</script>

<template>
  <div class="card shadow">
    <div class="card-header d-flex align-items-center justify-content-between gap-3 bg-transparent">
      <div>
        <h6 class="fw-semibold mb-0">{{ title }} <DocsLink path="inputs" /></h6>
        <p v-if="description" class="small text-secondary mt-1">{{ description }}</p>
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
            <Tooltip :text="formatValue(input)">
              <span class="text-abbr text-capitalize">{{ input.type }}</span>
            </Tooltip>
          </td>
          <td class="text-end">
            <Dropdown>
              <button class="dropdown-item" type="button" @click="navigateTo('input', { action: 'edit', inputIndex: index, deviceIndex })"><i class="fas fa-pen" /> Edit</button>
              <button class="dropdown-item" type="button" @click="navigateTo('input', { action: 'delete', inputIndex: index, deviceIndex })">
                <i class="fas fa-trash" /> Delete
              </button>
              <template v-if="inputs.length > 1">
                <button class="dropdown-item" type="button" :disabled="index === 0" @click="move(index, -1)"><i class="fas fa-arrow-right fa-rotate-270" /> Move up</button>
                <button class="dropdown-item" type="button" :disabled="index === inputs.length - 1" @click="move(index, 1)">
                  <i class="fas fa-arrow-right fa-rotate-90" /> Move down
                </button>
              </template>
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
