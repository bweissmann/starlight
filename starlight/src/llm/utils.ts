import chalk, { ChalkInstance } from "chalk"
import OpenAI from "openai"
import { Stream } from "openai/streaming"
import { toArray } from "../utils.js"
import { Tiktoken, encodingForModel } from 'js-tiktoken'
export type ChatSpec = { model: ModelName, messages: MessageOrStr[] }
export type ModelName = 'gpt-3.5-turbo' | 'gpt-4'
export type Message = OpenAI.Chat.Completions.ChatCompletionMessage
export type MessageOrStr = Message | string
export function g4(messages: MessageOrStr[]): ChatSpec;
export function g4(...messages: MessageOrStr[]): ChatSpec;
export function g4(...messages: MessageOrStr[] | [MessageOrStr[]]): ChatSpec {
    const flattenedMessages = (Array.isArray(messages[0]) ? messages[0] : messages) as MessageOrStr[]
    return { model: 'gpt-4', messages: toMessageArray(flattenedMessages) }
}

export function g35(messages: MessageOrStr[]): ChatSpec;
export function g35(...messages: MessageOrStr[]): ChatSpec;
export function g35(...messages: MessageOrStr[] | [MessageOrStr[]]): ChatSpec {
    const flattenedMessages = (Array.isArray(messages[0]) ? messages[0] : messages) as MessageOrStr[]
    return { model: 'gpt-3.5-turbo', messages: toMessageArray(flattenedMessages) }
}

export function toMessageArray(arg: MessageOrStr | MessageOrStr[]): Message[] {
    return toArray(arg).map(x => typeof x === 'string' ? user(x) : x)
}

export function logMessages(messages: Message[]) {
    if (process.env.QUIET_LLM === 'true') {
        return
    }
    messages.forEach(m => {
        let fn: ChalkInstance
        switch (m.role) {
            case "system": fn = chalk.blue; break;
            case "user": fn = chalk.blue.bold; break;
            case "assistant": fn = chalk.blue.bold.italic; break;
            case "function": fn = chalk.red; break;
        }
        console.log(chalk.magenta(`${m.role}`))
        m.content?.split("\n").filter(line => line.trim().length > 0).forEach(line => console.log(fn(line)))
    })
}

export async function readAndLogStream(stream: Stream<OpenAI.Chat.Completions.ChatCompletionChunk>) {
    const parts: string[] = []

    for await (const part of stream) {
        const content = part.choices[0]?.delta.content || '';

        process.stdout.write(chalk.bold(content))
        parts.push(content)
    }

    process.stdout.write("\n")

    return parts.join("");
}

// https://openai.com/pricing
const inputPricePerToken: Record<ModelName, number> = {
    'gpt-3.5-turbo': 0.0015 * 0.001,
    'gpt-4': 0.03 * 0.001,
}
const outputPricePerToken: Record<ModelName, number> = {
    'gpt-3.5-turbo': 0.002 * 0.001,
    'gpt-4': 0.06 * 0.001,
}

export function estimatePricing({ input, output }: { input: Message[], output: string }, model: ModelName): { total: number, input: number, output: number } {
    const tiktoken = encodingForModel(model);
    const inputText = input.map(m => m.content).join("");
    const numInputTokens = tiktoken.encode(inputText).length
    const inputPrice = numInputTokens * inputPricePerToken[model]

    const outputText = output;
    const numOutputTokens = tiktoken.encode(outputText).length
    const outputPrice = numOutputTokens * outputPricePerToken[model]

    return {
        total: inputPrice + outputPrice,
        input: inputPrice,
        output: outputPrice
    }
}

export function assembleContent(strings: any, ...values: any[]): string {
    let content: string;
    if (typeof strings === 'string') {
        content = strings;
    } else {
        content = strings.reduce((result: string, str: string, i: number) => `${result}${str}${values[i] || ''}`, '');
    }
    return content;
}

export function system(content: string): Message;
export function system(strings: TemplateStringsArray, ...values: any[]): Message;
export function system(strings: any, ...values: any[]): Message {
    const content = assembleContent(strings, ...values);
    return { role: 'system', content };
}

export function user(content: string): Message;
export function user(strings: TemplateStringsArray, ...values: any[]): Message;
export function user(strings: any, ...values: any[]): Message {
    const content = assembleContent(strings, ...values);
    return { role: 'user', content };
}

export function assistant(content: string): Message;
export function assistant(strings: TemplateStringsArray, ...values: any[]): Message;
export function assistant(strings: any, ...values: any[]): Message {
    const content = assembleContent(strings, ...values);
    return { role: 'assistant', content };
}
