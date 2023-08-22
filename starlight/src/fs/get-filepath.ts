import { execute } from '@/llm/chat.js';
import { query } from '@/llm/utils.js';
import { MaybePromise } from '@/utils.js';
import ls from '@/fs/ls.js';
import pretty_print_directory from '@/fs/pretty_print_directory.js';
import { respondInJSONFormat } from '@/implement/utils.js';
import { subsequenceMatch } from '@/tools/search.js';

/** Attempt to get a file by name in the src directory. */
export async function getFilepath(_name: MaybePromise<string>) {
    const name = await _name

    async function askForPathAmongOptions(options: string[], name: string) {
        return execute(query<{ path: string }>({
            name: "Get File By Name",
            jsonSpec: `{ path: string }`,
            messages: (jsonSpec) => [
                pretty_print_directory(options),
                `the user is asking for a filepath, but they are being vague about the name.
                The file they want is somewhere in this directory structure. What are the options for what they might be asking for?
                Here is the name they provided: "${name}".
    
                If the file exists in directory "dir" and also in "dir/.proposal", then pick the one in the root directory, not the proposal directory.
                Do not use .proposal files unless necessary. 
                
                ${respondInJSONFormat(jsonSpec)}`
            ],
        })).then(({ path }) => path)
    }

    const dirs = (await ls('./src')).filter(file => !file.includes('.proposal'));

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