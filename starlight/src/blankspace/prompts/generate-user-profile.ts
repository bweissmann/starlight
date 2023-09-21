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
Generate a fictional user with name,age,location,interests, all strings who is the target audience for our product 
` as const;

const prompt = `
Hello,

Your task is to create a fictional user profile. This profile should include the user's name, age, location, and interests. All these attributes should be represented as strings. This fictional user is intended to represent the target audience for a specific product.

Please refer to the user messages for any additional information or specific details that may be provided.

\`\`\`instructions
Write your response in the following format:

\`\`\`json
{
    "name": "string",
    "age": "string",
    "location": "string",
    "interests": "string"
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
    "name": "John Doe",
    "age": "25",
    "location": "New York City",
    "interests": "hiking, photography, cooking"
}
$END_HYPOTHETICAL_OUTPUT$

$START_HYPOTHETICAL_OUTPUT$
{
    "name": "Emma Smith",
    "age": "35",
    "location": "Los Angeles",
    "interests": "painting, yoga, reading"
}
$END_HYPOTHETICAL_OUTPUT$


`;
// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "generate-user-profile.ts";
  inferred: {
    inputs: string[];
    returns: {
      name: string;
      age: string;
      location: string;
      interests: string;
    };
  };
};
export const emptyinstance: Prompt = {} as Prompt;
export const Impl: ImplOf<Prompt> = {
  spec: spec,
  forward,
};
