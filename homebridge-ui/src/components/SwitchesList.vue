<script setup>
import { computed } from 'vue';
import SwitchesIcon from '../assets/icons/switches.svg';
import Dropdown from './Dropdown.vue';
import EmptyState from './EmptyState.vue';
import { useConfig } from '../composables/useConfig';
import { useRouter } from '../composables/useRouter';

const props = defineProps({
  title: {
    type: String,
    default: 'Switches',
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
  <div class="card card-table shadow">
    <div class="card-header d-flex align-items-center justify-content-between gap-3">
      <div>
        <h6 class="fw-semibold mb-0">{{ title }}</h6>
        <p v-if="description" class="small text-secondary mb-0 mt-1">{{ description }}</p>
      </div>
      <button v-if="switches.length" type="button" class="btn btn-primary flex-shrink-0" @click="navigateTo('switch', { action: 'add', deviceIndex })"><i class="fas fa-plus" /> Add switch</button>
    </div>

    <table v-if="switches.length" class="table mb-0">
      <thead>
        <tr class="text-secondary">
          <th>Name</th>
          <th>Actions</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="(switchItem, index) in switches" :key="index" class="align-middle">
          <td class="text-body fw-semibold">{{ switchItem.name }}</td>

          <td>
            <ul class="mb-0 small">
              <li v-for="[key, value] in switchEntries(switchItem)" :key="key" class="text-capitalize">
                <span class="text-body">{{ formatKey(key) }}:</span>
                <span class="fw-semibold ms-1">{{ formatValue(value) }}</span>
              </li>
            </ul>
          </td>

          <td class="text-end">
            <Dropdown>
              <button class="dropdown-item" type="button" @click="navigateTo('switch', { action: 'edit', switchIndex: index, deviceIndex })"><i class="fas fa-pen" /> Edit</button>
              <button class="dropdown-item" type="button" @click="navigateTo('switch', { action: 'delete', switchIndex: index, deviceIndex })"><i class="fas fa-trash" /> Delete</button>
            </Dropdown>
          </td>
        </tr>
      </tbody>
    </table>

    <EmptyState
      v-else
      :icon="SwitchesIcon"
      title="No switches yet"
      description="You haven't added any switches yet. Add one to trigger TV actions from HomeKit scenes and automations."
      action-label="Add first switch"
      @action="navigateTo('switch', { action: 'add', deviceIndex })"
    />
  </div>
</template>
