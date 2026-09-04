<script setup>
import { computed } from 'vue';
import { useConfig } from '../composables/useConfig';
import { useRouter } from '../composables/useRouter';
import Dropdown from './Dropdown.vue';

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
  <div v-if="devices.length > 0" class="card card-table shadow">
    <div class="card-header d-flex align-items-center justify-content-between gap-3">
      <div>
        <h6 class="fw-semibold mb-0">{{ title }}</h6>
        <p v-if="description" class="small text-secondary mb-0 mt-1">{{ description }}</p>
      </div>
      <button type="button" class="btn btn-primary flex-shrink-0" @click="navigateTo('device', { action: 'add' })"><i class="fas fa-plus" /> Add device</button>
    </div>

    <table class="table mb-0">
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
  </div>

  <div v-else class="card text-center mb-4 border-dashed">
    <div class="card-body">
      <h6 class="fw-semibold">No devices configured</h6>
      <p class="small">Add your first Samsung TV to get started with Homebridge control</p>

      <button type="button" class="btn btn-primary" @click="navigateTo('device', { action: 'add' })"><i class="fas fa-plus" /> Add your first device</button>
    </div>
  </div>
</template>
