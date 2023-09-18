const namespaces = [
  await import("./prompts/split-errors.js"),
  await import("./prompts/split-error-output.js"),
  await import("./prompts/fix-error-message.js"),
  await import("./prompts/split-error-output_v2.js"),
  await import("./prompts/split-error-output_v3.js"),
  await import("./prompts/fix-error-message_v2.js"),
  await import("./prompts/fix-error-message_v3.js"),
  await import("./prompts/fix-error-message_v4.js"),
  await import("./prompts/fix-error-message_v5.js"),
  await import("./prompts/fix-error-message_v6.js"),
  await import("./prompts/parse-user-command.js"),
  // append namespace
];

export type GeneratedPrompts = (typeof namespaces)[number]["emptyinstance"];
export const impls = namespaces.map((n) => n.Impl);
