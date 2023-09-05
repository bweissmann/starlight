import getInput, { askMultiChoice } from '@/tools/user_input';
import { rewriteChange } from '@/programs';
import { fileExists } from '@/fs/read';
import { askToAcceptProposal, proposalFilepath } from '@/tools/propose';
import chalk from 'chalk';
import { getFilepath } from '@/fs/get-filepath';
import { codeDriver } from '@/agents/code-driver-by-line-number';
import { filenameOf } from '@/fs/utils';
export async function modifyFile(filename?: string) {
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
            await modifyFile(filepath)
        },
        'n': async () => { }
    })
}