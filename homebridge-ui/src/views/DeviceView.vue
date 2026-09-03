<script setup>
import { computed, onMounted, watch } from 'vue';
import DeviceDelete from '../components/DeviceDelete.vue';
import DeviceForm from '../components/DeviceForm.vue';
import { useHomebridge } from '../composables/useHomebridge';
import { useRouter } from '../composables/useRouter';
import { useToast } from '../composables/useToast';

const { currentParams, navigateTo } = useRouter();
const { disableSaveButton, hideModalFooter } = useHomebridge();
const toast = useToast();

const action = computed(() => currentParams.value?.action || 'add');
const deviceIndex = computed(() => currentParams.value?.deviceIndex);

onMounted(() => {
  hideModalFooter();
  disableSaveButton();
});

watch(
  () => [action.value, deviceIndex.value],
  ([currentAction, index]) => {
    if ((currentAction === 'edit' || currentAction === 'delete') && index === undefined) {
      toast.error('Device not found');
      navigateTo('dashboard', { tab: 'devices' });
    }
  },
  { immediate: true },
);
</script>

<template>
  <DeviceDelete v-if="action === 'delete'" :device-index="deviceIndex" />
  <DeviceForm v-else :action="action" :device-index="deviceIndex" />
</template>
