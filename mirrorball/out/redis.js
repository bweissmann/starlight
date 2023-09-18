"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = void 0;
const redis_1 = require("redis");
let redis = null;
async function getRedisClient() {
    if (redis === null) {
        redis = await initializeRedisClient();
    }
    return redis;
}
exports.getRedisClient = getRedisClient;
async function initializeRedisClient() {
    try {
        const redisClient = (0, redis_1.createClient)();
        redisClient.on("error", (err) => {
            if (err.code === "ECONNREFUSED") {
                redisClient.quit();
                throw new Error("Connection refused by Redis server. Events will not be streamed");
            }
            console.error("Redis Client Error", err, err.code);
        });
        await redisClient.connect();
        return redisClient;
    }
    catch (e) {
        if (e instanceof Error) {
            console.error(e.message);
        }
        return null;
    }
}
//# sourceMappingURL=redis.js.map