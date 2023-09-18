import { RedisClientType, RedisFunctions, RedisModules, RedisScripts, createClient } from "redis";

type RedisClient = RedisClientType<RedisModules, RedisFunctions, RedisScripts>;

let redis: RedisClient | null = null;

export async function getRedisClient(): Promise<RedisClient | null> {
    if (redis === null) {
        redis = await initializeRedisClient();
    }
    return redis;
}

async function initializeRedisClient() {
    try {
        const redisClient = createClient();
        redisClient.on("error", (err) => {
            if (err.code === "ECONNREFUSED") {
                redisClient.quit();
                throw new Error("Connection refused by Redis server. Events will not be streamed");
            }
            console.error("Redis Client Error", err, err.code);
        });
        await redisClient.connect();
        return redisClient;
    } catch (e: unknown) {
        if (e instanceof Error) {
            console.error(e.message);
        }
        return null;
    }
}