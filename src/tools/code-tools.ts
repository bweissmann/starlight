import { chatYNQuestion, classifier } from "../llm/classifier.js";
import { ChatContinuationResult, chat } from "../llm/chat.js";
import { appendLineNumbers } from "../understand/utils.js";
import { assistant, cast, system, user } from "../utils.js";
import parseJSON from "../llm/parser/json.js";

export function extractCodeSnippet(input: string | ChatContinuationResult): string {
    return _extractCodeSnippet(typeof input === 'string' ? input : input.message)
}

function _extractCodeSnippet(input: string): string {
    const startMarkerPattern = /```(\w+)/;
    const endMarker = "```";

    const match = input.match(startMarkerPattern);

    if (!match) {
        return input;
    }

    const fullStartMarker = match[0]; // this would be ```languageName
    const startIndex = input.indexOf(fullStartMarker);
    const endIndex = input.indexOf(endMarker, startIndex + fullStartMarker.length);

    if (startIndex === -1 || endIndex === -1) {
        return input;
    }

    return input.substring(startIndex + fullStartMarker.length, endIndex).trim();
}

export async function insertSnippetIntoFile(fileContents: string, code: string) {
    const contentLined = appendLineNumbers(fileContents)
    const preamble = [
        system(`
        You will be given the original source code of a file and a snippet of code which is an update to that file. 
        You will identify where in the original file the patch should be applied.
        `),
        user('Here is the file'),
        assistant(contentLined),
        user('Here is the patch'),
        assistant(code),
    ]

    const isEntireFile = await chatYNQuestion([
        ...preamble,
        user(`
        Does the snippet represent a portion of the file? Or does it represent a replacement for the entire file? 
        Keep in mind that it is extremely unexpected for large portions of a file to be completely deleted, and files ususlly start with imports.
        Respond true if it is the whole file, false if its a portion.
        `)
    ], { model: 'gpt-3.5-turbo' })

    if (isEntireFile) {
        return code
    }

    const { startingLine, endingLine } = await chat([
        ...preamble,
        user(`
        Decide what portion of the original file shuold be replaced with this patch.
        Respond with the line number of the first line to be replaced and the line number of the last line to be replaced.
        
        Respond in JSON format and say nothing else. Do not write anything outside of the code fence.

        Reponse Format:
        \`\`\`json
        {
            startingLine: <number>,
            endingLine: <number>
        }
        \`\`\`
        `)
    ])
        .then(extractCodeSnippet)
        .then(parseJSON<{ startingLine: number, endingLine: number }>)

    return [
        fileContents.split("\n").slice(0, startingLine - 1).join("\n"),
        code,
        fileContents.split("\n").slice(endingLine - 1).join("\n")
    ].join("\n")

}