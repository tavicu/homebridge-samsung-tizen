<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from '../composables/useRouter';

const props = defineProps({
  tabs: {
    type: Array,
    required: true,
  },
});

const { currentParams } = useRouter();
const tablist = ref(null);
const ink = ref(null);

const currentTab = computed({
  get() {
    const tab = currentParams.value?.tab;

    if (props.tabs.some((item) => item.id === tab)) {
      return tab;
    }

    return props.tabs[0]?.id;
  },
  set(id) {
    currentParams.value = {
      ...currentParams.value,
      tab: id,
    };
  },
});

function updateInk() {
  const tab = tablist.value?.querySelector('[aria-selected="true"]');

  if (!tab || !ink.value) {
    return;
  }

  ink.value.style.left = `${tab.offsetLeft}px`;
  ink.value.style.width = `${tab.offsetWidth}px`;
}

watch(
  currentTab,
  (tab) => {
    if (tab && currentParams.value?.tab !== tab) {
      currentTab.value = tab;
    }

    nextTick(updateInk);
  },
  { immediate: true },
);

let observer;

onMounted(() => {
  observer = new ResizeObserver(updateInk);
  observer.observe(tablist.value);
});

onUnmounted(() => observer?.disconnect());
</script>

<template>
  <div ref="tablist" class="hst-tablist d-flex gap-1 mb-4 position-relative" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      role="tab"
      :aria-selected="currentTab === tab.id"
      @click="currentTab = tab.id"
    >
      {{ tab.label }}
    </button>
    <span ref="ink" class="hst-tab-ink" />
  </div>

  <slot :current-tab="currentTab" />
</template>

<style scoped>
.hst-tablist {
  border-bottom: 2px solid var(--bs-border-color);
}

.hst-tablist button {
  appearance: none;
  border: 0;
  background: none;
  box-shadow: none;
  padding: 0.7rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.25;
  color: var(--bs-secondary-color);
  text-transform: none;
  cursor: pointer;
  transition: color 0.15s;
}

.hst-tablist button:hover {
  color: var(--bs-body-color);
}

.hst-tablist button[aria-selected='true'] {
  color: var(--bs-primary);
}

.hst-tab-ink {
  position: absolute;
  bottom: -2px;
  height: 2.5px;
  background: var(--bs-primary);
  border-radius: 99px;
  pointer-events: none;
  transition:
    left 0.25s cubic-bezier(0.4, 0.1, 0.2, 1),
    width 0.25s cubic-bezier(0.4, 0.1, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  .hst-tab-ink {
    transition: none;
  }
}

.dark-mode .hst-tablist {
  border-bottom-color: rgba(255, 255, 255, 0.15);
}

.dark-mode .hst-tablist button {
  color: rgba(255, 255, 255, 0.55);
}

.dark-mode .hst-tablist button:hover {
  color: #fff;
}
</style>
