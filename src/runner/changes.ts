
import 'dotenv/config';
import getInput from '@/tools/user_input.js';
import { changeFile, file, rewriteChange } from '@/programs.js';
import { fileExists } from '@/fs/read.js';
import { askToAcceptProposal, proposalFilepath } from '@/tools/propose.js';
import chalk from 'chalk';

const filename = await file(await getInput("What file do you want to change? "));
console.log("Using", chalk.green(filename));
const hasProposal = await fileExists(proposalFilepath(filename));

if (hasProposal) {
    console.log("Proposal Found");
    await askToAcceptProposal(filename, {
        onContinue: async () => await rewriteChange(filename, 'unknown', await getInput("Feedback on this change? "))
    });
} else {
    const change = await getInput("What change do you want to make? ");
    await changeFile(filename, change);
}
