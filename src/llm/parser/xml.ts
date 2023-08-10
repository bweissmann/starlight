import { parseStringPromise } from 'xml2js'
import { ChatContinuationResult, stringifyChatResult } from '../chat.js'

export default async function parseXML<T>(result: string | ChatContinuationResult) {
    const raw = stringifyChatResult(result);

    return (await parseStringPromise(`<root>${raw}</root>`)).root as T
}