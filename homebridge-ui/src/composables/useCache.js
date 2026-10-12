export function useCache() {
  const cache = new Map();

  function get(key, load) {
    const cached = cache.get(key);

    if (cached?.promise) {
      return cached.promise;
    }

    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const request = Promise.resolve(load()).then((value) => {
      cache.set(key, { value, expiresAt: Date.now() + 10 * 60 * 1000 });
      return value;
    });

    cache.set(key, { promise: request });
    return request;
  }

  function clear() {
    cache.clear();
  }

  return { get, clear };
}
