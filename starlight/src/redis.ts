import { Tx } from "@/project/context";
import { vomit } from "@/utils";
import { createClient } from "redis";

export const redis = await __initializeRedisClient();

async function __initializeRedisClient() {
  const redisClient = createClient();
  redisClient.on("error", (err) => console.log("Redis Client Error", err));
  await redisClient.connect();
  return redisClient;
}

export type EventType = "LLM_CHAT" | "INIT" | "FN";

export async function emit(tx: Tx, type: EventType, fields: object) {
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
