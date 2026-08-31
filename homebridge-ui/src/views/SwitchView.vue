<script setup>
import { computed, onMounted, watch } from 'vue';
import SwitchDelete from '../components/SwitchDelete.vue';
import SwitchForm from '../components/SwitchForm.vue';
import { useHomebridge } from '../composables/useHomebridge';
import { useRouter } from '../composables/useRouter';
import { useToast } from '../composables/useToast';

const { currentParams, navigateTo } = useRouter();
const { disableSaveButton } = useHomebridge();
const toast = useToast();

const action = computed(() => currentParams.value?.action || 'add');
const switchIndex = computed(() => currentParams.value?.switchIndex);
const deviceIndex = computed(() => currentParams.value?.deviceIndex);

onMounted(() => {
  disableSaveButton();
});

watch(
  () => [action.value, switchIndex.value],
  ([currentAction, index]) => {
    if ((currentAction === 'edit' || currentAction === 'delete') && index === undefined) {
      toast.error('Switch not found');
      navigateTo('dashboard');
    }
  },
  { immediate: true },
);
</script>

<template>
  <SwitchDelete v-if="action === 'delete'" :switch-index="switchIndex" :device-index="deviceIndex" />
  <SwitchForm v-else :action="action" :switch-index="switchIndex" :device-index="deviceIndex" />
</template>
