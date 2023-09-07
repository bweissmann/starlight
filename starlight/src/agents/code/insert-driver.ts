import read from "@/fs/read";
import { chat } from "@/llm/chat";
import asJSON from "@/llm/parser/json";
import { g4_t02, system_dedent, user } from "@/llm/utils";
import { Tx, indexInParent } from "@/project/context";
import { loadProjectStyleGuide } from "@/project/loaders";
import { consoleLogDiff } from "@/tools/diff";
import propose, {
  printProposalStep,
  proposalDiff,
  proposalStepFilepath,
  proposeStep,
} from "@/tools/propose";
import {
  appendLineNumbers,
  extractCodeSnippets,
  takeAfter,
  takeUntil,
} from "@/tools/source-code-utils";

export type InsertActionSpec = {
  type: "insert-only";
  "start-lineno": number;
  "end-lineno": number;
  description: string;
};

export async function insertDriver(
  tx: Tx,
  filepath: string,
  actionSpec: InsertActionSpec,
  context: { taskRestatement: string; plan: string }
) {
  const file = await readPreviousStep(tx, filepath).then(appendLineNumbers);
  const [rawPositionJSON, insertCodeSnippet] = await chat(
    g4_t02(
      system_dedent`
            # Introduction
            You are a automonous agent specializing in implementation of changes to source code.
            You will INSERT source code according to the task instructions
            
            # Style Guide
            ${await loadProjectStyleGuide(tx)}

            # Background - Task
            For context, here is the original job to be done
            ${context.taskRestatement}

            # Background - Plan
            For context, this is the full plan to complete the task.
            ${context.plan}

            # Instructions
            Here are your specific instructions
            ${actionSpec.description}

            # Input format
            You will be shown a snippet of source code file and choose into which you will insert your change

            # Output format
            Write your output in the following format, betwwen $$start$$ and $$end$$:

            $$start$$
            \`\`\ json
            { "insert after lineno": <line number directly before your change> }
            \`\`\`

            \`\`\`language
            <your code>
            \`\`\`
            $$end$$

            where "language" is the langauge of source code you are writing
            where "<line number directly before your change>" refers to a line number in the input source code snippet
            where "<your code>" is a code snippet meant to replace <WRITE YOUR CODE HERE> in the source code file
            `,
      user`
# Source Code
${takeUntil(file, actionSpec["start-lineno"], 8)}
${takeAfter(file, actionSpec["start-lineno"], 8)}
            `
    )
  ).then(extractCodeSnippets);

  const afterLineNo = await asJSON<{ "insert after lineno": number }>(
    rawPositionJSON
  ).then((obj) => obj["insert after lineno"]);

  await proposeInsert(tx, filepath, afterLineNo, insertCodeSnippet);
}

async function proposeInsert(
  tx: Tx,
  filepath: string,
  afterLineNo: number,
  insertCodeSnippet: string
) {
  const file = await readPreviousStep(tx, filepath);
  const fileContentsWithInsert = [
    ...file.split("\n").slice(0, afterLineNo),
    insertCodeSnippet,
    ...file.split("\n").slice(afterLineNo),
  ].join("\n");
  await proposeStep(tx, filepath, fileContentsWithInsert);
  await printProposalStep(tx, filepath);
}

async function readPreviousStep(tx: Tx, filepath: string) {
  const txIndex = indexInParent(tx);
  if (txIndex === 0) {
    return await read(filepath);
  }

  return await read(
    proposalStepFilepath(tx.parent.children[txIndex - 1], filepath)
  );
}
