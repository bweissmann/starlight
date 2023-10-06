import "@/runner/initializer";

import { defaultTx } from "@/project/context";
import { emit } from "@/redis";
import OpenAI from "openai";
import { Message, estimatePricing } from "@/llm/utils";

async function main() {
  const tx = defaultTx();
  const openai = new OpenAI();

  const messages: Message[] = [
    {
      role: "user",
      content:
        "What differentiated the Apple Macintosh from the Apple II and the Lisa?",
    },
  ];

  const temperature = 0.4;
  const model = "gpt-3.5-turbo";

  const stream = await openai.chat.completions.create({
    model,
    messages,
    temperature,
    stream: true,
  });
  let output = "";
  for await (const part of stream) {
    if (!part.choices) {
      continue;
    }
    const chunk = part.choices[0]?.delta.content || "";
    process.stdout.write(chunk);
    await emit(tx, "TEXT_CHUNK", {
      chunk,
    });
    output = output + chunk;
  }
  await emit(tx, "LLM_CHAT", {
    price: estimatePricing({
      spec: { messages, model, temperature },
      output,
    }).total,
  });
  process.stdout.write("\n[EOF]\n");
}
await main();
process.exit(0);
