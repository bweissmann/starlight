import { chat } from '@/llm/chat';
import { MaybePromise } from '@/utils';
import tree from '@/fs/tree';
import pretty_print_directory from '@/fs/pretty_print_directory';
import { subsequenceMatch } from '@/tools/search';
import { extractPossibleCodeSnippet } from '@/tools/source-code-utils';
import asJSON from '@/llm/parser/json';
import path from 'path';
import dedent from 'dedent';
import { g35 } from '@/llm/utils';
/** Attempt to get a file by name in the src directory. */
export async function getFilepath(_name: MaybePromise<string>) {
    const name = await _name

    async function askForPathAmongOptions(options: string[], name: string) {
        return chat(
            g35(
                pretty_print_directory(options),
                dedent`
                the user is asking for a filepath, but there isn't a single filename that matches the name they provided.
                The file they want is somewhere in this directory structure. What is the most likely filepath they are asking for?
                
                Here is the name they provided: "${name}".
                
                Respond in the following JSON foramt:
                \`\`\`json
                {
                    path: string
                }
                \`\`\`
                `
            )
        )
            .then(extractPossibleCodeSnippet)
            .then(asJSON<{ path: string }>)
            .then((result) => path.resolve(result.path))
    }

    const dirs = (await tree('.')).filter(file => !file.includes('.proposal'));

    // prefer an exact match
    const exactMatches = dirs.filter(file => file.includes(name))
    if (exactMatches.length === 1) {
        return exactMatches[0]
    } else if (exactMatches.length > 1) {
        return askForPathAmongOptions(exactMatches, name)
    }

    // No exact matches
    const nameNoWhitespace = name.replace(/\s/g, '')
    const subsequenceMatches = dirs.filter(file => subsequenceMatch(nameNoWhitespace, file))
    if (subsequenceMatches.length === 1) {
        return subsequenceMatches[0]
    }

    const options = subsequenceMatches.length > 0 ? subsequenceMatches : dirs;
    return askForPathAmongOptions(options, name)
}