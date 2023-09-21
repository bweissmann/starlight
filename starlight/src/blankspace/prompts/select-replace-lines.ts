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
        }
    ` as const;

const prompt = `
Hello,

Your task is to analyze a given file and a patch that is meant to replace a portion of this file. You need to determine which part of the original file should be replaced with the patch. The information about the file and the patch will be provided in the following messages.

Your response should indicate the line number of the first line to be replaced and the line number of the last line to be replaced. However, you are free to choose the format of your response.

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
    "startingLine": 5,
    "endingLine": 12
}
$END_HYPOTHETICAL_OUTPUT$

$START_HYPOTHETICAL_OUTPUT$
{
    "startingLine": 2,
    "endingLine": 8
}
$END_HYPOTHETICAL_OUTPUT$


`;
// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "select-replace-lines.ts";
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
