function getHostModalFooter() {
  try {
    const iframe = window.frameElement;
    if (!iframe) {
      return null;
    }

    const modalContent = iframe.closest('.modal-content');
    return modalContent?.querySelector(':scope > .modal-footer') ?? null;
  } catch {
    return null;
  }
}

export function useHomebridge() {
  const hb = window.homebridge;

  function enableSaveButton() {
    hb?.enableSaveButton();
  }

  function disableSaveButton() {
    hb?.disableSaveButton();
  }

  function hideModalFooter() {
    const footer = getHostModalFooter();
    footer?.style.setProperty('display', 'none');
  }

  function showModalFooter() {
    const footer = getHostModalFooter();
    footer?.style.removeProperty('display');
  }

  function showSpinner() {
    hb?.showSpinner();
  }

  function hideSpinner() {
    hb?.hideSpinner();
  }

  function showSchemaForm() {
    hb?.showSchemaForm();
  }

  function serverRequest(path, payload) {
    return hb.request(path, payload);
  }

  return {
    hb,
    enableSaveButton,
    disableSaveButton,
    hideModalFooter,
    showModalFooter,
    showSpinner,
    hideSpinner,
    showSchemaForm,
    serverRequest,
  };
}
