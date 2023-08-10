import fs from 'fs/promises';
import { filepath_within_subdirectory, write_to_subdirectory } from '../fs/subdirectory.js';
import { consoleLogDiff, diff } from './diff.js';
import { askYesNo, askYesNoContinue } from './user_input.js';

/**
 * Creates a new file at: {directory}/.proposal/{filename} and writes the contents to that file.
 *
 * @param filepath - The full path {directory}/{filename}.
 * @param contents - The contents to be written to the file.
 */
export default async function propose(filepath: string, contents: string): Promise<void> {
  await write_to_subdirectory(filepath, ".proposal", contents)
}

async function acceptProposal(filepath: string): Promise<void> {
  try {
    await fs.rename(proposalFilepath(filepath), filepath);
    console.log(`File ${filepath} created successfully.`);
  } catch (error) {
    console.error(`Error creating file: ${error}`);
  }
}

export async function proposalDiff(filepath: string) {
  return await diff(filepath, proposalFilepath(filepath))
}

export function proposalFilepath(filepath: string) {
  return filepath_within_subdirectory(filepath, '.proposal')
}

export async function askToAcceptProposal(
  filename: string,
  { onContinue, onNo }: { onNo?: () => Promise<void>, onContinue?: () => Promise<void> } = {}
) {
  consoleLogDiff(await proposalDiff(filename));
  return askYesNoContinue("Accept Changes?", { onContinue, onNo, onYes: async () => await acceptProposal(filename) })
}


/** Likely, this should just be "askProposalYNC" with only the onNo and onContinue provided */
export async function askDiffYesNoContinue<T>(diff: string | Promise<string>, prompt: string, { onContinue, onNo, onYes }: { onYes?: () => Promise<T>, onNo?: () => Promise<T>, onContinue?: () => Promise<T> }) {
  consoleLogDiff(await diff);
  return askYesNoContinue(prompt, { onContinue, onNo, onYes })
}