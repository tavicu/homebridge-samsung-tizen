export const sleep = <T>(timeout = 150, { value }: { value?: T } = {}): Promise<T | undefined> => {
  return new Promise((resolve) => setTimeout(() => resolve(value), timeout));
};

export const race = <T>(promise: Promise<T>, timeout = 2500): Promise<T | void> => {
  const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, timeout));
  return Promise.race([promise, timeoutPromise]);
};

export const debounce = <T extends (...args: any[]) => void>(callback: T, timeout = 250) => {
  let timer: NodeJS.Timeout;

  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timer);

    timer = setTimeout(() => {
      callback.apply(this, args);
    }, timeout);
  };
};
