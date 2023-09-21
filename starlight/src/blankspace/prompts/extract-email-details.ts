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
    Extract from this email:
    - All entites (places, people, events)
    - Who is sending it
    - Who is the intented reciever
    - Why the email was sent. 
    ` as const;

const prompt = `
Hello,

You have an email message to analyze. Your task is to extract the following information from the content of the email:

1. Identify all entities mentioned in the email. This includes places, people, and events.
2. Determine who the sender of the email is.
3. Identify the intended receiver of the email.
4. Understand and explain the purpose or reason why the email was sent.

You will find the email content in the subsequent user messages.

\`\`\`instructions
Write your response in the following format:

First, provide the entities found in the email. Each type of entity (places, people, events) should be listed in a separate code block. Use the language identifier "json" for these blocks.

\`\`\`json
{
    "places": [string, string, ...],
    "people": [string, string, ...],
    "events": [string, string, ...]
}
\`\`\`

Next, identify the sender of the email. This should be in a separate code block marked as "json".

\`\`\`json
{
    "sender": string
}
\`\`\`

Then, identify the intended receiver of the email. This should also be in a separate code block marked as "json".

\`\`\`json
{
    "receiver": string
}
\`\`\`

Finally, explain why the email was sent. This should be in a final code block marked as "json".

\`\`\`json
{
    "purpose": string
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
  const snippets = extractFencedSnippets(raw);
  const entities = asJSON<{
    places: string[];
    people: string[];
    events: string[];
  }>(snippets[0]);
  const sender = asJSON<{ sender: string }>(snippets[1]).sender;
  const receiver = asJSON<{ receiver: string }>(snippets[2]).receiver;
  const purpose = asJSON<{ purpose: string }>(snippets[3]).purpose;

  return {
    entities,
    sender,
    receiver,
    purpose,
  };
}

const hypotheticalResponses = `


$START_HYPOTHETICAL_OUTPUT$
{
    "places": ["New York", "San Francisco"],
    "people": ["John Smith", "Jane Doe"],
    "events": ["meeting", "conference"]
}
$END_HYPOTHETICAL_OUTPUT$

$START_HYPOTHETICAL_OUTPUT$
{
    "places": ["London", "Paris"],
    "people": ["Alice Brown", "Bob Johnson"],
    "events": ["presentation", "workshop"]
}
$END_HYPOTHETICAL_OUTPUT$

$START_HYPOTHETICAL_OUTPUT$
{
    "sender": "John Smith"
}
$END_HYPOTHETICAL_OUTPUT$

$START_HYPOTHETICAL_OUTPUT$
{
    "sender": "Alice Brown"
}
$END_HYPOTHETICAL_OUTPUT$

$START_HYPOTHETICAL_OUTPUT$
{
    "receiver": "Jane Doe"
}
$END_HYPOTHETICAL_OUTPUT$

$START_HYPOTHETICAL_OUTPUT$
{
    "receiver": "Bob Johnson"
}
$END_HYPOTHETICAL_OUTPUT$

$START_HYPOTHETICAL_OUTPUT$
{
    "purpose": "To discuss the details of the upcoming meeting in New York."
}
$END_HYPOTHETICAL_OUTPUT$

$START_HYPOTHETICAL_OUTPUT$
{
    "purpose": "To share the presentation slides for the workshop in Paris."
}
$END_HYPOTHETICAL_OUTPUT$


`;
// ------------------------------------------
// ------------------------------------------

export type Prompt = {
  spec: typeof spec;
  filename: "extract-email-details.ts";
  inferred: {
    inputs: string[];
    returns: {
      entities: {
        places: string[];
        people: string[];
        events: string[];
      };
      sender: string;
      receiver: string;
      purpose: string;
    };
  };
};
export const emptyinstance: Prompt = {} as Prompt;
export const Impl: ImplOf<Prompt> = {
  spec: spec,
  forward,
};
