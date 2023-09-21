import { Tx } from "@/project/context";
import { vomit } from "@/utils";
import chalk from "chalk";
import { createClient } from "redis";

export const redis = await __initializeRedisClient();

async function __initializeRedisClient() {
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
      console.error(chalk.bold(e.message));
    }
    return null;
  }
}

export type EventType = "LLM_CHAT" | "INIT" | "FN" | "TIMING";

export async function emit(tx: Tx, type: EventType, fields: object) {
  if (redis === null) {
    return;
  }
  if (type === "INIT") {
    await redis.xAdd("initializations", "*", {
      id: tx.rx.id,
    });
  }

  const fieldsAsJson = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, vomit(value)])
  );
  await redis.xAdd(tx.rx.id, "*", {
    ...fieldsAsJson,
    type,
    txId: tx.id,
    txAncestry: JSON.stringify(tx.ancestryIds),
  });
}
