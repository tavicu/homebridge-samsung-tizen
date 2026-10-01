<script setup>
import { computed, useSlots } from 'vue';
import { docsUrl } from '../lib/docs';
import Tooltip from './Tooltip.vue';

const props = defineProps({
  path: {
    type: String,
    default: '',
  },
});

const slots = useSlots();
const href = computed(() => docsUrl(props.path));
</script>

<template>
  <a v-if="slots.default" :href="href" target="_blank" rel="noopener noreferrer" class="docs-link-text"><slot /></a>
  <Tooltip v-else text="Open documentation" class="docs-link">
    <a :href="href" target="_blank" rel="noopener noreferrer" class="docs-link-icon" aria-label="Open documentation">
      <i class="fas fa-circle-question" />
    </a>
  </Tooltip>
</template>

<style scoped>
.docs-link {
  margin-left: 0.3rem;
  font-size: 0.85em;
  vertical-align: baseline;
}

.form-label > .docs-link {
  margin-left: 0;
}

.docs-link-icon {
  color: inherit;
  opacity: 0.45;
  text-decoration: none;
  transition: opacity 0.15s ease;
}

.docs-link-icon:hover,
.docs-link-icon:focus-visible {
  opacity: 1;
}

.docs-link-text {
  white-space: nowrap;
}
</style>
