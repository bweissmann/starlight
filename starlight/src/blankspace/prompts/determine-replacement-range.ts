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
Decide what portion of the original file shuold be replaced with this patch.
Respond with the line number of the first line to be replaced and the line number of the last line to be replaced.

Reponse Format:
{
    startingLine: <number>,
    endingLine: <number>
}` as const;

const prompt = `
Hello,
Your task is to analyze a given patch and the original file it is meant for. You need to determine which section of the original file should be replaced by the patch. The result should be the line numbers of the first and last lines to be replaced in the original file. The information about the patch and the original file will be provided in the subsequent user messages.

Please note that the receiver is free to respond in any format they prefer.

\`\`\`instructions
Write your response in the following format:

\`\`\`json
{
    "startingLine": <number>,
    "endingLine": <number>
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


$START_HYPOTHETICAL_OUTPUT$
{
    "startingLine": 10,
    "endingLine": 15
}
$END_HYPOTHETICAL_OUTPUT$

$START_HYPOTHETICAL_OUTPUT$
{
    "startingLine": 25,
    "endingLine": 35
}
$END_HYPOTHETICAL_OUTPUT$


`;
// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "determine-replacement-range.ts";
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
