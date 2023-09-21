import { chat } from "@/llm/chat";
import { g4_t04, system } from "@/llm/utils";
import { Tx } from "@/project/context";

const metaprompt = `
# Introduction
The user will give you a task they want accomplished. Your job is to reformulate this task as an system prompt for GPT-4.

You should expect that if the user wants to run their task multiple times, they will run this prompt with different data or specific information in the user messages.
Feel free to reference the user messages as needed in your system prompt.

# Details
Your prompt should NOT contain example input/output pairs, just the instructions.
Your prompt should NOT express a specific format for its response, you should allow the reciever to respond in any format they want.

# Dynamic Data
As stated above, any information provided at runtime will be included as an user messages. Any time the task says "the user will give" or "you'll get" or "i'll give you" some data, please reformulate those statement to indicate the information is in subsequent messages.

# Format
Your prompt should start with the phrase:
"Hello,\n"

and end with the phrase:
"<possible further instructions>" on a line by itself, so that this prompt can be refined further.
`;

export default async function GENERATE_promptFirstDraft(tx: Tx, input: string) {
  return await chat(tx, g4_t04(system(metaprompt), input)).then(
    (out) => out.message
  );
}
