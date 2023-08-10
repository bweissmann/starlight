import chalk from "chalk"
import { getOpenAI } from "./chat.js"
import { MessageOrStr, ModelName, estimatePricing, logMessages, toMessageArray } from "./utils.js"
import { encodingForModel } from "js-tiktoken"
import { vomit } from "../utils.js"
import { cacheResult, getCachedResult } from "../db.js"

export async function chatYNQuestion(_messages: MessageOrStr[], opts: { model: ModelName }) {
    const response = await classifier(_messages, ['true', 'false'], opts)
    return response === 'true'
}

export async function classifier<T extends string[]>(_messages: MessageOrStr[], allowedOuputs: T, opts: { model: ModelName }) {
    const messages = toMessageArray(_messages)
    logMessages(messages)
    const cacheKey = vomit(messages) + vomit(allowedOuputs) + vomit(opts)

    const cachedResult = await getCachedResult(cacheKey);
    if (cachedResult) {
        console.log(chalk.green.bold.bgBlack("*** Cached result found ***"))
        console.log(chalk.bold(cachedResult))
        return cachedResult
    }

    const inputPrice = estimatePricing({ input: messages, output: '' }, opts.model).input.toFixed(3)
    console.log(chalk.red.bold(opts.model), `$${inputPrice}`)

    const tiktoken = encodingForModel(opts.model)
    const logits = allowedOuputs.flatMap(allow => tiktoken.encode(allow))
    if (logits.length > allowedOuputs.length) {
        console.log('logits', logits)
    }

    const response = await getOpenAI().chat.completions.create({
        model: opts.model,
        messages: messages,
        temperature: 0,
        max_tokens: 1,
        logit_bias: Object.fromEntries(logits.map(logit => [`${logit}`, 100]))
    })

    const result = response.choices[0].message.content as string
    console.log(chalk.bold(result))
    await cacheResult(cacheKey, result);
    return result
}