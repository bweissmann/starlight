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

You are tasked with determining whether a given code snippet represents a complete file or just a portion of it. Consider factors such as the presence of import statements at the beginning of the file and the likelihood of large sections of a file being deleted. 

You will find the code snippet in the user messages. After analyzing the snippet, respond with 'true' if you believe the snippet is a replacement for the whole file, or 'false' if you believe it represents only a portion of the file.

\`\`\`instructions
Write your response in the following format:

\`\`\`json
{
    "is_whole_file": boolean
}
\`\`\`
\`\`\`
`;

const forward: Forward<Prompt> = async (tx: Tx, inputs) => {
  const raw = await chat(tx, g4(system(prompt), ...inputs));
  return await parse(raw.message);
};

async function parse(raw:string): Promise<Prompt["inferred"]["returns"]> {
    const parsed = asJSON<{is_whole_file: boolean}>(maybeExtractSingleFencedSnippet(raw));
    return parsed.is_whole_file;
}

const hypotheticalResponses = `


$START_HYPOTHETICAL_OUTPUT$
{
    "is_whole_file": true
}
$END_HYPOTHETICAL_OUTPUT$

$START_HYPOTHETICAL_OUTPUT$
{
    "is_whole_file": false
}
$END_HYPOTHETICAL_OUTPUT$


`;
// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "file-replacement-check_v8.ts";
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
