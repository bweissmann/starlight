import read from "@/fs/read";
import { chat } from "@/llm/chat";
import asJSON, { asJSONList } from "@/llm/parser/json";
import { g4_t02, system_dedent, user, user_dedent } from "@/llm/utils";
import { Tx } from "@/project/context";
import {
  appendLineNumbers,
  extractCodeSnippets,
} from "@/tools/source-code-utils";
import { logger } from "@/utils";
import chalk from "chalk";
import { insertDriver } from "./code/insert-driver";
import getInput from "@/tools/user-input";
import { asTripleHashtagList } from "@/llm/parser/triple-hashtag";
import propose, {
  askToAcceptProposal,
  proposalDiff,
  proposalStepFilepath,
} from "@/tools/propose";
import { consoleLogDiff } from "@/tools/diff";

/* 
Purpose: break down a objective-driven coding task in to a sequence of insert/replace/delete implementation tasks
*/
export async function codePlanner(tx: Tx, filename: string, task: string) {
  const step = await codePlannerStep(tx, filename, task);
}

async function codePlannerStep(tx: Tx, filename: string, task: string) {
  const sections = await chat(
    tx,
    g4_t02(
      system_dedent`
            # Objective
            You are a high level programmatic thinker and problem solver. 
            You do not directly modify source code, but you create well-scoped, actionable tasks that an implementation agent can use to modify source code. 
            When presented with a problem, you think broadly about its implications and cascading effects on the codebase.
            For instance, you think about how changing an interface, function signature, or class has downstream effects for its callers.
            You think about separation of concerns and duplication of logic (DRY).

            You will list a series of Actions to accomplish the user's goal.
            
            # Action

            An action represents a locally atomic operation on a source code file.
            Each action only applies to a small, contiguous region of code. 
            Any edits you make across different parts of the file must be modelled as a sequence of distinct, local actions

            Each action has a "type" which can be 
            - insert-only
            - delete-only
            - replace

            Each action has a source code range that it applies to
            - start-lineno
            - end-lineno

            Each action has a description for the implementation agent including what the agent should do and why. 

            Here is the full action JSON spec:
            \`\`\`json
            {
                type: "insert-only" | "delete-only" | "replace",
                start-lineno: number,
                end-lineno: number,
                description: string
            }
            \`\`\`

            # Output Format

            Here is your output format, surrounded by $$start$$ and $$end$$. Do not write the actual words $$start and $$end$$ in your response.

            $$start$$
            ### Task Restatement
            {Restate the task the user wants accomplished. Take some creative license in your reformutation. If you can state the task more clearly or succinctly another way, do so. This reformulation will be used in place of the user's original request, so make sure not to miss any context or details }

            ### Potentially missing context
            {1-3 bullet points on potentially relevant information you do not have}

            ### High Level Solution
            {10-30 words explaining your solution. This should be aimed at your engineering manager and focused on sound architectural decision making}

            ### Tradeoffs
            {0-30 words explaining anything tricky. If the problem is straightforword, say "N/A"}

            ### Proposal
            {
              a bullet pointed list, representing an implementation strategy via actions. Each bullet point should start with an action type in bold
              For example:
              - *replace* ...
              - *insert-only* ...
            }

            ### Actions
            {a series of actions to execute your proposal, each surrounded by THREE backticks.}

            $$end$$
            `,
      user`
            # Source code of ${filename}
            \n${await read(filename).then(appendLineNumbers)}
            `,
      user_dedent`
            # Task
            ${task}
            `
    )
  ).then(asTripleHashtagList);

  const taskRestatement = await getSection(sections, "Task Restatement");
  const plan = await getSection(sections, "Proposal");

  const steps = await getSection(sections, "Actions")
    .then(extractCodeSnippets)
    .then(
      asJSONList<{
        type: "insert-only" | "delete-only" | "replace";
        "start-lineno": number;
        "end-lineno": number;
        description: string;
      }>
    );

  for (let step of steps) {
    if (step.type === "insert-only") {
      await getInput("ready?");
      await insertDriver(
        tx.spawn(),
        filename,
        { ...step, type: "insert-only" },
        { taskRestatement, plan }
      );
    }
  }

  const lastStepProposal = await readLastStepProposal(tx, filename);
  await propose(filename, lastStepProposal);
  consoleLogDiff(await proposalDiff(filename));
  await askToAcceptProposal(filename);
}

async function readLastStepProposal(tx: Tx, filepath: string) {
  if (tx.children.length === 0) {
    throw "tx has no children, cannot read last proposal step";
  }
  const lastStepTx = tx.children.slice(-1)[0];
  return await read(proposalStepFilepath(lastStepTx, filepath));
}

async function getSection(
  sections: {
    identifier: string;
    content: string;
  }[],
  name: string
): Promise<string> {
  const section = sections.find((section) => section.identifier === name);
  if (!section) {
    throw `Section not found: ${name}`;
  }

  return section.content;
}
