<script setup>
import { computed, onMounted, watch } from 'vue';
import InputDelete from '../components/InputDelete.vue';
import InputForm from '../components/InputForm.vue';
import { useHomebridge } from '../composables/useHomebridge';
import { useRouter } from '../composables/useRouter';
import { useToast } from '../composables/useToast';

const { currentParams, navigateTo } = useRouter();
const { disableSaveButton, hideModalFooter } = useHomebridge();
const toast = useToast();

const action = computed(() => currentParams.value?.action || 'add');
const inputIndex = computed(() => currentParams.value?.inputIndex);
const deviceIndex = computed(() => currentParams.value?.deviceIndex);

onMounted(() => {
  hideModalFooter();
  disableSaveButton();
});

watch(
  () => [action.value, inputIndex.value],
  ([currentAction, index]) => {
    if ((currentAction === 'edit' || currentAction === 'delete') && index === undefined) {
      toast.error('Input not found');
      navigateTo('dashboard', { tab: 'inputs' });
    }
  },
  { immediate: true },
);
</script>

<template>
  <InputDelete v-if="action === 'delete'" :input-index="inputIndex" :device-index="deviceIndex" />
  <InputForm v-else :action="action" :input-index="inputIndex" :device-index="deviceIndex" />
</template>
