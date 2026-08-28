<script setup>
import { computed } from 'vue';
import { useConfig } from '../composables/useConfig';
import { useRouter } from '../composables/useRouter';

const { config } = useConfig();
const { navigateTo } = useRouter();

const devices = computed(() => config.value?.devices || []);
</script>

<template>
  <div v-if="devices.length > 0">
    <table class="table table-hover mb-0">
      <thead>
        <tr>
          <th>Name</th>
          <th>IP Address</th>
          <th>MAC Address</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="(device, index) in devices" :key="index" class="align-middle">
          <td class="text-dark fw-semibold">{{ device.name }}</td>
          <td class="text-muted">{{ device.ip }}</td>
          <td class="text-muted">{{ device.mac }}</td>
          <td class="text-end">
            <button type="button" class="btn btn-primary" @click="navigateTo('device', { action: 'edit', deviceIndex: index })">Edit</button>
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
