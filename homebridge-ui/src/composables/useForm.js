import { ref } from 'vue';

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

  function checkValidity() {
    trimFormValues(formEl.value);

    if (formEl.value?.checkValidity()) {
      return true;
    }

    validated.value = true;
    return false;
  }

  return { formEl, validated, checkValidity };
}
