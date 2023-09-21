import "@/runner/initializer";
import { emit, redis } from "@/redis";
import { commandOptions } from "redis";
import { generatePrompt } from "@/blankspace/main";
import { Tx, defaultTx } from "@/project/context";

async function listenToStream(
  tx: Tx,
  name: string,
  callback: (tx: Tx, event: any) => Promise<void>
) {
  if (redis === null) {
    console.error("Redis client is not initialized.");
    return;
  }
  while (true) {
    const result = await redis.xRead(
      commandOptions({ isolated: true }),
      {
        key: name,
        id: "$",
      },
      {
        BLOCK: 0,
      }
    );
    if (result) {
      console.log(result);
      const events = result[0].messages;
      for (const event of events) {
        await callback(tx, event.message);
      }
    }
  }
}

const callback = async (
  tx: Tx,
  event: { uuid: string; type: string; input: string }
) => {
  if (event.type === "request") {
    await generatePrompt(tx, event.input);
  }
};

const tx = defaultTx();
await emit(tx, "INIT", {});
console.log("ready", tx.rx.id);
listenToStream(tx, "mirrorball", callback);
