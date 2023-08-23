import getInput, { askMultiChoice } from '@/tools/user_input.js';
import { rewriteChange } from '@/programs.js';
import { fileExists } from '@/fs/read.js';
import { askToAcceptProposal, proposalFilepath } from '@/tools/propose.js';
import chalk from 'chalk';
import ls from '@/fs/tree.js';
import { getFilepath } from '@/fs/get-filepath.js';
import { codeDriver } from '@/agents/code-driver-by-line-number.js';
import { filenameOf } from '@/fs/utils.js';

export async function findAndModifyFile(filename?: string) {
    const filepath = filename ?? await getFilepath(getInput("What file do you want to change? "));
    console.log("Using", chalk.green(filepath));

    if (await fileExists(proposalFilepath(filepath))) {
        console.log("Proposal Found");
        await askToAcceptProposal(filepath, {
            onContinue: async () => await rewriteChange(filepath, 'unknown', await getInput("Feedback on this change? "))
        });
    } else {
        const task = await getInput("What change do you want to make? ");
        await codeDriver(filepath, task);
    }

    await askMultiChoice(`any other changes for ${filenameOf(filepath)}?`, {
        'y': async () => {
            await findAndModifyFile(filepath)
        },
        'n': async () => { }
    })
}