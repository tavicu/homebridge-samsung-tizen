import { Socket } from 'net';

export const sleep = <T>(timeout = 150, { value }: { value?: T } = {}): Promise<T | undefined> => {
  return new Promise((resolve) => setTimeout(() => resolve(value), timeout));
};

export const retry = async <T>(run: () => Promise<T>, { retries = 3, delay = 1000 } = {}): Promise<T> => {
  try {
    return await run();
  } catch (error) {
    if (!retries) {
      throw error;
    }

    await sleep(delay);
    return retry(run, { retries: retries - 1, delay });
  }
};

export const race = <T>(promise: Promise<T>, timeout = 2500): Promise<T | void> => {
  // Prevents an unhandled rejection if `promise` rejects after `timeoutPromise` already won the race.
  promise.catch(() => {});

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

export const isPortReachable = async (port: number, host: string, timeout = 1000): Promise<boolean> => {
  try {
    await new Promise<void>((resolve, reject) => {
      const socket = new Socket();

      const onError = () => {
        socket.destroy();
        reject();
      };

      socket.setTimeout(timeout);
      socket.once('error', onError);
      socket.once('timeout', onError);

      socket.connect(port, host, () => {
        socket.end();
        resolve();
      });
    });

    return true;
  } catch {
    return false;
  }
};
