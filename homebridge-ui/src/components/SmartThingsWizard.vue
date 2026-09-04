<script setup>
import { reactive, ref, watch } from 'vue';
import { useConfig } from '../composables/useConfig';
import { useForm } from '../composables/useForm';
import { useHomebridge } from '../composables/useHomebridge';
import { useRouter } from '../composables/useRouter';
import { useSmartThings } from '../composables/useSmartThings';
import { useToast } from '../composables/useToast';
import WizardSteps from './WizardSteps.vue';

const { config, updateConfig, saveConfig } = useConfig();
const { showSpinner, hideSpinner } = useHomebridge();
const { getAuthUrl, getAuthToken, saveToken } = useSmartThings();
const { navigateTo } = useRouter();
const toast = useToast();

const currentStep = ref(1);
const { formEl, validated, checkValidity } = useForm();

const state = reactive({
  clientId: config.value?.clientId || '',
  clientSecret: config.value?.clientSecret || '',
  authorizationCode: null,
  authorizationUrl: null,
  status: null,
  error: null,
});

watch(currentStep, () => {
  validated.value = false;
});

async function submitStep1() {
  const authorizationUrl = await getAuthUrl({
    clientId: state.clientId,
    clientSecret: state.clientSecret,
  });

  state.authorizationUrl = authorizationUrl;

  await updateConfig(
    {
      clientId: state.clientId,
      clientSecret: state.clientSecret,
    },
    false,
  );

  currentStep.value = 2;
}

async function submitStep2() {
  const authorizationCode = state.authorizationCode?.replace(/^["']|["']$/g, '').trim();

  const authorizationToken = await getAuthToken({
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    authorizationCode,
  });

  if (authorizationToken?.error) {
    state.status = 'error';
    state.error = authorizationToken.error_description || authorizationToken.error;
  } else {
    await saveToken(authorizationToken);
    await saveConfig();
    state.status = 'success';
  }

  currentStep.value = 3;
}

async function handleSubmit() {
  if (!checkValidity()) {
    return;
  }

  showSpinner();

  try {
    if (currentStep.value === 1) {
      await submitStep1();
    } else if (currentStep.value === 2) {
      await submitStep2();
    }
  } catch (error) {
    toast.error(error.message || 'An error occurred during the request.');
  } finally {
    hideSpinner();
  }
}

function handleRetry() {
  state.status = null;
  state.error = null;
  state.authorizationCode = null;
  state.authorizationUrl = null;
  currentStep.value = 1;
}
</script>

<template>
  <WizardSteps :current="currentStep" :outcome="state.status" :steps="['Credentials', 'Auth Code', 'Authorization']" class="my-4 mx-sm-5" />

  <form v-if="currentStep === 1" ref="formEl" class="card shadow" :class="{ 'was-validated': validated }" novalidate @submit.prevent="handleSubmit">
    <div class="card-header">
      <h6 class="fw-semibold mb-0">API Credentials</h6>
      <p class="small text-secondary mb-0 mt-1">Enter your SmartThings OAuth client ID and secret.</p>
    </div>
    <div class="card-body">
      <div class="mb-3">
        <label for="clientId" class="form-label">Client ID <strong class="text-danger">*</strong></label>
        <input
          id="clientId"
          v-model="state.clientId"
          type="text"
          class="form-control"
          placeholder="e.g. a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6"
          pattern="^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
          required
        />
        <div class="invalid-feedback">Please enter a valid OAuth Client ID</div>
      </div>

      <div class="mb-2">
        <label for="clientSecret" class="form-label">Client Secret <strong class="text-danger">*</strong></label>
        <input
          id="clientSecret"
          v-model="state.clientSecret"
          type="text"
          class="form-control"
          placeholder="e.g. 3e2517a2-4a9b-4c54-9d01-123456789abc"
          pattern="^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
          required
        />
        <div class="invalid-feedback">Please enter a valid OAuth Client Secret</div>
      </div>
    </div>
    <div class="card-footer card-actions">
      <button type="button" class="btn btn-outline-secondary" @click="navigateTo('dashboard')">Cancel</button>
      <button type="submit" class="btn btn-primary">Continue to authorization <i class="fas fa-arrow-right"></i></button>
    </div>
  </form>

  <form v-if="currentStep === 2" ref="formEl" class="card shadow" :class="{ 'was-validated': validated }" novalidate @submit.prevent="handleSubmit">
    <div class="card-header">
      <h6 class="fw-semibold mb-0">Authorization Code</h6>
      <p class="small text-secondary mb-0 mt-1">Open the authorization URL, then paste the code you receive.</p>
    </div>
    <div class="card-body">
      <div class="mb-3">
        <label class="form-label">Authorization URL</label>
        <div class="code-box">
          <a :href="state.authorizationUrl" target="_blank" rel="noopener noreferrer" class="code-box-value font-monospace text-truncate">
            <i class="fas fa-link" />
            {{ state.authorizationUrl }}
          </a>
          <a :href="state.authorizationUrl" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-secondary flex-shrink-0">Open</a>
        </div>
      </div>

      <div class="mb-2">
        <label for="authorizationCode" class="form-label">Authorization Code <strong class="text-danger">*</strong></label>
        <input id="authorizationCode" v-model="state.authorizationCode" type="text" class="form-control" placeholder="e.g. 4euLqN" pattern="[a-zA-Z0-9]+" required />
        <div class="invalid-feedback">Please enter a valid authorization code</div>
      </div>
    </div>
    <div class="card-footer card-actions">
      <button type="button" class="btn btn-outline-secondary" @click="currentStep--">Back</button>
      <button type="submit" class="btn btn-primary">Authorize SmartThings <i class="fas fa-arrow-right"></i></button>
    </div>
  </form>

  <div v-if="currentStep === 3">
    <template v-if="state.status === 'success'">
      <h4 class="fw-bold">Connection successful</h4>
      <p>Homebridge is now authorized to access your Samsung SmartThings account.</p>

      <button type="button" class="btn btn-success" @click="navigateTo('dashboard')">Go to dashboard <i class="fas fa-arrow-right ms-1" /></button>
    </template>

    <template v-else-if="state.status === 'error'">
      <h4 class="fw-bold">Authorization failed</h4>
      <p>
        The backend could not exchange your authorization code for an access token. The authorization code may have been incorrect, expired, or already used. Please go back and try
        again with a fresh authorization code.
      </p>
      <div v-if="state.error">
        <code>{{ state.error }}</code>
      </div>

      <div>
        <button type="button" class="btn btn-outline-secondary" @click="navigateTo('dashboard')">Cancel</button>
        <button type="button" class="btn btn-danger" @click="handleRetry">Try again</button>
      </div>
    </template>
  </div>
</template>
