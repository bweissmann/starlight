import { sequence } from "@/llm/chat";
import asJSON from "@/llm/parser/json";
import { g4, system } from "@/llm/utils";
import { Cx, Tx } from "@/project/context";
import { extractCodeSnippets } from "@/tools/source-code-utils";
import { logger } from "@/utils";
import dedent from "dedent";

type SearchAction = {
  tool: "search";
  queries: string[];
};

type ExecuteReplanAction = {
  tool: "execute then replan";
};

type ToolAction = SearchAction | ExecuteReplanAction;

export default async function gatherContext(tx: Tx, input: string) {
  const initialPlan = await sequence(tx, [
    g4(
      system(dedent`
            # Objective
            The user wants help with some modification to their codebase.
            Make a plan for how to help them.

            # Tools
            ${tools}

            # Example
            ${fewShots}
            `),
      input
    ),
  ])
    .then(extractCodeSnippets)
    .then(logger())
    .then((snippets) => snippets.map(asJSON<ToolAction>))
    .then(async (actions) => await Promise.all(actions));
}

async function executePlan(plan: ToolAction[]) {
  const results = [];
  for (const action of plan) {
    switch (action.tool) {
      case "search":
        const searchResults = [];
        for (const query of action.queries) {
          const searchResult = await {};
          searchResults.push(searchResult);
        }
        results.push(searchResults);
        break;
      case "execute then replan":
        return results;
      default:
        throw new Error(`Unknown tool: ${action}`);
    }
  }
  return results;
}

const tools = [
  "search: global search for a term in project",
  "execute then replan: the results of previous steps are necessary for future planning",
];

const fewShots = `
## Input
make another version of propose that takes in context

## Output
Task
This seems like a straightforword change to add a new class/function/variable to the project

Plan
1. *search*: search for "propose"
presumably propose refers to a class, function, or variable in the codebase
\`\`\`json
{ "tool": "search", "queries": ["propose"] }
\`\`\`
2. *search*: search for "context"
context might be a class, struct, type or interface in the codebase, or a concept from a third party library
\`\`\`json
{ "tool": "search", "queries": ["context"] }
\`\`\`
3. *execute then replan*
if we find propose and context, we can implement the change, otherwise we might need to look at what third party libraries are used or ask the user for clarification 

## Input
execute plan should return a list of results and a list of unexecuted steps

## Ouput
Task
This seems like they want to modify a return value from a function. We likely need to change the function signature, the implementation of the function, and any callsites.

Plan
1. *search*: search for "execute plan"
We need to find the function to modify.
\`\`\`json
{ "tool": "search", "queries": ["execute_plan", "executePlan", "executeplan"] }
\`\`\`
2. *execute then replan*
If we can't find the function we should expand our search to other variants or ask for clarification.
...
`;
