<template>
  <div class="token-page">
    <div class="token-card">
      <h1>SmartThings Authorization</h1>

      <div v-if="code" class="status status--success">
        <p class="status-text">SmartThings created an authorization code for the plugin. One more step and you are connected.</p>

        <div class="code-box">
          <span class="status-label">Authorization code</span>
          <div class="code-row">
            <code ref="codeEl" class="code-value" @click="selectCode">{{ code }}</code>
            <button type="button" class="copy-button" :class="{ copied }" @click="copyCode">
              <svg v-if="copied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="11" height="11" rx="2" />
                <path d="M5 15V6a2 2 0 0 1 2-2h9" />
              </svg>
              {{ copied ? "Copied" : "Copy" }}
            </button>
          </div>
        </div>

        <div class="status-steps">
          <span class="status-label">Next steps</span>
          <ol>
            <li>Copy the code.</li>
            <li>Go back to the SmartThings wizard in the plugin settings and paste it in <strong>Authorization Code</strong>.</li>
            <li>Choose <strong>Authorize</strong>.</li>
          </ol>
        </div>

        <p class="status-note">
          The code works only once and expires after a short time. If the wizard rejects it, open the
          <strong>Authorization URL</strong> again to get a new one. Do not share this code.
        </p>
      </div>

      <div v-else-if="error" class="status status--error">
        <div class="status-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </div>

        <h2 class="status-title">{{ errorInfo.title }}</h2>
        <p class="status-text">{{ errorInfo.text }}</p>

        <div class="status-details">
          <span class="status-label">SmartThings returned</span>
          <code>{{ error }}</code>
          <p v-if="errorDescription" class="status-description">{{ errorDescription }}</p>
        </div>

        <div class="status-steps">
          <span class="status-label">What to do</span>
          <ol>
            <li v-for="step in errorInfo.steps" :key="step" v-html="step" />
          </ol>
        </div>

        <a class="status-link" :href="guideUrl">Read the SmartThings setup guide →</a>
      </div>

      <div v-else class="status status--warning">
        <div class="status-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 6.5v7.5M12 18v.01" />
          </svg>
        </div>

        <h2 class="status-title">No authorization code</h2>
        <p class="status-text">
          SmartThings sends you to this page with a code after you allow access.
          This time the page was opened without one.
        </p>

        <div class="status-steps">
          <span class="status-label">How to get a code</span>
          <ol>
            <li>Open the plugin settings in Homebridge UI and choose <strong>Connect to SmartThings</strong>.</li>
            <li>Enter your client ID and client secret, then choose <strong>Continue</strong>.</li>
            <li>Open the <strong>Authorization URL</strong>, sign in and allow access. You come back here with a code.</li>
          </ol>
        </div>

        <p class="status-note">
          Came here from SmartThings and still no code? Check that the Redirect URI of your SmartThings app is exactly:
          <code class="status-url">{{ pageUrl }}</code>
        </p>

        <a class="status-link" :href="guideUrl">Read the SmartThings setup guide →</a>
      </div>
    </div>
  </div>
</template>

<script>
import { withBase } from "vitepress";

const RETRY_STEPS = [
  "Go back to the SmartThings wizard in the plugin settings.",
  "Open the <strong>Authorization URL</strong> again.",
  "Sign in and choose <strong>Allow</strong>.",
];

const ERRORS = {
  access_denied: {
    title: "Access was not allowed",
    text: "SmartThings did not create a code because access was denied. This happens when you choose Deny, or leave the SmartThings page before allowing access.",
    steps: RETRY_STEPS,
  },
  invalid_scope: {
    title: "The app asks for the wrong access",
    text: "The scopes requested do not match the ones of your SmartThings app.",
    steps: [
      "Check that your SmartThings app has only the <code>r:devices:*</code> and <code>x:devices:*</code> scopes.",
      ...RETRY_STEPS,
    ],
  },
};

const DEFAULT_ERROR = {
  title: "Authorization failed",
  text: "SmartThings could not complete the authorization. Usually the settings of your SmartThings app do not match the ones in the plugin.",
  steps: [
    "Check that the app type is <strong>OAuth-In App</strong>.",
    "Check that the Redirect URI of the app is the address of this page.",
    "Check that the client ID in the plugin belongs to that app.",
    ...RETRY_STEPS.slice(1),
  ],
};

export default {
  data() {
    return {
      code: "",
      error: "",
      errorDescription: "",
      pageUrl: "",
      copied: false,
    };
  },
  computed: {
    errorInfo() {
      return ERRORS[this.error] || DEFAULT_ERROR;
    },
    guideUrl() {
      return withBase("/smartthings/");
    },
  },
  mounted() {
    const params = new URLSearchParams(window.location.search);
    this.code = params.get("code") || "";
    this.error = params.get("error") || "";
    this.errorDescription = params.get("error_description") || "";
    this.pageUrl = window.location.origin + window.location.pathname;
  },
  methods: {
    selectCode() {
      const range = document.createRange();
      range.selectNodeContents(this.$refs.codeEl);

      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    },
    copyCode() {
      navigator.clipboard.writeText(this.code).then(() => {
        this.copied = true;
        setTimeout(() => {
          this.copied = false;
        }, 2000);
      });
    },
  },
};
</script>

<style scoped>
.token-page {
  --page-bg: #f9fafb;
  --card-bg: #fff;
  --text: #1a1a1a;
  --text-muted: #6a737d;
  --border: #e1e4e8;
  --box-bg: #f6f8fa;
  --error: #d1242f;
  --error-soft: #ffebe9;
  --warning: #9a6700;
  --warning-soft: #fff8c5;
  --link: #3eaf7c;
  --success: #1f8a5b;
  --success-soft: #e3f5ec;
  --brand: #3eaf7c;
  --brand-hover: #359468;
  --brand-active: #2c7a5b;

  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: var(--page-bg);
  color: var(--text);
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
    sans-serif;
  padding: 80px 1rem 2rem;
  box-sizing: border-box;
}

@media (prefers-color-scheme: dark) {
  .token-page {
    --page-bg: #1b1b1f;
    --card-bg: #24242a;
    --text: #e6e6e6;
    --text-muted: #9a9aa3;
    --border: #3a3a42;
    --box-bg: #2c2c33;
    --error: #ff7b72;
    --error-soft: rgba(255, 123, 114, 0.14);
    --warning: #e3b341;
    --warning-soft: rgba(227, 179, 65, 0.14);
    --success: #56d364;
    --success-soft: rgba(86, 211, 100, 0.14);
  }
}

.token-card {
  min-width: 0;
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 4px 20px rgba(0, 0, 0, 0.06);
  padding: 2.5rem;
  max-width: 520px;
  width: 100%;
  box-sizing: border-box;
  text-align: center;
}

@media (max-width: 480px) {
  .token-card {
    padding: 1.75rem 1.25rem;
  }
}

.token-card h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 1.5rem 0;
}

.code-box {
  text-align: left;
  margin-top: 1.5rem;
  padding: 0.875rem 1rem 1rem;
  background: var(--box-bg);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: 8px;
}

.code-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.code-value {
  flex: 1;
  min-width: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  word-break: break-all;
  color: var(--text);
  cursor: text;
}

.copy-button {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
  background: var(--brand);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.copy-button svg {
  width: 16px;
  height: 16px;
}

.copy-button:hover {
  background: var(--brand-hover);
}

.copy-button.copied {
  background: var(--brand-active);
}

/* Status screens */

.status {
  --accent: var(--error);
  --accent-soft: var(--error-soft);
}

.status--warning {
  --accent: var(--warning);
  --accent-soft: var(--warning-soft);
}

.status--success {
  --accent: var(--success);
  --accent-soft: var(--success-soft);
}

.status-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 1rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: var(--accent);
  background: var(--accent-soft);
}

.status-icon svg {
  width: 28px;
  height: 28px;
}

.status-title {
  font-size: 1.15rem;
  font-weight: 600;
  margin: 0;
}

.status-text {
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.55;
  margin: 0.5rem auto 0;
  max-width: 400px;
}

.status-details,
.status-steps {
  text-align: left;
  margin-top: 1.5rem;
}

.status-details {
  padding: 0.875rem 1rem;
  background: var(--box-bg);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: 8px;
}

.status-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 0.35rem;
}

.status-details code {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--accent);
  word-break: break-all;
}

.status-description {
  margin: 0.35rem 0 0;
  font-size: 0.9rem;
  line-height: 1.5;
}

.status-steps ol {
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: step;
  font-size: 0.95rem;
  line-height: 1.55;
}

.status-steps li {
  position: relative;
  padding-left: 2.1rem;
  counter-increment: step;
}

.status-steps li::before {
  content: counter(step);
  position: absolute;
  left: 0;
  top: 0.05rem;
  width: 1.4rem;
  height: 1.4rem;
  display: grid;
  place-items: center;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 50%;
  color: var(--accent);
  background: var(--accent-soft);
}

.status-steps li + li {
  margin-top: 0.6rem;
}

.status-note strong {
  color: var(--text);
}

.status-steps code,
.status-note code {
  font-size: 0.85em;
  padding: 0.1em 0.35em;
  background: var(--box-bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  word-break: break-all;
}

.status-url {
  display: block;
  margin-top: 0.4rem;
  padding: 0.4em 0.6em !important;
}

.status-note {
  text-align: left;
  margin: 1.25rem 0 0;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--text-muted);
}

.status-link {
  display: inline-block;
  margin-top: 1.75rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--link);
  text-decoration: none;
}

.status-link:hover {
  text-decoration: underline;
}
</style>
