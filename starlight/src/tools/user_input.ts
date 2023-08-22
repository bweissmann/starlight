import { createInterface } from "readline";

export default async function getInput(prompt: string = "> ") {
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

export async function askYesNoContinue<T>(prompt: string, { onContinue, onNo, onYes }: {
    onYes?: () => Promise<T>,
    onNo?: () => Promise<T>,
    onContinue?: () => Promise<T>
}) {
    const choices = {
        'y': onYes,
        'n': onNo,
        'c': onContinue
    }
    return askMultiChoice(prompt, choices);
}

export async function askMultiChoice<T>(prompt: string, choices: Record<string, (() => Promise<T>) | undefined>) {
    const _prompt = prompt.endsWith(" ") ? prompt : prompt + " ";
    const choicesPrompt = Object.keys(choices).join("/");
    const answer = await getInput(_prompt + "(" + choicesPrompt + ") ").then(ans => ans.trim());
    const choice = Object.entries(choices).find(([text, _callback]) => text.toLowerCase() === answer.toLowerCase());
    if (choice) {
        return await choice[1]?.();
    }
}
