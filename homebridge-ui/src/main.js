import { createApp } from 'vue';
import App from './App.vue';

function isVersionLower(current, target) {
	if (!current) return true;

	const currentParts = current.split('.').map(Number);
	const targetParts = target.split('.').map(Number);

	for (let index = 0; index < 3; index++) {
		if ((currentParts[index] || 0) < (targetParts[index] || 0)) return true;
		if ((currentParts[index] || 0) > (targetParts[index] || 0)) return false;
	}

	return false;
}

function isConfigUiXSupported(minVersion = '5.27.0') {
	const currentVersion = window.homebridge?.serverEnv?.env?.packageVersion;
	return !isVersionLower(currentVersion, minVersion);
}

function startApp() {
	const root = document.querySelector('#app');
	if (!root) return;

	if (!isConfigUiXSupported()) {
		root.innerHTML = '';
		window.homebridge?.showSchemaForm();
		return;
	}

	createApp(App).mount(root);
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', startApp, { once: true });
} else {
	startApp();
}
