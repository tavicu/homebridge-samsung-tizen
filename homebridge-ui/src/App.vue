<script setup>
import { computed } from 'vue';
import { useRouter } from './composables/useRouter';
import DashboardView from './views/DashboardView.vue';

const { currentView } = useRouter();

const routes = {
  dashboard: DashboardView,
};

const activeComponent = computed(() => routes[currentView.value]);
</script>

<template>
  <component :is="activeComponent" />
</template>

<style>
.border-dashed {
  border-style: dashed;
}
</style>
