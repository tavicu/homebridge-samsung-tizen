import { HttpError } from '../errors.js';

type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
};

const parseBody = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export const request = async <T>(url: string, { timeout, ...init }: RequestOptions = {}): Promise<T> => {
  let response: Response;
  let text: string;

  try {
    response = await fetch(url, { ...init, signal: timeout ? AbortSignal.timeout(timeout) : undefined });
    text = await response.text();
  } catch (error: any) {
    // fetch reports network failures as "fetch failed" and keeps the real reason in `cause`.
    throw new Error(error.cause?.message || error.message, { cause: error });
  }

  const data = parseBody(text);

  if (!response.ok) {
    throw new HttpError(response.status, data);
  }

  return data as T;
};
