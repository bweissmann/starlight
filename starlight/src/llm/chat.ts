import OpenAI from 'openai';
import chalk from 'chalk';
import { isString, vomit } from '../utils';
import { ChatSpec, Message, MessageOrStr, ModelName, assistant, estimatePricing, logMessages, readAndLogStream, toMessageArray } from './utils';
import { writeToCache as writeToCache, dbGetCachedResult } from '../db';
const __openai = new OpenAI(); // never use this directly, always use getOpenAI() so we can keep track of all the raw api entry points 
export function getOpenAI() {
    return __openai
}

export type ChatContinuationResult = { message: string, fullHistory: Message[] }

export function stringifyChatResult(input: string | ChatContinuationResult) {
    if (typeof input === 'string') {
        return input
    }

    return input.message
}


function getCacheKey(spec: ChatSpec) {
    return vomit(spec);
}

export async function getFromCache(spec: ChatSpec, customKey?: string): Promise<null | string> {
    const key = customKey ?? getCacheKey(spec)
    const cachedResult = await dbGetCachedResult(key);
    if (!cachedResult) {
        return null
    }

    // Logging
    if (process.env.QUIET_CACHE === 'true') {
        console.log(chalk.green.bold("(cached)"), chalk.bold(cachedResult))
    } else {
        logMessages(spec)
        console.log(chalk.green.bold.bgBlack("*** Cached result found ***"))
        console.log(chalk.bold(cachedResult))
    }

    return cachedResult
}

export function logInputPrice(spec: ChatSpec) {
    const inputPrice = estimatePricing({ spec }).input.toFixed(3)
    console.log('*', chalk.red.bold(spec.model), `$${inputPrice}`)
}

function logOutputPricing(spec: ChatSpec, output: string) {
    const pricing = estimatePricing({ spec, output })
    const outputPricePercentage = (100 * pricing.output / pricing.total).toFixed(0)
    console.log(chalk.red(`$${pricing.total.toPrecision(3)}`), `output was ${outputPricePercentage}% of price`)
}

async function chatInternal(spec: ChatSpec) {

    const resultFromCache = await getFromCache(spec);
    if (resultFromCache) {
        return resultFromCache;
    }

    logMessages(spec)
    logInputPrice(spec)

    const stream = await getOpenAI().chat.completions.create({
        model: spec.model,
        messages: toMessageArray(spec.messages),
        temperature: spec.temperature,
        stream: true,
    })

    const result = await readAndLogStream(stream)
    logOutputPricing(spec, result)
    await writeToCache(getCacheKey(spec), result);
    return result
}

export async function chat(spec: ChatSpec): Promise<ChatContinuationResult> {
    const result = await chatInternal(spec);

    return {
        message: result,
        fullHistory: [...toMessageArray(spec.messages), assistant(result)]
    }
}

export async function sequence(input: ChatSpec[]) {
    let result = await chat(input[0])

    for (const spec of input.slice(1)) {
        result = await chat({
            messages: [
                ...result.fullHistory,
                ...spec.messages
            ],
            model: spec.model,
            temperature: spec.temperature
        })
    }

    return result
}