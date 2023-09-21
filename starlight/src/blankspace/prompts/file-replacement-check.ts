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

const spec = `
         Does the snippet represent a portion of the file? Or does it represent a replacement for the entire file? 
         Keep in mind that it is extremely unexpected for large portions of a file to be completely deleted, and files ususlly start with imports.
         Respond true if it is the whole file, false if its a portion.

         This snippet is a replacement for the whole file (true/false): 
  ` as const;

const prompt = `
Subject: URGENT - File Snippet Analysis

Hi Petey,

I have a task for you. Attached to this email is a snippet of a file. Your job is to analyze it and determine if it represents a portion of the file or if it's a replacement for the entire file. 

Keep in mind that it's quite unusual for large portions of a file to be completely deleted and files usually start with imports. So, use this information to make your judgment.

Once you've made your determination, please respond with either 'true' if you believe the snippet is a replacement for the whole file, or 'false' if you think it's just a portion.

\`\`\`instructions
Write the body of your email in the following format:

\`\`\`boolean
{true or false}
\`\`\`
Please replace "{true or false}" with the actual response, either "true" or "false", without the quotes.
\`\`\`

Catch you on the flip side,
Lydia
`;

const forward: Forward<Prompt> = async (tx: Tx, inputs) => {
  const raw = await chat(tx, g4(system(prompt), ...inputs));
  return await parse(raw.message);
};

async function parse(raw:string): Promise<Prompt["inferred"]["returns"]> {
  const snippet = maybeExtractSingleFencedSnippet(raw);
  return snippet === 'true' ? true : false;
}

// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "file-replacement-check.ts";
  inferred: {
    inputs: string[];
    returns: boolean;
  };
};
export const emptyinstance: Prompt = {} as Prompt;
export const Impl: ImplOf<Prompt> = {
  spec: spec,
  forward,
};
