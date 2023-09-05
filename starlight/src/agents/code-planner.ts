import read from "@/fs/read";
import { chat } from "@/llm/chat";
import { g4_t02, system_dedent, user, user_dedent } from "@/llm/utils";
import { Rx, Tx } from "@/project/context";
import { appendLineNumbers, extractCodeSnippets } from "@/tools/source-code-utils";
import { logger } from "@/utils";
import chalk from "chalk";

/* 
Purpose: break down a objective-driven coding task in to a sequence of insert/replace/delete implementation tasks
*/
export async function codePlanner(rx: Rx, filename: string, task: string) {
    const step = await codePlannerStep(rx.spawn(), filename, task)
}

async function codePlannerStep(tx: Tx, filename: string, task: string) {
    const response = await chat(
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

            Here is the full action spec:
            \`\`\`action
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
            # Problem statement
            {10-20 words identifying the problem}

            # Potentially missing context
            {1-3 bullet points on potentially relevant information you do not have}

            # High Level Solution
            {10-30 words explaining your solution. This should be aimed at your engineering manager and focused on sound architectural decision making}

            # Your solution would be wrong if...
            {1-3 bullet points explaining scenarios in which you would be wrong given more unknown information. If none, say "N/A"}

            # Counterargument
            {0-30 words proposing a criticism of this change, why is should not be done this way, or prostilitizing an alternative. If none, say "N/A"}

            # Tradeoffs
            {0-30 words explaining anything tricky. If the problem is straightforword, say "N/A"}

            # Proposal
            {a bullet pointed list, representing an implementation strategy via actions. Each bullet point should start with an action type (insert-only, replace, delete-only) in bold}

            # Actions
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
    ).then(extractCodeSnippets).then(logger(chalk.red))
}