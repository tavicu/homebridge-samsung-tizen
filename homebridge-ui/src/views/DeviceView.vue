<script setup>
import { computed, onMounted, watch } from 'vue';
import DeviceDelete from '../components/DeviceDelete.vue';
import DeviceForm from '../components/DeviceForm.vue';
import { useRouter } from '../composables/useRouter';
import { useHomebridge } from '../composables/useHomebridge';
import { useToast } from '../composables/useToast';

const { currentParams, navigateTo } = useRouter();
const { disableSaveButton } = useHomebridge();
const toast = useToast();

const action = computed(() => currentParams.value?.action || 'add');
const deviceIndex = computed(() => currentParams.value?.deviceIndex);

onMounted(() => {
  disableSaveButton();
});

watch(
  () => [action.value, deviceIndex.value],
  ([currentAction, index]) => {
    if ((currentAction === 'edit' || currentAction === 'delete') && index === undefined) {
      toast.error('Device not found');
      navigateTo('dashboard');
    }
  },
  { immediate: true },
);
</script>

<template>
  <DeviceDelete v-if="action === 'delete'" :device-index="deviceIndex" />
  <DeviceForm v-else :action="action" :device-index="deviceIndex" />
</template>
