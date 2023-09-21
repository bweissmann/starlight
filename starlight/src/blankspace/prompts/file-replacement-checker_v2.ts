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

const spec = `
         Does the code snippet represent a portion of the file? Or does it represent a replacement for the entire file?  
         Keep in mind that it is extremely unexpected for large portions of a file to be completely deleted, and files ususlly start with imports.
         Respond true if it is the whole file, false if its a portion.  

         This snippet is a replacement for the whole file (true/false):
  ` as const;

const prompt = `
Hi Petey,

I hope this email finds you well. I have a task for you that involves analyzing a code snippet. I need you to determine whether this snippet is meant to replace an entire file or if it's just a portion of it. 

It's important to remember that it's quite unusual for large sections of a file to be completely deleted, and files usually start with imports. So, with that in mind, could you please review the code snippet attached to this email and let me know your thoughts?

Please respond with "true" if you believe the snippet is a replacement for the whole file, and "false" if you think it's just a portion.

\`\`\`instructions
Write your response in the following format:

\`\`\`json
{
    "This snippet is a replacement for the whole file": boolean
}
\`\`\`
\`\`\`

Thanks for your help with this,

Lydia
`;

const forward: Forward<Prompt> = async (tx: Tx, inputs) => {
  const raw = await chat(tx, g4(system(prompt), ...inputs));
  return await parse(raw.message);
};

async function parse(raw:string): Promise<Prompt["inferred"]["returns"]> {
    const json = asJSON<{ "This snippet is a replacement for the whole file": boolean }>(maybeExtractSingleFencedSnippet(raw));
    return json["This snippet is a replacement for the whole file"];
}

const hypotheticalResponses = `


$START_HYPOTHETICAL_OUTPUT$
{
    "This snippet is a replacement for the whole file": false
}
$END_HYPOTHETICAL_OUTPUT$

$START_HYPOTHETICAL_OUTPUT$
{
    "This snippet is a replacement for the whole file": true
}
$END_HYPOTHETICAL_OUTPUT$


`;
// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "file-replacement-checker_v2.ts";
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
