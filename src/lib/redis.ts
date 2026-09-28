import Redis from "ioredis";

const VERSION_KEY = "pokedex:cache-version";

let client: Redis | null = null;
let disabledUntil = 0;

function getClient() {
  if (!process.env.REDIS_URL || Date.now() < disabledUntil) return null;
  if (!client) {
    client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 800,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });
    client.on("error", () => {
      markDown();
    });
  }
  return client;
}

function markDown() {
  disabledUntil = Date.now() + 30_000;
  client?.disconnect();
  client = null;
}

async function withRedis<T>(fn: (redis: Redis) => Promise<T>) {
  const redis = getClient();
  if (!redis) return null;
  try {
    if (redis.status === "wait") await redis.connect();
    return await fn(redis);
  } catch {
    markDown();
    return null;
  }
}

export async function getCacheVersion() {
  const version = await withRedis((redis) => redis.get(VERSION_KEY));
  return version ?? "0";
}

export async function bumpCacheVersion() {
  await withRedis((redis) => redis.incr(VERSION_KEY));
}

export async function cacheGet<T>(key: string) {
  const raw = await withRedis((redis) => redis.get(key));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number) {
  await withRedis((redis) => redis.set(key, JSON.stringify(value), "EX", ttlSeconds));
}
