import { ChatContinuationResult, chat, sequence } from './llm/chat';
import { g4, system, assistant, user, g35 } from './llm/utils';
import { MaybePromise, isString } from './utils';
import propose, { askToAcceptProposal, proposalDiff } from './tools/propose';
import read, { fileExists } from './fs/read';
import { appendLineNumbers, extractPossibleCodeSnippet, insertSnippetIntoFile, stripLineNumbers } from './tools/source-code-utils';
import getInput from './tools/user_input';
import { getFilepath } from './fs/get-filepath';
import { loadProjectStyleGuide } from './project/loaders';
import chalk from 'chalk';

export async function change(filenameOrFilepath: MaybePromise<string>, request: string, projectDirectory: string) {
    await getInput(chalk.bgRed.white.bold("** Using Legacy Change System"))
    filenameOrFilepath = await filenameOrFilepath
    if (await fileExists(filenameOrFilepath)) {
        return _change(filenameOrFilepath, request, projectDirectory)
    } else {
        return _change(await getFilepath(filenameOrFilepath), request, projectDirectory)
    }
}

async function _change(filepath: string, request: string, projectDirectory: string) {
    const fileContents = await read(filepath)

    const response = await sequence([
        g4(
            system(`You are an expert programmer. Make the requested changes to the file provided.
            ${await loadProjectStyleGuide(projectDirectory)}`),

            user(`cat ${filepath}`),
            assistant(appendLineNumbers(fileContents)),
            user(request),
            system(`Write one to two sentences to show your understanding of the issue.`)
        ),
        g4(
            system(`
            Write a code snippet that will make the change.
            Write your response as the shortest snippet possible that will make the change. 
            Do not copy-paste the rest of the file in your response.

            Write code betwwen code fences: 
            \`\`\`language
            <your code>
            \`\`\`
            `),
        ),
    ])

    await saveCodeSnippetAsProposal(filepath, response, fileContents)

    await askToAcceptProposal(filepath, {
        onContinue: async () => await rewriteChange(filepath, request, await getInput("Feedback on this change? ")),
    })
}

export async function rewriteChange(filename: string, originalChangeInstructions: string, feedback: string) {
    await getInput(chalk.bgRed.white.bold("** Using Legacy Rewrite System"))
    const fileContents = await read(filename)

    const response = await chat(g35(
        system(`The user asked for a change to be made to the file ${filename}. The AI proposed a change and the user has feedback on that change. update the change as the user asks.`),
        system(`Here's the original file`),
        fileContents,
        system(`Here's the original change the user asked for`),
        originalChangeInstructions,
        system(`Here's the proposed change by the AI`),
        assistant(await proposalDiff(filename)),
        system(`Here's the user's feedback on the change`),
        feedback,
        system(`Respond with just a code snippet, not a diff`),
    ))
    await saveCodeSnippetAsProposal(filename, response, fileContents)

    await askToAcceptProposal(filename, {
        onContinue: async () => await rewriteChange(filename, originalChangeInstructions + " // " + feedback, await getInput("Feedback on this change? ")),
    })
}

export async function saveCodeSnippetAsProposal(filename: string, input: string | ChatContinuationResult, fileContents?: string) {
    if (fileContents === undefined) {
        fileContents = await read(filename)
    }
    let codeSnippet = extractPossibleCodeSnippet(input)
    if (codeSnippet.split("\n").every(line => line.match(/(\d+)\./) !== null)) {
        codeSnippet = stripLineNumbers(codeSnippet)
    }
    const newCode = await insertSnippetIntoFile(fileContents, codeSnippet)

    await propose(filename, newCode)
}
