function getHostModalElement(selector) {
  try {
    const iframe = window.frameElement;
    if (!iframe) {
      return null;
    }

    const modalContent = iframe.closest('.modal-content');
    return modalContent?.querySelector(selector) ?? null;
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
    const footer = getHostModalElement(':scope > .modal-footer');
    footer?.style.setProperty('display', 'none');
  }

  function showModalFooter() {
    const footer = getHostModalElement(':scope > .modal-footer');
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

  function moveModalPadding(root) {
    const modalBody = getHostModalElement(':scope > .modal-body');
    if (!modalBody || !root) {
      return;
    }

    root.style.setProperty('padding', getComputedStyle(modalBody).padding);
    modalBody.style.setProperty('padding', '0');
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
    moveModalPadding,
  };
}
