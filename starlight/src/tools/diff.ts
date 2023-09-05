import { createPatch } from 'diff';
import read, { readOrEmptyString } from '../fs/read';
import chalk from 'chalk';

export async function diff(filename1: string, filename2: string): Promise<string> {
    const content1 = await readOrEmptyString(filename1);
    const content2 = await readOrEmptyString(filename2);
    return createPatch(filename1, content1, content2);
}

export function consoleLogDiff(diff: string) {
    return console.log(diff.split("\n").map(line => colorLine(line)).join("\n"))
}

function colorLine(line: string) {
    if (line.startsWith("+")) {
        return chalk.green(line)
    }

    if (line.startsWith("-")) {
        return chalk.red(line)
    }

    return line
}