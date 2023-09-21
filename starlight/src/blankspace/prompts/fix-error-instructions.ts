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
  `The user will give you an error message. you'll give instructions to a programmer on how to fix it.
   heres your output format:
  {
    file: string, // the file to open
    instructions: string // the instructions to the programmer
  }` as const;

const prompt = `
Subject: URGENT - Error Message Resolution Required
Hi Petey,

I hope this email finds you well. I've got a bit of a situation that needs your expertise. Attached to this email, you'll find an error message that we've been trying to decipher.

Your task is to analyze this error message and then provide instructions to our programmer on how to fix it. I know you're great at breaking down complex issues into understandable steps, so I'm confident you can help us out here.

Please focus on identifying the file that needs to be opened and the specific steps that need to be taken to rectify the issue. 

\`\`\`instructions
Write the body of your email in the following format:

\`\`\`json
{
    "file": "the name of the file to open",
    "instructions": "the instructions to the programmer on how to fix the error"
}
\`\`\`
\`\`\`

I'm counting on your keen eye and problem-solving skills to get this sorted out as soon as possible.

Thanks in advance!

In the spirit of debugging,
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
  filename: "fix-error-instructions.ts";
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
