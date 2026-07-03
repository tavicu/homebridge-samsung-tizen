export const delay = (timeout = 150, { value = undefined } = {}) => {
  return new Promise((resolve) => {
    const settle = () => resolve(value);

    setTimeout(settle, timeout);
  });
};

export const race = (promise, timeout = 2500) => {
  const race = new Promise((resolve) => setTimeout(resolve, timeout));

  return Promise.race([promise, race]);
};

export const debounce = (callback, timeout = 250) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      callback.apply(this, args);
    }, timeout);
  };
};
