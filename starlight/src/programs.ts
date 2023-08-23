import { ChatContinuationResult, chat, sequence } from './llm/chat.js';
import { g4, system, assistant, user } from './llm/utils.js';
import { MaybePromise } from './utils.js';
import propose, { askToAcceptProposal, proposalDiff } from './tools/propose.js';
import read, { fileExists } from './fs/read.js';
import { appendLineNumbers, extractPossibleCodeSnippet, insertSnippetIntoFile, stripLineNumbers } from './tools/source-code-utils.js';
import getInput from './tools/user_input.js';
import { getFilepath } from './fs/get-filepath.js';
import { loadProjectStyleGuide } from './project/loaders.js';

export async function change(filenameOrFilepath: MaybePromise<string>, request: string, projectDirectory: string) {
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
    const fileContents = await read(filename)

    const response = await chat([
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
    ])

    await saveCodeSnippetAsProposal(filename, response, fileContents)

    await askToAcceptProposal(filename, {
        onContinue: async () => await rewriteChange(filename, originalChangeInstructions + " // " + feedback, await getInput("Feedback on this change? ")),
    })
}

export async function saveCodeSnippetAsProposal(filename: string, input: string | ChatContinuationResult, fileContents?: string) {
    if (fileContents === undefined) {
        fileContents = await read(filename)
    }
    const message = typeof input === "string" ? input : input.message
    let codeSnippet = extractPossibleCodeSnippet(message)
    if (codeSnippet.split("\n").every(line => line.match(/(\d+)\./) !== null)) {
        codeSnippet = stripLineNumbers(codeSnippet)
    }
    const newCode = await insertSnippetIntoFile(fileContents, codeSnippet)

    await propose(filename, newCode)
}
