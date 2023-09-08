import { Cx } from "@/project/context";
export function subsequenceMatch(query: string, candidate: string): boolean {
  let j = 0; // Index for query
  for (let i = 0; i < candidate.length && j < query.length; i++) {
    if (candidate.charAt(i) == query.charAt(j)) {
      j++;
    }
  }
  // If all characters of query were found in the candidate in order
  return j == query.length;
}
