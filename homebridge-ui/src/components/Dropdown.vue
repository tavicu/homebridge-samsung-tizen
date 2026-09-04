<script>
const openDropdowns = new Set();
</script>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

const open = ref(false);

function close() {
  open.value = false;
}

function toggle(event) {
  event.stopPropagation();
  const next = !open.value;
  openDropdowns.forEach((fn) => fn());
  open.value = next;
}

onMounted(() => {
  openDropdowns.add(close);
  document.addEventListener('click', close);
});

onUnmounted(() => {
  openDropdowns.delete(close);
  document.removeEventListener('click', close);
});
</script>

<template>
  <div class="dropdown d-inline-block">
    <button type="button" class="btn btn-sm btn-icon-only" :class="{ active: open }" @click="toggle">
      <slot name="toggle">
        <i class="fas fa-ellipsis-v" />
      </slot>
    </button>
    <div class="dropdown-menu shadow" :class="{ show: open }">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.dropdown-menu {
  --bs-dropdown-min-width: 8rem;
  --bs-dropdown-font-size: 0.875rem;
  --bs-dropdown-padding-y: 0.25rem;
  --bs-dropdown-item-padding-x: 0.75rem;
  --bs-dropdown-border-color: rgba(0, 0, 0, 0.075);
  top: 50%;
  right: 100%;
  left: auto;
  margin-right: 5px;
  transform: translateY(-50%);
}

.dropdown-menu :deep(i) {
  opacity: 0.7;
  margin-right: 0.25rem;
}
</style>
