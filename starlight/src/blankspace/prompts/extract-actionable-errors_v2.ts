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
  `Take this stdout/stderr output and extract each of the actionable errors so we have them in a list. some of the ouput is errors and some is normal stdout` as const;

const prompt = `
Subject: URGENT - Extraction of Actionable Errors from Output

Hi Petey,

I hope this email finds you well. I've got a task for you that needs your attention.

Attached to this email, you'll find a document containing a mix of standard output and error messages. Your task is to sift through this output and extract all the actionable errors. These are the ones we can actually do something about, not just the standard system messages.

Once you've identified these errors, please compile them into a list so we can review and address them accordingly. 

\`\`\`instructions
Write the body of your email in the following format:

Please provide the actionable errors extracted from the stdout/stderr output. Each error should be presented as a separate string within a code block. Here's an example of how you should format your response:

\`\`\`
\`\`\`error
Error 1 details...
\`\`\`
\`\`\`
\`\`\`error
Error 2 details...
\`\`\`
\`\`\`
\`\`\`error
Error 3 details...
\`\`\`
\`\`\`
And so on for each actionable error you extract from the output.
\`\`\`

I trust your judgement on this. Let me know if you come across anything unusual or need further clarification.

Thanks in advance for your help on this.

Keep up the great work,

Lydia
`;

const forward: Forward<Prompt> = async (tx: Tx, inputs) => {
  const raw = await chat(tx, g4(system(prompt), ...inputs));
  return await parse(raw.message);
};

async function parse(raw:string): Promise<Prompt["inferred"]["returns"]> {
  return extractFencedSnippets(raw);
}

// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "extract-actionable-errors_v2.ts";
  inferred: {
    inputs: string[];
    returns: string[];
  };
};
export const emptyinstance: Prompt = {} as Prompt;
export const Impl: ImplOf<Prompt> = {
  spec: spec,
  forward,
};
