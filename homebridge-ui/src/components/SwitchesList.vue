<script setup>
import { computed } from 'vue';
import SwitchesIcon from '../assets/icons/switches.svg';
import { useApps } from '../composables/useApps';
import { useConfig } from '../composables/useConfig';
import { useRouter } from '../composables/useRouter';
import { useToast } from '../composables/useToast';
import { DEFAULT_INPUT_SOURCES, DEFAULT_PICTURE_MODES, DEFAULT_SOUND_MODES } from '../lib/device';
import DocsLink from './DocsLink.vue';
import Dropdown from './Dropdown.vue';
import EmptyState from './EmptyState.vue';

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

const { config, updateScoped } = useConfig();
const { navigateTo } = useRouter();
const toast = useToast();
const apps = useApps(() => props.deviceIndex);

const switches = computed(() => {
  if (props.deviceIndex !== undefined && config.value?.devices?.[props.deviceIndex]) {
    return config.value.devices[props.deviceIndex].switches || [];
  }

  return config.value?.switches || [];
});

// Ids missing from the default lists (custom modes, other sources) are shown as they are.
const findName = (items, id) => items.find((item) => String(item.id) === String(id))?.name ?? id;

// One summary line per action, in the order the switch form lists them.
const ACTIONS = {
  power: (value) => (value ? { label: 'Power on first' } : null),
  mute: (value) => ({ label: value ? 'Mute' : 'Unmute' }),
  sleep: (value) => ({ label: 'Sleep', value: `${value} min` }),
  volume: (value) => ({ label: 'Volume', value }),
  app: (value) => ({ label: 'App', value: findName(apps.value, value) }),
  channel: (value) => ({ label: 'Channel', value }),
  input: (value) => ({ label: 'Input', value: findName(DEFAULT_INPUT_SOURCES, value) }),
  picture_mode: (value) => ({ label: 'Picture', value: findName(DEFAULT_PICTURE_MODES, value) }),
  sound_mode: (value) => ({ label: 'Sound', value: findName(DEFAULT_SOUND_MODES, value) }),
  command: (value) => ({ label: 'Keys', value: Array.isArray(value) ? value.join(', ') : value }),
};

const switchActions = (switchItem) =>
  Object.entries(ACTIONS)
    .filter(([key]) => switchItem[key] !== undefined && switchItem[key] !== null && switchItem[key] !== '')
    .map(([key, format]) => ({ key, ...format(switchItem[key]) }))
    .filter((action) => action.label);

async function move(index, offset) {
  const items = [...switches.value];
  [items[index], items[index + offset]] = [items[index + offset], items[index]];

  try {
    await updateScoped('switches', props.deviceIndex, items);
  } catch {
    toast.error('Failed to move switch');
  }
}
</script>

<template>
  <div class="card shadow">
    <div class="card-header d-flex align-items-center justify-content-between gap-3 bg-transparent">
      <div>
        <h6 class="fw-semibold mb-0">{{ title }} <DocsLink path="switches" /></h6>
        <p v-if="description" class="small text-secondary mt-1">{{ description }}</p>
      </div>
      <button v-if="switches.length" type="button" class="btn btn-primary flex-shrink-0" @click="navigateTo('switch', { action: 'add', deviceIndex })">
        <i class="fas fa-plus" /> Add switch
      </button>
    </div>

    <table v-if="switches.length" class="table mb-0">
      <thead>
        <tr class="text-secondary">
          <th>Name</th>
          <th class="d-xs-none">Actions</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="(switchItem, index) in switches" :key="index" class="align-middle">
          <td class="text-body fw-semibold">{{ switchItem.name }}</td>

          <td class="d-xs-none">
            <ul class="mb-0 small">
              <li v-for="action in switchActions(switchItem)" :key="action.key">
                <span class="text-body">{{ action.label }}<template v-if="action.value != null">:</template></span>
                <span v-if="action.value != null" class="fw-semibold ms-1">{{ action.value }}</span>
              </li>
            </ul>
          </td>

          <td class="text-end">
            <Dropdown>
              <button class="dropdown-item" type="button" @click="navigateTo('switch', { action: 'edit', switchIndex: index, deviceIndex })"><i class="fas fa-pen" /> Edit</button>
              <button class="dropdown-item" type="button" @click="navigateTo('switch', { action: 'delete', switchIndex: index, deviceIndex })">
                <i class="fas fa-trash" /> Delete
              </button>
              <template v-if="switches.length > 1">
                <button class="dropdown-item" type="button" :disabled="index === 0" @click="move(index, -1)"><i class="fas fa-arrow-right fa-rotate-270" /> Move up</button>
                <button class="dropdown-item" type="button" :disabled="index === switches.length - 1" @click="move(index, 1)">
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
      :icon="SwitchesIcon"
      title="No switches yet"
      description="You haven't added any switches yet. Add one to trigger TV actions from HomeKit scenes and automations."
      action-label="Add first switch"
      @action="navigateTo('switch', { action: 'add', deviceIndex })"
    />
  </div>
</template>
