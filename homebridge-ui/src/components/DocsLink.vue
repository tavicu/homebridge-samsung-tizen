<script setup>
import { computed, useSlots } from 'vue';
import { docsUrl } from '../lib/docs';

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
  <a v-else :href="href" target="_blank" rel="noopener noreferrer" class="docs-link" title="Open documentation" aria-label="Open documentation">
    <i class="fas fa-circle-question" />
  </a>
</template>

<style scoped>
.docs-link {
  display: inline-block;
  margin-left: 0.3rem;
  font-size: 0.85em;
  color: inherit;
  opacity: 0.45;
  text-decoration: none;
  vertical-align: baseline;
  transition: opacity 0.15s ease;
}

.form-label > .docs-link {
  margin-left: 0;
}

.docs-link:hover,
.docs-link:focus-visible {
  opacity: 1;
}

.docs-link-text {
  white-space: nowrap;
}
</style>
