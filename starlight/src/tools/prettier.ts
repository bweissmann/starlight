import prettier from "prettier";

export function reformat(sourceCode: string): Promise<string> {
  return prettier.format(sourceCode, { parser: "typescript" });
}
