const namespaces = [
  // await import("./prompts/extract-actionable-errors_v2.js"),
  // await import("./prompts/fix-error-instructions.js"),
  // await import("./prompts/code-patch-locator.js"),
  // await import("./prompts/file-replacement-check.js"),
  await import("./prompts/parse-user-command.js"),
  await import("./prompts/extract-actionable-errors_v3.js"),
  await import("./prompts/fix-error-instructions_v2.js"),
  await import("./prompts/file-replacement-check_v2.js"),
  await import("./prompts/file-replacement-check_v3.js"),
  await import("./prompts/file-replacement-check_v4.js"),
  await import("./prompts/code-patch-locator_v2.js"),
  await import("./prompts/file-replacement-check_v5.js"),
  await import("./prompts/file-replacement-check_v6.js"),
  await import("./prompts/file-replacement-check_v7.js"),
  await import("./prompts/file-replacement-check_v8.js"),
  await import("./prompts/file-replacement-check_v9.js"),
  await import("./prompts/file-replacement-checker.js"),
  await import("./prompts/code-patch-locator_v3.js"),
  await import("./prompts/code-patch-locator_v4.js"),
  await import("./prompts/file-replacement-check_v10.js"),
  await import("./prompts/file-replacement-checker_v2.js"),
  // append namespace
];

export type GeneratedPrompts = (typeof namespaces)[number]["emptyinstance"];
export const impls = namespaces.map((n) => n.Impl);
