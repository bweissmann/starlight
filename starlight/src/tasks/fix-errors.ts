import { codePlanner } from "@/agents/code-planner";
import { executeCommand } from "@/agents/zsh-driver";
import blankspace from "@/blankspace/blankspace";
import { getFilepath } from "@/fs/get-filepath";
import { Tx } from "@/project/context";
import { loadBuildSystemContext } from "@/project/loaders";
import { safely } from "@/utils";

export default async function TASk_fixErrors(tx: Tx) {
  const stdout = await safely(executeCommand, "pnpm run tsc");

  const errors = await blankspace
    .build(
      `
    Take this stdout/stderr output and extract each of the actionable errors so we have them in a list.
    some of the ouput is errors and some is normal stdout
    `
    )
    .with(tx)
    .run([stdout]);

  // todo: Promise.all?
  for (const error of errors) {
    await fixError(tx, error);
  }
}

async function fixError(tx: Tx, error: string) {
  const action = await blankspace
    .build(
      `The user will give you an error message. you'll give instructions to a programmer on how to fix it.
   output this format:
  {
    file: string, // the file to open
    instructions: string // the instructions to the programmer
  }`
    )
    .with(tx)
    .run({
      Context: await loadBuildSystemContext(tx.cx),
      Error: error,
    });

  await codePlanner(
    tx,
    await getFilepath(tx, action.file),
    action.instructions
  );
}
