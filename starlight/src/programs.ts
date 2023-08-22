import implement from './implement/main.js';
import { appendLineNumbers, stripLineNumbers } from './understand/utils.js';
import typescript_to_json_spec from './implement/bits/typescript_to_json_spec.js';
import { ChatContinuationResult, chat, sequence, execute } from './llm/chat.js';
import { g4, unstructured } from './llm/utils.js';
import { MaybePromise, assistant, system, user, vomit } from './utils.js';
import parse_ts_types_from_file from './understand/parse/ts_types.js';
import parse_top_level_functions from './understand/parse/top_level_functions.js';
import propose, { askToAcceptProposal, proposalDiff } from './tools/propose.js';
import read, { fileExists } from './fs/read.js';
import { extractSingleCodeSnippet, insertSnippetIntoFile } from './tools/code-snippets.js';
import { bensStyleGuide } from './implement/utils.js';
import getInput from './tools/user_input.js';
import { getFilepath } from './fs/get-filepath.js';

export async function writeJSONSpec(filename: string) {
    const rawFile = await read(filename)
    const fileContents = appendLineNumbers(rawFile)

    const ts_type = (await execute(
        parse_ts_types_from_file(
            fileContents
        ))).types[0].code

    const json_spec = await execute(
        typescript_to_json_spec(
            ts_type
        )
    )

    const add_json_to_file = await execute(
        unstructured({
            name: "Add JSON Spec",
            messages: [
                system(`Here is the source code of a typescript file`),
                assistant(fileContents),
                system("Here is a JSON Spec"),
                assistant(json_spec),
                system(`
                Replace the existing JSON Spec in the source file with the new one. 
                It will be a property called "jsonSpec" in the query object. 
                Be sure to surround the spec with backticks to its a valid js string.

                Rewrite the entire file, starting at line [1] and ending at the last [line]
                `)
            ]
        })
    )

    await askToAcceptProposal(filename)
}

export async function readAndWrite(filename: string) {
    const contents = await execute(
        parse_top_level_functions(
            await read(filename)
        )
    )

    implement(`
    Implement this function in node/typescript:
    Keep the jsdoc string.

    ${vomit(contents.functions[0])}
    `)
}


export async function change(filenameOrFilepath: MaybePromise<string>, request: string) {
    filenameOrFilepath = await filenameOrFilepath
    if (await fileExists(filenameOrFilepath)) {
        return _change(filenameOrFilepath, request)
    } else {
        return _change(await getFilepath(filenameOrFilepath), request)
    }
}

async function _change(filepath: string, request: string) {
    const fileContents = await read(filepath)

    const response = await sequence([
        g4(
            system(`You are an expert programmer. Make the requested changes to the file provided.
            ${bensStyleGuide}`),
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
    let codeSnippet = extractSingleCodeSnippet(message)
    if (codeSnippet.split("\n").every(line => line.match(/(\d+)\./) !== null)) {
        codeSnippet = stripLineNumbers(codeSnippet)
    }
    const newCode = await insertSnippetIntoFile(fileContents, codeSnippet)

    await propose(filename, newCode)
}
