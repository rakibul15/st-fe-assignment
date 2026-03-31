export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000;
export const DEBOUNCE_MS = 250;
export const DEFAULT_PAGE_SIZE = 12;

export const CATEGORIES = ['Electronics', 'Clothing', 'Home', 'Outdoors'] as const;
export type Category = (typeof CATEGORIES)[number];
