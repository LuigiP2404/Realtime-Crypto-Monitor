import { ApiError } from '../api/errors';

// used when the server rate limits us but does not expose a Retry-After header
const RETRY_FALLBACK_SECONDS = 60;

// turns an unknown rejection into user facing copy. `subject` names what failed
// to load, e.g. 'the chart' or 'cryptocurrencies'
export const describeError = (err: unknown, subject: string) => {
  if (err instanceof ApiError) {
    if (err.status === 429) {
      const wait = err.retryAfter ?? RETRY_FALLBACK_SECONDS;
      return `Too many requests, please wait ${wait} seconds before trying again.`;
    }
    if (err.status === 404) return `Could not find ${subject}.`;
    if (err.status >= 500) return 'The service is temporarily unavailable, please try again later.';
  }
  return `Could not load ${subject}, please check your connection and try again.`;
};
