<script setup>
import { useDevices } from './useDevices';

const { devices, editDevice } = useDevices();
</script>

<template>
  <div v-if="devices.length > 0">
    <table class="table table-hover mb-0">
      <thead>
        <tr>
          <th>Name</th>
          <th>IP Address</th>
          <th>MAC Address</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(device, index) in devices" :key="index" class="align-middle">
          <td class="text-dark fw-semibold">{{ device.name }}</td>
          <td class="text-muted">{{ device.ip }}</td>
          <td class="text-muted">{{ device.mac }}</td>
          <td class="text-end">
            <button type="button" class="btn btn-primary" @click="editDevice(index)">Edit</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-else class="card text-center mb-4 border-dashed">
    <div class="card-body">
      <h6 class="fw-semibold">No devices configured</h6>
      <p class="small">Add your first Samsung TV to get started with Homebridge control</p>

      <button type="button" class="btn btn-primary" @click="editDevice(-1)">
        <i class="fas fa-plus"></i> Add your first device
      </button>
    </div>
  </div>
</template>
