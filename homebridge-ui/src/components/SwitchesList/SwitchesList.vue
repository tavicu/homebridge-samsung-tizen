<script setup>
import { useSwitches } from './useSwitches';

const { switches, editSwitch, formatValue, getSwitchValues } = useSwitches();

function formatKey(key) {
  return key.replace(/_/g, ' ');
}
</script>

<template>
  <div v-if="switches.length > 0">
    <table class="table table-hover mb-0">
      <thead>
        <tr>
          <th>Name</th>
          <th>Value</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(switchItem, index) in switches" :key="index" class="align-middle">
          <td class="text-dark fw-semibold text-nowrap w-25">{{ switchItem.name }}</td>
          <td class="text-muted">
            <ul class="mb-0 small">
              <li v-for="(value, key) in getSwitchValues(switchItem)" :key="key" class="text-capitalize">
                <span class="text-dark">{{ formatKey(key) }}:</span>
                <span class="fw-semibold">{{ formatValue(value) }}</span>
              </li>
            </ul>
          </td>
          <td class="text-end">
            <button type="button" class="btn btn-primary" @click="editSwitch(index)">Edit</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-else class="card text-center mb-4 border-dashed">
    <div class="card-body">
      <h6 class="fw-semibold">No switches configured</h6>
      <p class="small">Add your first switch</p>

      <button type="button" class="btn btn-primary" @click="editSwitch(-1)">
        <i class="fas fa-plus"></i> Add your first switch
      </button>
    </div>
  </div>
</template>
