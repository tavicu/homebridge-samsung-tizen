<script setup>
import { COMMAND_PATTERN, createCommand, normalizeCommand } from '../lib/command';

const commands = defineModel({
  type: Array,
  required: true,
});

defineProps({
  required: {
    type: Boolean,
    default: false,
  },
});

function addCommand() {
  commands.value = [...commands.value, createCommand()];
}

// The last row is only emptied, so there is always one to type in.
function removeCommand(id) {
  const remaining = commands.value.filter((command) => command.id !== id);
  commands.value = remaining.length ? remaining : [createCommand()];
}
</script>

<template>
  <label class="form-label">Key(s) to execute</label>
  <div class="d-flex flex-column gap-2">
    <div v-for="command in commands" :key="command.id" class="input-group input-group-sm has-validation">
      <input
        v-model="command.value"
        type="text"
        class="form-control font-monospace"
        placeholder="e.g. KEY_VOLUP"
        :pattern="COMMAND_PATTERN"
        :required="required"
        @blur="command.value = normalizeCommand(command.value)"
      />
      <button type="button" class="btn btn-outline-danger" aria-label="Remove command" @click="removeCommand(command.id)">
        <i class="fas fa-xmark" />
      </button>
      <div class="invalid-feedback">Use a key like KEY_VOLUP, KEY_VOLUP*3 or KEY_POWER*2.5s.</div>
    </div>
  </div>
  <button type="button" class="btn btn-sm btn-outline-primary mt-2" @click="addCommand"><i class="fas fa-plus" /> Add Command</button>
</template>
