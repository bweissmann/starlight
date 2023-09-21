import { Tx } from "@/project/context";
import { Forward, ImplOf } from "../utility-types";
import { chat } from "@/llm/chat";
import { g4, system } from "@/llm/utils";
import {
  extractFencedSnippets,
  maybeExtractSingleFencedSnippet,
} from "@/llm/parser/code-fence";
import asJSON from "@/llm/parser/json";
import asXML from "@/llm/parser/xml";
import { asTripleHashtagList } from "@/llm/parser/triple-hashtag";
import { maybeStripQuotes } from "@/llm/parser/quotes";

const spec =
  `The user will give you an error message. you'll give instructions to a programmer on how to fix it.
    repond with these fields:
    "file" - the filename to open
    "instructions" - telling the programmer what the issue is.` as const;

const prompt = `
Hello,
You will receive an error message from the user. Your task is to analyze this error message and provide a solution to a programmer. The solution should be detailed and instructive, guiding the programmer on how to fix the error.

Your response should include the following fields:

1. "file": Indicate the specific filename that needs to be opened for troubleshooting.
2. "instructions": Provide clear and concise steps that the programmer needs to follow in order to resolve the issue.

The error message you need to analyze will be in the user messages.

\`\`\`instructions
Write your response in the following format:

\`\`\`json
{
    "file": "filename",
    "instructions": "instructions on how to fix the issue"
}
\`\`\`
Make sure to escape newline and quote characters within JSON content.
\`\`\`
`;

const forward: Forward<Prompt> = async (tx: Tx, inputs) => {
  const raw = await chat(tx, g4(system(prompt), ...inputs));
  return await parse(raw.message);
};

async function parse(raw:string): Promise<Prompt["inferred"]["returns"]> {
  return asJSON<Prompt["inferred"]["returns"]>(maybeExtractSingleFencedSnippet(raw));
}

const hypotheticalResponses = `
**Test Input Reasoning:**

I will start with the simplest error message.
`;
// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "fix-error-instructions_v7.ts";
  inferred: {
    inputs: string[];
    returns: {
      file: string;
      instructions: string;
    };
  };
};
export const emptyinstance: Prompt = {} as Prompt;
export const Impl: ImplOf<Prompt> = {
  spec: spec,
  forward,
};
