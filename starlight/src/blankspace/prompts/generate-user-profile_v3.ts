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
    ` as const;

const prompt = `
Hello,
Your task is to create a fictional user profile. The profile should include the following details: name, age, location, and interests. All these details should be in string format. Please note that the specific information for each of these categories will be provided in the user messages.

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
  return asJSON<Prompt["inferred"]["returns"]>(raw);
}

const hypotheticalResponses = `


$START_HYPOTHETICAL_OUTPUT$
{
    "name": "John Doe",
    "age": "25",
    "location": "New York",
    "interests": ["reading", "playing guitar", "hiking"]
}
$END_HYPOTHETICAL_OUTPUT$

$START_HYPOTHETICAL_OUTPUT$
{
    "name": "Emily Smith",
    "age": "32",
    "location": "Los Angeles",
    "interests": ["painting", "cooking", "traveling"]
}
$END_HYPOTHETICAL_OUTPUT$


`;
// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "generate-user-profile_v3.ts";
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
