// Redis Caching Service
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

const defaultTTL = 3600; // 1 hour
const cachePrefix = "routix:";

// In-memory cache for development (replace with Redis in production)
const memoryCache = new Map<string, { value: any; expiry: number }>();

export async function set(
  key: string,
  value: any,
  options?: CacheOptions
): Promise<void> {
  const fullKey = `${cachePrefix}${options?.prefix || ""}:${key}`;
  const ttl = options?.ttl || defaultTTL;
  const expiry = Date.now() + ttl * 1000;

  memoryCache.set(fullKey, { value, expiry });
}

export async function get<T>(key: string, prefix?: string): Promise<T | null> {
  const fullKey = `${cachePrefix}${prefix || ""}:${key}`;
  const cached = memoryCache.get(fullKey);

  if (!cached) return null;

  if (cached.expiry < Date.now()) {
    memoryCache.delete(fullKey);
    return null;
  }

  return cached.value as T;
}

export async function del(key: string, prefix?: string): Promise<void> {
  const fullKey = `${cachePrefix}${prefix || ""}:${key}`;
  memoryCache.delete(fullKey);
}

export async function clear(prefix?: string): Promise<void> {
  const searchPrefix = `${cachePrefix}${prefix || ""}`;

  for (const key of memoryCache.keys()) {
    if (key.startsWith(searchPrefix)) {
      memoryCache.delete(key);
    }
  }
}

export async function mget<T>(keys: string[], prefix?: string): Promise<(T | null)[]> {
  return Promise.all(keys.map((key) => get<T>(key, prefix)));
}

export async function mset(
  entries: Array<[string, any]>,
  options?: CacheOptions
): Promise<void> {
  for (const [key, value] of entries) {
    await set(key, value, options);
  }
}

export default {
  set,
  get,
  del,
  clear,
  mget,
  mset,
};
