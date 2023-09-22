const namespaces = [
  // await import("./prompts/extract-actionable-errors_v2.js"),
  // await import("./prompts/fix-error-instructions.js"),
  // await import("./prompts/code-patch-locator.js"),
  // await import("./prompts/file-replacement-check.js"),
  await import("./prompts/parse-user-command.js"),
  await import("./prompts/select-replace-lines.js"),
  // append namespace
];

export type GeneratedPrompts = (typeof namespaces)[number]["emptyinstance"];
export const impls = namespaces.map((n) => n.Impl);
