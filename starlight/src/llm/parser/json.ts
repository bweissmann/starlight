import { Tx } from "@/project/context";
import { ChatContinuationResult, stringifyChatResult } from "../chat";

export default function asJSON<T>(result: string | ChatContinuationResult) {
  const raw = stringifyChatResult(result);

  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    throw new Error(`Failed to parse JSON: ${e}`);
  }
}
export async function asJSONList<T>(
  result: (string | ChatContinuationResult)[]
): Promise<T[]> {
  return Promise.all(result.map(async (item) => asJSON<T>(item)));
}