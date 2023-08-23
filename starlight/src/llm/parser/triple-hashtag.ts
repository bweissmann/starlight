import { ChatContinuationResult, stringifyChatResult } from "../chat.js";

/**
 * We can prompt the LLM to output lists with each entry of the list prefixed by ### [identifier]
 * The entry in the list starts after the newline following the identifier and lasts until the next ### or the end of the string.
 */
export async function asTripleHashtagList(result: string | ChatContinuationResult) {
    const raw = stringifyChatResult(result)

    return raw.split('###')
        .slice(1)
        .map(entry => {
            const [identifier, ...content] = entry.split('\n');
            return { identifier: identifier.trim(), content: content.join('\n').trim() };
        });
}
