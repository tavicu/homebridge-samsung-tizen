export function useHomebridge() {
  const hb = window.homebridge;

  function enableSaveButton() {
    hb?.enableSaveButton();
  }

  function disableSaveButton() {
    hb?.disableSaveButton();
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
    showSpinner,
    hideSpinner,
    showSchemaForm,
    serverRequest,
  };
}
