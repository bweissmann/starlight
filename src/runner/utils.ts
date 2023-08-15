import getInput from '@/tools/user_input.js';
import { change, file, rewriteChange } from '@/programs.js';
import { fileExists } from '@/fs/read.js';
import { askToAcceptProposal, proposalFilepath } from '@/tools/propose.js';
import chalk from 'chalk';

export async function findAndModifyFile() {
    const filename = await file(getInput("What file do you want to change? "));
    console.log("Using", chalk.green(filename));

    if (await fileExists(proposalFilepath(filename))) {
        console.log("Proposal Found");
        await askToAcceptProposal(filename, {
            onContinue: async () => await rewriteChange(filename, 'unknown', await getInput("Feedback on this change? "))
        });
    } else {
        const request = await getInput("What change do you want to make? ");
        await change(filename, request);
    }
}