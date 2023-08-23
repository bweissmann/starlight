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

export async function askMultiChoice<T>(prompt: string, choices: Record<string, () => Promise<T>> & { 'n': () => Promise<T> }) {
    const _prompt = prompt.endsWith(" ") ? prompt : prompt + " ";
    const choicesPrompt = Object.keys(choices).join("/");
    const answer = await getInput(_prompt + "(" + choicesPrompt + ") ").then(ans => ans.trim());
    const choice = Object.entries(choices).find(([text, _callback]) => text.toLowerCase() === answer.toLowerCase());
    if (choice) {
        return await choice[1]();
    } else {
        return await choices['n']()
    }
}
