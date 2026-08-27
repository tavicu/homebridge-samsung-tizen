<script setup>
import DeviceDelete from './DeviceDelete.vue';
import DeviceForm from './DeviceForm.vue';
import { useDevicePage } from './useDevicePage';

const { mode, form, validated, currentDevice, submit, goBack, goToDelete, goToEdit, confirmDelete } = useDevicePage();

function handleInvalid() {
  validated.value = true;
}
</script>

<template>
  <DeviceDelete v-if="mode === 'delete'" :name="currentDevice?.name" @cancel="goToEdit" @confirm="confirmDelete" />

  <DeviceForm
    v-else
    :form="form"
    :is-edit="mode === 'edit'"
    :validated="validated"
    @submit="submit"
    @invalid="handleInvalid"
    @cancel="goBack"
    @delete="goToDelete"
  />
</template>
