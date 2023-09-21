import {
    ChatContinuationResult, stringifyChatResult
} from "@/llm/chat";

/**
 * A code fenced snippet is a piece of code that is enclosed within triple backticks (```).
 * It is commonly used in markdown files for code syntax highlighting.
 *
 * Example:
 * ```javascript
 * const greeting = 'Hello, world!';
 * console.log(greeting);
 * ```
 */

export function extractFencedSnippets(
  input: string | ChatContinuationResult
): string[] {
  return _extractFencedSnippets(stringifyChatResult(input));
}

function _extractFencedSnippets(input: string): string[] {
  const lines = input.split("\n");
  const snippets: string[] = [];
  let withinSnippet = false;
  let snippet = "";

  lines.forEach((line) => {
    if (line.startsWith("```")) {
      if (withinSnippet) {
        snippets.push(snippet.trim());
        snippet = "";
      }
      withinSnippet = !withinSnippet;
    } else if (withinSnippet) {
      snippet += line + "\n";
    }
  });

  return snippets;
}

export function maybeExtractSingleFencedSnippet(
  input: string | ChatContinuationResult
): string {
  const snippets = extractFencedSnippets(input);
  if (snippets.length === 0) {
    return stringifyChatResult(input);
  }
  return snippets[0];
}
