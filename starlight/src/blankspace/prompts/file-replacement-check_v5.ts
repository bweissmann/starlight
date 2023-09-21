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
         Does the snippet represent a portion of the file? Or does it represent a replacement for the entire file?
         Keep in mind that it is extremely unexpected for large portions of a file to be completely deleted, and files ususlly start with imports.
         Respond true if it is the whole file, false if its a portion.

         This snippet is a replacement for the whole file (true/false):
  ` as const;

const prompt = `
Hello,

You are tasked with determining whether a given code snippet represents a full file or just a portion of it. Consider the fact that it is unusual for large portions of a file to be entirely deleted, and that files typically begin with imports. Your response should indicate whether the snippet is a replacement for the entire file (true) or if it's just a part of it (false).

You will find the relevant code snippet in the user messages.

\`\`\`instructions
Write your response in the following format:
\`\`\`json
{
    "isWholeFile": boolean
}
\`\`\`
Please replace "boolean" with either "true" or "false" depending on whether the snippet represents a replacement for the entire file or not.
\`\`\`
`;

const forward: Forward<Prompt> = async (tx: Tx, inputs) => {
  const raw = await chat(tx, g4(system(prompt), ...inputs));
  return await parse(raw.message);
};

async function parse(raw:string): Promise<Prompt["inferred"]["returns"]> {
    const parsed = asJSON<{isWholeFile: boolean}>(raw);
    return parsed.isWholeFile;
}

const hypotheticalResponses = `


$START_HYPOTHETICAL_OUTPUT$
{
    "isWholeFile": true
}
$END_HYPOTHETICAL_OUTPUT$

$START_HYPOTHETICAL_OUTPUT$
{
    "isWholeFile": false
}
$END_HYPOTHETICAL_OUTPUT$


`;
// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "file-replacement-check_v5.ts";
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
