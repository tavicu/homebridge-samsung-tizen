<script setup>
import SwitchDelete from './SwitchDelete.vue';
import SwitchForm from './SwitchForm.vue';
import { useSwitchPage } from './useSwitchPage';

const { mode, form, validated, currentSwitch, isDeviceScoped, submit, goBack, goToDelete, goToEdit, confirmDelete, addCommand, removeCommand } =
  useSwitchPage();

function handleInvalid() {
  validated.value = true;
}
</script>

<template>
  <SwitchDelete v-if="mode === 'delete'" :name="currentSwitch?.name" @cancel="goToEdit" @confirm="confirmDelete" />

  <SwitchForm
    v-else
    :form="form"
    :is-edit="mode === 'edit'"
    :is-device-scoped="isDeviceScoped"
    :validated="validated"
    @submit="submit"
    @invalid="handleInvalid"
    @cancel="goBack"
    @delete="goToDelete"
    @add-command="addCommand"
    @remove-command="removeCommand"
  />
</template>
