function isVersionLower(current, target) {
  if (!current) return true;
  const c = current.split('.').map(Number);
  const t = target.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((c[i] || 0) < (t[i] || 0)) return true;
    if ((c[i] || 0) > (t[i] || 0)) return false;
  }
  return false;
}

export function isConfigUiXSupported(minVersion = '5.27.0') {
  const currentVersion = homebridge.serverEnv?.env?.packageVersion;
  return !isVersionLower(currentVersion, minVersion);
}

export function getAppRoot() {
  return document.querySelector('div[ht-ui-root]');
}

export function toggleNativeFooter(show = true) {
  try {
    const modalFooter = window.parent.document.querySelector('.modal-footer');
    if (modalFooter) {
      modalFooter.style.display = show ? '' : 'none';
    }
  } catch {}
}
