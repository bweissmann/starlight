import { ChatContinuationResult, stringifyChatResult } from "../chat";
export default async function asJSON<T>(result: string | ChatContinuationResult) {
    const raw = stringifyChatResult(result)

    try {
        return JSON.parse(raw) as T;
    } catch (e) {
        throw new Error(`Failed to parse JSON: ${e}`);
    }
}