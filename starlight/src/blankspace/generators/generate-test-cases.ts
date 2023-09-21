import { chat } from "@/llm/chat";
import { g35_t06, g4, g4_t04, system } from "@/llm/utils";
import { Tx } from "@/project/context";

const metaprompt = `
We want to write a unit test suite for this GPT-4 prompt.
Read the following prompt and write out two hypothetical responses which GPT-4 might respond to this prompt given various inputs.

Your output format should be as follows:
$$START_OF_OUTPUT$$

$$START_HYPOTHETICAL_OUTPUT$$
<your first hypothetical output>
$$END_HYPOTHETICAL_OUTPUT$$

$$START_HYPOTHETICAL_OUTPUT$$
<your second hypothetical output>
$$END_HYPOTHETICAL_OUTPUT$$

$$END_OF_OUTPUT$$
`;
export async function GENERATE_testcases(
  tx: Tx,
  prompt: string
): Promise<string> {
  return await chat(
    tx,
    g35_t06(system(metaprompt), `# Prompt\n${prompt}\n\n`)
  ).then((r) =>
    r.message
      .replace("$$START_OF_OUTPUT$$", "")
      .replace("$$END_OF_OUTPUT$$", "")
  );
}
