import OpenAI from 'openai';
import chalk from 'chalk';
import { assistant, vomit } from '../utils.js';
import { ChatSpec, Message, MessageOrStr, ModelName, Query, Unstructured, estimatePricing, logMessages, readAndLogStream, toMessageArray } from './utils.js';
import { cacheResult, getCachedResult } from '../db.js';
import parseJSON from './parser/json.js';

const __openai = new OpenAI(); // never use this directly, always use getOpenAI() so we can keep track of all the raw api entry points 
export function getOpenAI() {
    return __openai
}

export async function execute<T>(query: Query<T>): Promise<T>;
export async function execute(unstructued: Unstructured): Promise<string>;
export async function execute<T>(param: Unstructured | Query<T>): Promise<string | T> {
    if ("jsonSpec" in param) {
        return executeQuery(param)
    }

    const { name, messages } = param;
    return chat(messages, { name });
}

export async function executeQuery<T>(query: Query<T>) {
    const raw = await chat(
        query.messages,
        { name: query.name },
    )

    return await parseJSON<T>(raw);
}

export async function chat(_messages: MessageOrStr | MessageOrStr[], opts?: { name?: string, model?: ModelName }): Promise<string> {
    const messages = toMessageArray(_messages)
    const model = opts?.model ?? 'gpt-3.5-turbo';
    const cacheKey = vomit(messages) + vomit(opts);

    const cachedResult = await getCachedResult(cacheKey);
    if (cachedResult) {
        if (process.env.QUIET_CACHE === 'true') {
            console.log(chalk.green.bold("(cached)"), chalk.bold(cachedResult))
        } else {
            logMessages(messages)
            console.log(chalk.green.bold.bgBlack("*** Cached result found ***"))
            console.log(chalk.bold(cachedResult))
        }
        return cachedResult
    }

    logMessages(messages)

    const inputPrice = estimatePricing({ input: messages, output: '' }, model).input.toFixed(3)
    console.log(opts?.name ? chalk.red(opts?.name) : '*', chalk.red.bold(model), `$${inputPrice}`)

    const stream = await getOpenAI().chat.completions.create({
        model,
        messages,
        temperature: 0,
        stream: true,
    })

    const result = await readAndLogStream(stream)
    const pricing = estimatePricing({ input: messages, output: result }, model)
    const outputPricePercentage = (100 * pricing.output / pricing.total).toFixed(0)
    console.log(chalk.red(`$${pricing.total.toPrecision(3)}`), `output was ${outputPricePercentage}% of price`)
    await cacheResult(cacheKey, result);
    return result
}

export type ChatContinuationResult = { message: string, fullHistory: Message[] }

export function stringifyChatResult(input: string | ChatContinuationResult) {
    if (typeof input === 'string') {
        return input
    }

    return input.message
}

async function chatWithContinuation(spec: ChatSpec): Promise<ChatContinuationResult> {
    const result = await chat(spec.messages, { model: spec.model })
    return {
        message: result,
        fullHistory: [...toMessageArray(spec.messages), assistant(result)]
    }
}

export async function sequence(input: ChatSpec[]) {
    let result = await chatWithContinuation(input[0])

    for (const spec of input.slice(1)) {
        result = await chatWithContinuation({
            messages: [
                ...result.fullHistory,
                ...spec.messages
            ], model: spec.model
        })
    }

    return result
}