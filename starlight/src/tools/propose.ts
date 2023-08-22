import fs from 'fs/promises';
import { filepath_within_subdirectory, write_to_subdirectory } from '../fs/subdirectory.js';
import { consoleLogDiff, diff } from './diff.js';
import { askMultiChoice } from './user_input.js';

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

async function rejectProposal(filepath: string): Promise<void> {
  try {
    await fs.unlink(proposalFilepath(filepath));
    console.log(`Proposal ${filepath} rejected.`);
  } catch (error) {
    console.error(`Error rejecting proposal: ${error}`);
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
  return askMultiChoice("Accept Changes?", {
    'c': onContinue,
    'n': onNo,
    'r': async () => await rejectProposal(filename),
    'y': async () => await acceptProposal(filename)
  })
}