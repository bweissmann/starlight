import chalk, { ChalkInstance } from "chalk"
import OpenAI from "openai"
import { Stream } from "openai/streaming"
import { isString, toArray } from "../utils.js"
import { encodingForModel } from 'js-tiktoken'
export type ChatSpec = { model: ModelName, messages: MessageOrStr[], temperature: number }
export type ModelName = 'gpt-3.5-turbo' | 'gpt-4'
export type Message = OpenAI.Chat.Completions.ChatCompletionMessage
export type MessageOrStr = Message | string

export function g4(messages: MessageOrStr[]): ChatSpec;
export function g4(...messages: MessageOrStr[]): ChatSpec;
export function g4(...messages: MessageOrStr[] | [MessageOrStr[]]): ChatSpec {
    const flattenedMessages = (Array.isArray(messages[0]) ? messages[0] : messages) as MessageOrStr[]
    return { model: 'gpt-4', messages: toMessageArray(flattenedMessages), temperature: 0 }
}

export function g4_t02(messages: MessageOrStr[]): ChatSpec;
export function g4_t02(...messages: MessageOrStr[]): ChatSpec;
export function g4_t02(...messages: MessageOrStr[] | [MessageOrStr[]]): ChatSpec {
    const flattenedMessages = (Array.isArray(messages[0]) ? messages[0] : messages) as MessageOrStr[]
    return { model: 'gpt-4', messages: toMessageArray(flattenedMessages), temperature: 0.2 }
}

export function g35(messages: MessageOrStr[]): ChatSpec;
export function g35(...messages: MessageOrStr[]): ChatSpec;
export function g35(...messages: MessageOrStr[] | [MessageOrStr[]]): ChatSpec {
    const flattenedMessages = (Array.isArray(messages[0]) ? messages[0] : messages) as MessageOrStr[]
    return { model: 'gpt-3.5-turbo', messages: toMessageArray(flattenedMessages), temperature: 0 }
}

export function toMessageArray(arg: MessageOrStr | MessageOrStr[]): Message[] {
    return toArray(arg).map(x => typeof x === 'string' ? user(x) : x)
}

export function logMessages(spec: ChatSpec): void;
export function logMessages(messages: Message[]): void;
export function logMessages(input: Message[] | ChatSpec): void {
    const messages = Array.isArray(input) ? input : toMessageArray(input.messages)
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

export function numTokens(model: ModelName, messages: MessageOrStr[]): number;
export function numTokens(model: ModelName, text: string): number;
export function numTokens(model: ModelName, input: string | MessageOrStr[]): number {
    const tiktoken = encodingForModel(model);
    const text = isString(input) ? input : toMessageArray(input).map(m => m.content).join("");
    return tiktoken.encode(text).length;
}

export function estimatePricing({ spec: { model, messages: inputMessages }, output }: { spec: ChatSpec, output?: string }): { total: number, input: number, output: number } {

    const inputPrice = numTokens(model, inputMessages) * inputPricePerToken[model]
    const outputPrice = numTokens(model, output ?? '') * outputPricePerToken[model]

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
