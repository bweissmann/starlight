import { Cx } from "@/project/context.js";

export function subsequenceMatch(query: string, candidate: string): boolean {
    let j = 0; // Index for query
    for (let i = 0; i < candidate.length && j < query.length; i++) {
        if (candidate.charAt(i) == query.charAt(j)) {
            j++;
        }
    }
    // If all characters of query were found in the candidate in order
    return (j == query.length);
}
import read from "@/fs/read.js";
import tree from "@/fs/tree.js";

/* global search, like in code IDEs. returns matches with metadata of the file, line, column of the match*/
export async function globalSearch(cx: Cx, query: string) {
    /** WARNING: gpt-4 wrote this and its super broken. dont use */
    const files = await tree(cx.projectDirectory);
    let matches = [];
    for (let file of files) {
        const content = await read(file);
        let lines = content.split('\n');
        let queryLines = query.split('\n');
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            let start = 0;
            while (line.includes(query, start)) {
                let index = line.indexOf(query, start);
                let match = {
                    file: file,
                    line: i + 1,
                    column: index + 1
                };
                matches.push(match);
                start = index + query.length;
            }
        }
    }
    return matches;
}