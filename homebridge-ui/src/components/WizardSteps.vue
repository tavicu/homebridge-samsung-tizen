<script setup>
import { computed } from 'vue';

const props = defineProps({
  steps: {
    type: Array,
    required: true,
  },
  current: {
    type: Number,
    required: true,
  },
  outcome: {
    type: String,
    default: null,
  },
});

const LABELS = {
  upcoming: 'Locked',
  current: 'In progress',
  completed: 'Completed',
  success: 'Success',
  error: 'Failed',
};

const ICONS = {
  completed: 'fa-check',
  success: 'fa-check',
  error: 'fa-times',
};

const resolvedSteps = computed(() =>
  props.steps.map((step, index) => {
    const item = typeof step === 'string' ? { title: step } : step;
    const id = index + 1;
    let status = 'upcoming';

    if (id < props.current) {
      status = 'completed';
    } else if (id === props.current) {
      status = props.outcome === 'success' || props.outcome === 'error' ? props.outcome : 'current';
    }

    return {
      title: item.title,
      status,
      caption: { ...LABELS, ...item.labels }[status],
      number: id,
    };
  }),
);
</script>

<template>
  <div class="wizard-steps d-flex align-items-center gap-3">
    <template v-for="(step, index) in resolvedSteps" :key="index">
      <div class="d-flex align-items-center flex-column flex-sm-row gap-2" :class="`is-${step.status}`">
        <span class="wizard-marker">
          <i v-if="ICONS[step.status]" class="fas" :class="ICONS[step.status]" />
          <template v-else>{{ step.number }}</template>
        </span>
        <span class="d-flex flex-column align-items-center align-items-sm-start min-w-0">
          <span class="wizard-title">{{ step.title }}</span>
          <span class="wizard-caption">{{ step.caption }}</span>
        </span>
      </div>
      <div v-if="index < resolvedSteps.length - 1" class="wizard-connector" :class="{ 'is-done': step.status === 'completed' || step.status === 'success' }" />
    </template>
  </div>
</template>

<style scoped>
.wizard-steps {
  --wizard-border: #e3e8f2;
  --wizard-marker: #fff;
  --wizard-primary: var(--bs-primary);
  --wizard-secondary: rgb(from var(--bs-secondary-color) r g b / 50%);
  --wizard-marker-text: var(--wizard-secondary);
}

.dark-mode .wizard-steps {
  --wizard-border: #6a6a6a;
  --wizard-marker: var(--bs-body-color);
  --wizard-secondary: var(--bs-secondary-color);
  --wizard-marker-text: rgba(33, 37, 41, 0.75);
}

.wizard-marker {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1;
  color: var(--wizard-marker-text);
  background: var(--wizard-marker);
  border: 3px solid var(--wizard-border);
}

.wizard-title {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.2;
  color: var(--bs-body-color);
}

.wizard-caption {
  margin-top: 0.1rem;
  font-size: 0.75rem;
  line-height: 1.2;
  color: var(--wizard-secondary);
}

.wizard-connector {
  flex: 1 1 1.25rem;
  height: 2px;
  min-width: 0.75rem;
  background: var(--wizard-border);
  border-radius: 99px;
}

.wizard-connector.is-done {
  background: var(--wizard-primary);
}

.is-current .wizard-marker {
  border-color: var(--wizard-primary);
  color: var(--wizard-primary);
  box-shadow: 0 0 0 3px var(--wizard-border);
}

.dark-mode .is-current .wizard-marker {
  color: var(--wizard-marker-text);
  box-shadow: none;
}

.is-upcoming .wizard-title {
  color: var(--wizard-secondary);
}

.is-completed .wizard-marker {
  background: var(--wizard-primary);
  border-color: var(--wizard-primary);
  color: var(--bs-white);
}

.is-success .wizard-marker {
  background: var(--bs-success);
  border-color: var(--bs-success);
  color: var(--bs-white);
}

.is-error .wizard-marker {
  background: var(--bs-danger);
  border-color: var(--bs-danger);
  color: var(--bs-white);
}
</style>
