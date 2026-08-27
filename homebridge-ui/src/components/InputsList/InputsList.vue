<script setup>
import { useInputs } from './useInputs';

const { inputs, editInput, formatValue } = useInputs();
</script>

<template>
  <div v-if="inputs.length > 0">
    <table class="table table-hover mb-0">
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Value</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(input, index) in inputs" :key="index" class="align-middle">
          <td class="text-dark fw-semibold text-nowrap w-25">{{ input.name }}</td>
          <td class="text-muted text-capitalize">{{ input.type }}</td>
          <td class="text-muted">{{ formatValue(input.value) }}</td>
          <td class="text-end">
            <button type="button" class="btn btn-primary" @click="editInput(index)">Edit</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-else class="card text-center mb-4 border-dashed">
    <div class="card-body">
      <h6 class="fw-semibold">No inputs configured</h6>
      <p class="small">Add your first input</p>

      <button type="button" class="btn btn-primary" @click="editInput(-1)">
        <i class="fas fa-plus"></i> Add your first input
      </button>
    </div>
  </div>
</template>
