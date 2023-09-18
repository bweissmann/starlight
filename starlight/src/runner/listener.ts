import "dotenv/config";
import "source-map-support/register.js";
import { redis } from "@/redis";
import { commandOptions } from "redis";
import getInput from "@/tools/user-input";
import { generatePrompt } from "@/blankspace/main";
import { defaultTx } from "@/project/context";
import blankspace from "@/blankspace/blankspace";

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
      const events = result[0].messages;
      for (const event of events) {
        await callback(event.message);
      }
    }
  }
}
async function callback(event: { uuid: string; type: string; input: string }) {
  if (event.type === "request") {
    const filenameIdentifier = await blankspace
      .build(
        `Given this prompt, come up with a one to four word name for the prompt, all lowercase, dash-separated. I prefer a verb to be the first word if it makes sense.`
      )
      .run(defaultTx(), [event.input]);
    await generatePrompt(defaultTx(), event.input, filenameIdentifier);
  }
}

listenToStream("mirrorball", callback);
