<script setup>
import { nextTick, reactive, ref, watch } from 'vue';
import { useConfig } from '../composables/useConfig';
import { useForm } from '../composables/useForm';
import { useHomebridge } from '../composables/useHomebridge';
import { useRouter } from '../composables/useRouter';
import { useSmartThings } from '../composables/useSmartThings';
import { useToast } from '../composables/useToast';
import Callout from './Callout.vue';
import DocsLink from './DocsLink.vue';
import WizardSteps from './WizardSteps.vue';

const { config, updateConfig, saveConfig } = useConfig();
const { showSpinner, hideSpinner } = useHomebridge();
const { getAuthUrl, getAuthToken, saveToken } = useSmartThings();
const { navigateTo } = useRouter();
const toast = useToast();

const currentStep = ref(1);
const urlCopied = ref(false);
const { formEl, validated, checkValidity } = useForm();

const state = reactive({
  clientId: config.value?.clientId || '',
  clientSecret: config.value?.clientSecret || '',
  showAdvanced: false,
  redirectUrl: '',
  authorizationCode: null,
  authorizationUrl: null,
  status: null,
  error: null,
});

watch(currentStep, () => {
  validated.value = false;
});

// The code is often pasted with quotes around it, or as the whole redirect URL, so keep only the code itself.
function normalizeAuthorizationCode(value) {
  const code = String(value ?? '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();

  try {
    return new URL(code).searchParams.get('code') ?? code;
  } catch {
    return code;
  }
}

function customRedirectUrl() {
  return state.showAdvanced ? state.redirectUrl : undefined;
}

async function submitStep1() {
  const authorizationUrl = await getAuthUrl({
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    redirectUrl: customRedirectUrl(),
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
  const authorizationToken = await getAuthToken({
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    authorizationCode: state.authorizationCode,
    redirectUrl: customRedirectUrl(),
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
  if (currentStep.value === 2) {
    state.authorizationCode = normalizeAuthorizationCode(state.authorizationCode);

    // Validation reads the input from the DOM, so wait until it shows the cleaned code.
    await nextTick();
  }

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

function copyAuthorizationUrl() {
  navigator.clipboard.writeText(state.authorizationUrl);
  urlCopied.value = true;
  setTimeout(() => (urlCopied.value = false), 2000);
}
</script>

<template>
  <WizardSteps :current="currentStep" :outcome="state.status" :steps="['Credentials', 'Authorization', 'Result']" class="my-4 mx-sm-5" />

  <Callout v-if="currentStep === 1" class="mb-3" state="info" title="Create a SmartThings app first">
    You only do this once, with the official command line tool on a computer that has a browser. When it is done, it shows the client ID and client secret that go below. The
    documentation walks you through each step.
    <DocsLink path="smartthingsCreateApp">Follow the guide</DocsLink>
  </Callout>

  <form v-if="currentStep === 1" ref="formEl" class="card shadow" :class="{ 'was-validated': validated }" novalidate @submit.prevent="handleSubmit">
    <div class="card-header">
      <h6 class="fw-semibold mb-0">API Credentials</h6>
      <p class="small text-secondary mt-1">Enter the client ID and client secret of your SmartThings app.</p>
    </div>
    <div class="card-body">
      <div class="mb-3">
        <label for="clientId" class="form-label">Client ID</label>
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
        <label for="clientSecret" class="form-label">Client Secret</label>
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

      <div v-if="state.showAdvanced" class="mt-3 mb-2">
        <label for="redirectUrl" class="form-label">Redirect URL</label>
        <input id="redirectUrl" v-model="state.redirectUrl" type="url" class="form-control" placeholder="https://tavicu.github.io/homebridge-samsung-tizen/token.html" />
        <div class="invalid-feedback">Please enter a valid redirect URL</div>
      </div>
    </div>
    <div class="card-footer">
      <div class="form-check mb-0">
        <input id="showAdvanced" v-model="state.showAdvanced" class="form-check-input" type="checkbox" />
        <label class="form-check-label small" for="showAdvanced">Advanced settings</label>
      </div>
      <div class="card-actions">
        <button type="button" class="btn btn-outline-secondary" @click="navigateTo('dashboard')">Cancel</button>
        <button type="submit" class="btn btn-primary">Continue <i class="fas fa-arrow-right"></i></button>
      </div>
    </div>
  </form>

  <form v-if="currentStep === 2" ref="formEl" class="card shadow" :class="{ 'was-validated': validated }" novalidate @submit.prevent="handleSubmit">
    <div class="card-header">
      <h6 class="fw-semibold mb-0">Authorization Code <DocsLink path="smartthingsAuthorization" /></h6>
      <p class="small text-secondary mt-1">Copy the authorization URL, paste it in your browser, then paste the code you receive</p>
    </div>
    <div class="card-body">
      <div class="mb-3">
        <label class="form-label">Authorization URL</label>
        <div class="code-box">
          <a :href="state.authorizationUrl" target="_blank" rel="noopener noreferrer" class="code-box-value font-monospace text-truncate">
            <i class="fas fa-link" />
            {{ state.authorizationUrl }}
          </a>
          <button type="button" class="btn btn-sm btn-outline-secondary flex-shrink-0" @click="copyAuthorizationUrl">{{ urlCopied ? 'Copied' : 'Copy' }}</button>
        </div>
      </div>

      <div class="mb-2">
        <label for="authorizationCode" class="form-label">Authorization Code</label>
        <input id="authorizationCode" v-model="state.authorizationCode" type="text" class="form-control" placeholder="e.g. 4euLqN" pattern="[a-zA-Z0-9]+" required />
        <div class="invalid-feedback">Please enter a valid authorization code</div>
      </div>
    </div>
    <div class="card-footer card-actions">
      <button type="button" class="btn btn-outline-secondary" @click="currentStep--">Back</button>
      <button type="submit" class="btn btn-primary">Authorize <i class="fas fa-arrow-right"></i></button>
    </div>
  </form>

  <div v-if="currentStep === 3" class="text-center mt-5">
    <template v-if="state.status === 'success'">
      <i class="wizard-icon fas fa-check text-success mb-3" />
      <h5 class="fw-semibold mb-0">Connection successful</h5>
      <p class="wizard-outcome-text small text-secondary mt-2 mb-3">Homebridge is now authorized to access your Samsung SmartThings account.</p>
      <button type="button" class="btn btn-success" @click="navigateTo('dashboard')">Go to dashboard <i class="fas fa-arrow-right" /></button>
    </template>

    <template v-else-if="state.status === 'error'">
      <i class="wizard-icon fas fa-exclamation-triangle text-danger mb-3" />
      <h5 class="fw-semibold mb-0">Authorization failed</h5>
      <p class="wizard-outcome-text small text-secondary mt-2 mb-3">The authorization code may have been incorrect, expired, or already used. Try again with a fresh code.</p>
      <code v-if="state.error" class="d-block mb-3">{{ state.error }}</code>
      <div class="d-flex justify-content-center gap-2">
        <button type="button" class="btn btn-outline-secondary" @click="navigateTo('dashboard')">Cancel</button>
        <button type="button" class="btn btn-danger" @click="handleRetry">Try again</button>
      </div>
      <p class="small mt-3 mb-0"><DocsLink path="smartthingsAuthFailed">Troubleshooting</DocsLink></p>
    </template>
  </div>
</template>

<style scoped>
.wizard-icon {
  font-size: 2.5rem;
  line-height: 1;
}

.wizard-outcome-text {
  max-width: 22rem;
  margin-left: auto;
  margin-right: auto;
}
</style>
