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
    Generate a fictional user profile with name, age, location, interests (all strings)
    who is in the target audience of our product
    ` as const;

const prompt = `
Hello,

Your task is to create a fictional user profile that represents the target audience of a specific product. The profile should include details such as the individual's name, age, location, and interests. All these details should be in string format. Please refer to the user messages for information about the product and its target audience.

\`\`\`instructions
Write your response in the following format:

\`\`\`json
{
    "name": "string",
    "age": "string",
    "location": "string",
    "interests": ["string", "string", ...]
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
    "name": "Emma Johnson",
    "age": "32",
    "location": "New York City, USA",
    "interests": ["traveling", "reading", "yoga"]
}
$END_HYPOTHETICAL_OUTPUT$

$START_HYPOTHETICAL_OUTPUT$
{
    "name": "Michael Smith",
    "age": "45",
    "location": "London, UK",
    "interests": ["cooking", "hiking", "photography"]
}
$END_HYPOTHETICAL_OUTPUT$


`;
// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "generate-user-profile_v4.ts";
  inferred: {
    inputs: string[];
    returns: {
      name: string;
      age: string;
      location: string;
      interests: string[];
    };
  };
};
export const emptyinstance: Prompt = {} as Prompt;
export const Impl: ImplOf<Prompt> = {
  spec: spec,
  forward,
};
