import { createInterface } from "readline";
import { consoleLogDiff } from "./diff.js";

export default async function getInput(prompt: string) {
    const reader = createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    return new Promise<string>((resolve, reject) => {
        reader.question(prompt, (answer) => {
            resolve(answer);
            reader.close()
        })
    })
}

export async function askYesNo(prompt: string) {
    const _prompt = prompt.endsWith(" ") ? prompt : prompt + " ";

    const answer = await getInput(_prompt)
    return ['y', 'Y'].includes(answer.trim())
}

export async function askYesNoContinue<T>(prompt: string, { onContinue, onNo, onYes }: { onYes?: () => Promise<T>, onNo?: () => Promise<T>, onContinue?: () => Promise<T> }) {
    const _prompt = prompt.endsWith(" ") ? prompt : prompt + " ";

    const answer = await getInput(_prompt + "(y/n/c) ").then(ans => ans.trim())
    if (['y', 'Y'].includes(answer)) {
        return onYes?.()
    } else if (['c', 'C'].includes(answer)) {
        return onContinue?.()
    } else {
        return onNo?.()
    }
}