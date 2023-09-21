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
  `You'll be given an original source code file and a snippet of code to update the file (below).
    Decide what portion of the original file shuold be replaced with this patch.
    Respond with the line number of the first line to be replaced and the line number of the last line to be replaced:
    { startingLine, endingLine }
    ` as const;

const prompt = `
Hello,

You will receive two pieces of information: an original source code file and a snippet of code that is intended to update the file. Your task is to analyze these two inputs and determine which part of the original file should be replaced by the provided code snippet.

Your response should specify the line number of the first line to be replaced and the line number of the last line to be replaced in the original source code file. The format of your response should be: { startingLine, endingLine }.

The necessary information will be included in the subsequent user messages.

\`\`\`instructions
Write your response in the following format:

\`\`\`json
{
    "startingLine": number,
    "endingLine": number
}
\`\`\`
Please replace "number" with the actual line numbers.
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


$START_HYPOTHETICAL_OUTPUT$
{
    "startingLine": 10,
    "endingLine": 15
}
$END_HYPOTHETICAL_OUTPUT$

$START_HYPOTHETICAL_OUTPUT$
{
    "startingLine": 5,
    "endingLine": 8
}
$END_HYPOTHETICAL_OUTPUT$


`;
// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "code-patch-locator_v2.ts";
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
