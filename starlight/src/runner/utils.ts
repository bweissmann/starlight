import getInput, { askMultiChoice } from "@/tools/user-input";
import { fileExists } from "@/fs/read";
import { askToAcceptProposal, proposalFilepath } from "@/tools/propose";
import chalk from "chalk";
import { getFilepath } from "@/fs/get-filepath";
import { codeDriver } from "@/agents/code-driver-by-line-number";
import { filenameOf } from "@/fs/utils";
import { Tx } from "@/project/context";

export async function modifyFile(tx: Tx, filename?: string) {
  const filepath =
    filename ??
    (await getFilepath(
      tx.spawn(),
      getInput("What file do you want to change? ")
    ));
  console.log("Using", chalk.green(filepath));

  if (await fileExists(proposalFilepath(filepath))) {
    console.log("Proposal Found");
    await askToAcceptProposal(filepath, {
      onContinue: async () => {
        throw "unimplemented";
      },
    });
  } else {
    const task = await getInput("What change do you want to make? ");
    await codeDriver(tx.spawn(), filepath, task);
  }

  await askMultiChoice(`any other changes for ${filenameOf(filepath)}?`, {
    y: async () => {
      await modifyFile(tx.spawn(), filepath);
    },
    n: async () => {},
  });
}
