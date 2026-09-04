<script setup>
import { computed } from 'vue';
import TvIcon from '../assets/icons/tv.svg';
import { useConfig } from '../composables/useConfig';
import { useRouter } from '../composables/useRouter';
import Dropdown from './Dropdown.vue';
import EmptyState from './EmptyState.vue';

defineProps({
  title: {
    type: String,
    default: 'Devices',
  },
  description: {
    type: String,
    default: '',
  },
});

const { config } = useConfig();
const { navigateTo } = useRouter();

const devices = computed(() => config.value?.devices || []);
</script>

<template>
  <div class="card card-table shadow">
    <div class="card-header d-flex align-items-center justify-content-between gap-3">
      <div>
        <h6 class="fw-semibold mb-0">{{ title }}</h6>
        <p v-if="description" class="small text-secondary mb-0 mt-1">{{ description }}</p>
      </div>
      <button v-if="devices.length" type="button" class="btn btn-primary flex-shrink-0" @click="navigateTo('device', { action: 'add' })"><i class="fas fa-plus" /> Add device</button>
    </div>

    <table v-if="devices.length" class="table mb-0">
      <thead>
        <tr class="text-secondary">
          <th>Name</th>
          <th>IP Address</th>
          <th>MAC Address</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="(device, index) in devices" :key="index" class="align-middle">
          <td class="text-body fw-semibold">{{ device.name }}</td>
          <td class="">{{ device.ip }}</td>
          <td class="">{{ device.mac }}</td>
          <td class="text-end">
            <Dropdown>
              <button class="dropdown-item" type="button" @click="navigateTo('device', { action: 'edit', deviceIndex: index })"><i class="fas fa-pen" /> Edit</button>
              <button class="dropdown-item" type="button" @click="navigateTo('device', { action: 'delete', deviceIndex: index })"><i class="fas fa-trash" /> Delete</button>
            </Dropdown>
          </td>
        </tr>
      </tbody>
    </table>

    <EmptyState
      v-else
      :icon="TvIcon"
      title="No devices yet"
      description="You haven't added any TVs yet. Add one to start controlling it from Homebridge and the Home app."
      action-label="Add first device"
      @action="navigateTo('device', { action: 'add' })"
    />
  </div>
</template>
