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

const spec =
  `You'll be given an original source code file and a snippet of code to update the file (below).
    Decide what portion of the original file shuold be replaced with this patch.
    Respond with the line number of the first line to be replaced and the line number of the last line to be replaced:
    { startingLine, endingLine }
    ` as const;

const prompt = `
Subject: URGENT - Source Code Update Task

Hi Petey,

Hope this email finds you well. I have a task for you that requires your keen eye for code.

Attached to this email, you will find two files. One is the original source code file and the other is a snippet of code that needs to be used to update the original file. Your job is to determine which portion of the original file should be replaced with this patch.

Once you have identified the relevant section, please respond with the line number of the first line to be replaced and the line number of the last line to be replaced. Your response should be in the format: { startingLine, endingLine }.

I trust your judgement on this, so take the time you need to ensure accuracy.

\`\`\`instructions
Write the body of your email in the following format:

\`\`\`json
{
    "startingLine": number,
    "endingLine": number
}
\`\`\`
Please replace "number" with the actual line numbers where the original source code should be replaced with the provided patch.
\`\`\`

Catch you on the flip side,
Lydia
`;

const forward: Forward<Prompt> = async (tx: Tx, inputs) => {
  const raw = await chat(tx, g4(system(prompt), ...inputs));
  return await parse(raw.message);
};

async function parse(raw:string): Promise<Prompt["inferred"]["returns"]> {
  return asJSON<Prompt["inferred"]["returns"]>(maybeExtractSingleFencedSnippet(raw));
}

// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "code-patch-locator.ts";
  inferred: {
    inputs: string[];
    returns: {
      startingLine: number;
      endingLine: number;
    };
  };
};
export const emptyinstance: Prompt = {} as Prompt;
export const Impl: ImplOf<Prompt> = {
  spec: spec,
  forward,
};
