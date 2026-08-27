<script setup>
import { ref } from 'vue';

defineProps({
  form: {
    type: Object,
    required: true,
  },
  isEdit: {
    type: Boolean,
    default: false,
  },
  isDeviceScoped: {
    type: Boolean,
    default: false,
  },
  validated: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['submit', 'invalid', 'cancel', 'delete', 'add-command', 'remove-command']);
const formEl = ref(null);

function handleSubmit() {
  if (!formEl.value?.checkValidity()) {
    emit('invalid');
    return;
  }

  emit('submit');
}

function handleRemoveCommand(index) {
  emit('remove-command', index);
}
</script>

<template>
  <div class="d-flex align-items-center justify-content-between mb-3">
    <div>
      <h6 class="fw-bold mb-0">{{ isEdit ? 'Edit Switch' : 'Add Switch' }}</h6>
      <div class="text-muted">
        <template v-if="isEdit">Edit the configuration of the switch {{ form.name }}</template>
        <template v-else-if="isDeviceScoped">Configure a new switch for this device</template>
        <template v-else>Configure a new global switch that applies to all devices</template>
      </div>
    </div>

    <button v-if="isEdit" type="button" class="btn btn-outline-danger" @click="emit('delete')">Delete Switch</button>
  </div>

  <div v-if="!isEdit" class="ht-callout callout-info mb-3">
    <div class="fw-semibold mb-1">Combine one or more actions</div>
    A switch can run multiple actions at once — for example power on the TV, set volume, then send a remote command.
  </div>

  <form ref="formEl" class="card rounded" :class="{ 'was-validated': validated }" novalidate @submit.prevent="handleSubmit">
    <div class="card-body">
      <div class="mb-3">
        <label for="name" class="form-label">Switch Name <strong class="text-danger">*</strong></label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          class="form-control"
          name="name"
          placeholder="e.g. Evening Mode"
          pattern="^[a-zA-Z0-9 ]+$"
          required
        />
        <div class="invalid-feedback">Please enter a valid switch name.</div>
      </div>

      <hr class="my-4 text-muted" />

      <div class="mb-3">
        <label class="hb-uix-switch" for="power">
          <input id="power" v-model="form.power" type="checkbox" name="power" />
          <span>Power on TV before running actions</span>
          <span class="hb-uix-slider hb-uix-round"></span>
        </label>
        <small class="form-text text-muted d-block">If enabled, the TV is turned on first when this switch is activated.</small>
      </div>

      <div class="mb-3">
        <label class="hb-uix-switch" for="mute">
          <input id="mute" v-model="form.mute" type="checkbox" name="mute" />
          <span>Mute</span>
          <span class="hb-uix-slider hb-uix-round"></span>
        </label>
        <small class="form-text text-muted d-block">Sends the mute toggle command to the TV.</small>
      </div>

      <div class="row mb-3">
        <div class="col-md-6">
          <label for="sleep" class="form-label">Sleep <span class="text-muted">(minutes)</span></label>
          <input id="sleep" v-model="form.sleep" type="number" class="form-control" name="sleep" min="1" step="1" placeholder="e.g. 60" />
          <small class="form-text text-muted">Turn the TV off after the given number of minutes.</small>
        </div>

        <div class="col-md-6">
          <label for="volume" class="form-label">Volume <span class="text-muted">(optional)</span></label>
          <input
            id="volume"
            v-model="form.volume"
            type="number"
            class="form-control"
            name="volume"
            min="0"
            max="100"
            step="1"
            placeholder="e.g. 10"
          />
          <small class="form-text text-muted">Requires SmartThings. Sets the speaker volume.</small>
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-md-6">
          <label for="app" class="form-label">Application ID <span class="text-muted">(optional)</span></label>
          <input
            id="app"
            v-model="form.app"
            type="text"
            class="form-control"
            name="app"
            placeholder="e.g. 111299001912"
            pattern="^[0-9]+$"
            inputmode="numeric"
          />
          <small class="form-text text-muted">Opens the selected application.</small>
        </div>

        <div class="col-md-6">
          <label for="input" class="form-label">Input Source <span class="text-muted">(optional)</span></label>
          <input id="input" v-model="form.input" type="text" class="form-control" name="input" placeholder="e.g. HDMI1" />
          <small class="form-text text-muted">Requires SmartThings. Examples: digitalTv, HDMI1, HDMI2.</small>
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-md-6">
          <label for="channel" class="form-label">Channel <span class="text-muted">(optional)</span></label>
          <input id="channel" v-model="form.channel" type="number" class="form-control" name="channel" min="0" step="1" placeholder="e.g. 13" />
        </div>

        <div class="col-md-6">
          <label for="picture_mode" class="form-label">Picture Mode <span class="text-muted">(optional)</span></label>
          <input id="picture_mode" v-model="form.picture_mode" type="text" class="form-control" name="picture_mode" placeholder="e.g. movie" />
          <small class="form-text text-muted">Requires SmartThings.</small>
        </div>
      </div>

      <div>
        <label class="form-label">Key(s) to execute <span class="text-muted">(optional)</span></label>
        <div class="d-flex flex-column gap-2">
          <div v-for="(_, index) in form.commands" :key="index" class="input-group">
            <input
              v-model="form.commands[index]"
              type="text"
              name="command[]"
              class="form-control font-monospace text-uppercase"
              placeholder="e.g. KEY_VOLUP"
            />
            <button type="button" class="btn btn-outline-danger" @click="handleRemoveCommand(index)">
              <i class="fas fa-xmark"></i>
            </button>
          </div>
        </div>
        <button type="button" class="btn btn-outline-primary mt-2" @click="emit('add-command')"><i class="fas fa-plus"></i> Add Command</button>
      </div>
    </div>

    <div class="card-footer text-end">
      <button type="button" class="btn btn-outline-secondary" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn btn-primary">{{ isEdit ? 'Save Switch' : 'Add Switch' }} <i class="fas fa-arrow-right"></i></button>
    </div>
  </form>
</template>

<style scoped>
.ht-callout {
  background: var(--bs-light);
  border: 1px solid #e7e9eb;
  border-left: 3px solid var(--bs-gray-200);
  border-radius: 0.375rem;
  padding: 0.7rem 0.875rem;
  font-size: 0.8rem;
  line-height: 1.25rem;
}

.ht-callout.callout-info {
  border-left-color: var(--bs-info);
}
</style>
