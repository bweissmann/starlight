import "@/runner/initializer";
import { emit, redis } from "@/redis";
import { commandOptions } from "redis";
import { generatePrompt } from "@/blankspace/main";
import { Tx, defaultTx } from "@/project/context";

async function listenToStream(
  name: string,
  callback: (event: any) => Promise<void>
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
        await callback(event.message);
      }
    }
  }
}

const callback = async (event: {
  uuid: string;
  type: string;
  input: string;
}) => {
  if (event.type === "request") {
    await generatePrompt(defaultTx(), event.input);
  }
};

listenToStream("mirrorball", callback);
