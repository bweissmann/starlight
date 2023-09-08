import fs from 'fs/promises';
import { filepath_within_subdirectory, write_to_subdirectory } from '../fs/subdirectory';
import { consoleLogDiff, diff } from './diff';
import { askMultiChoice } from './user-input';
import path from 'path';
import { Tx, indexInParent } from '@/project/context';
import write from '@/fs/write';

/**
 * Creates a new file at: {directory}/.proposal/{filename} and writes the contents to that file.
 *
 * @param filepath - The full path {directory}/{filename}.
 * @param contents - The contents to be written to the file.
 */
export default async function propose(filepath: string, contents: string): Promise<void> {
  await write_to_subdirectory(filepath, ".proposal", contents)
}

export async function proposeStep(tx: Tx, filepath: string, contents: string): Promise<void> {
  await write({ filepath: proposalStepFilepath(tx, filepath) }, contents)
}

export async function printProposalStep(tx: Tx, filepath: string) {
  const proposalDiff = await diff(filepath, proposalStepFilepath(tx, filepath))
  consoleLogDiff(proposalDiff);
}

async function acceptProposal(filepath: string): Promise<void> {
  try {
    await fs.rename(proposalFilepath(filepath), filepath);
    console.log(`File ${filepath} created successfully.`);
  } catch (error) {
    console.error(`Error creating file: ${error}`);
  }
}

async function rejectProposal(filepath: string): Promise<void> {
  try {
    await fs.unlink(proposalFilepath(filepath));
    await cleanUpProposalDirectory(filepath);
    console.log(`Proposal ${filepath} rejected.`);
  } catch (error) {
    console.error(`Error rejecting proposal: ${error}`);
  }
}

export async function cleanUpProposalDirectory(filepath: string) {
  const proposalDirectory = path.join(path.dirname(filepath), '.proposal')
  const isProposalDirectoryEmpty = (await fs.readdir(proposalDirectory)).length === 0;
  if (isProposalDirectoryEmpty) {
    await fs.rmdir(proposalDirectory);
  }
}

export async function proposalDiff(filepath: string) {
  return await diff(filepath, proposalFilepath(filepath))
}

export function proposalStepFilepath(tx: Tx, filepath: string) {
  return filepath_within_subdirectory(filepath, path.join(".proposal", tx.cx.name, `intermediate${indexInParent(tx)}`))
}

export function proposalFilepath(filepath: string) {
  return filepath_within_subdirectory(filepath, '.proposal')
}

export async function askToAcceptProposal(
  filename: string,
  { onContinue, onNo }: { onNo?: () => Promise<void>, onContinue?: () => Promise<void> } = {}
) {
  consoleLogDiff(await proposalDiff(filename));
  return askMultiChoice("Accept Changes?", {
    'c': onContinue ?? (async () => { }),
    'n': onNo ?? (async () => { }),
    'r': async () => await rejectProposal(filename),
    'y': async () => await acceptProposal(filename)
  })
}