import { computed, reactive, ref } from 'vue';

const SKIP_INPUT_TYPES = new Set(['checkbox', 'radio', 'file', 'button', 'submit', 'reset', 'hidden', 'image']);

function canTrim(element) {
  return (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) && !SKIP_INPUT_TYPES.has(element.type) && !element.readOnly && !element.disabled;
}

function trimFormValues(form) {
  if (!form) {
    return;
  }

  for (const element of form.elements) {
    if (!canTrim(element)) {
      continue;
    }

    const trimmed = element.value.trim();
    if (trimmed === element.value) {
      continue;
    }

    // Constraint validation reads the DOM value, so trim in place first.
    // Then emit `input` so v-model picks up the same value (Vue reads event.target.value).
    element.value = trimmed;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

export function useForm() {
  const formEl = ref(null);
  const validated = ref(false);

  let trackedForm = null;
  const snapshot = ref(null);

  function checkValidity() {
    trimFormValues(formEl.value);

    if (formEl.value?.checkValidity()) {
      return true;
    }

    validated.value = true;
    return false;
  }

  // Marks the current form state as the "clean" baseline (e.g. after filling/resetting the form).
  function markPristine() {
    snapshot.value = trackedForm ? JSON.stringify(trackedForm) : null;
  }

  // Creates the reactive form state and starts tracking it for changes.
  function createForm(initialValues) {
    trackedForm = reactive(initialValues);
    markPristine();

    return trackedForm;
  }

  function createId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
  }

  // Checks if the current form state has changed since the last "clean" snapshot.
  const isDirty = computed(() => trackedForm !== null && JSON.stringify(trackedForm) !== snapshot.value);

  return {
    formEl,
    validated,
    isDirty,
    createId,
    createForm,
    markPristine,
    checkValidity,
  };
}
