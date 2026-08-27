<script setup>
import InputDelete from './InputDelete.vue';
import InputForm from './InputForm.vue';
import { useInputPage } from './useInputPage';

const { mode, form, validated, currentInput, isDeviceScoped, submit, goBack, goToDelete, goToEdit, confirmDelete, addCommand, removeCommand } =
  useInputPage();

function handleInvalid() {
  validated.value = true;
}
</script>

<template>
  <InputDelete v-if="mode === 'delete'" :name="currentInput?.name" @cancel="goToEdit" @confirm="confirmDelete" />

  <InputForm
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
