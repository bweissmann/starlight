const namespaces = [
  await import("./prompts/error-to-action"),
  await import("./prompts/split-errors"),
];

export type GeneratedPrompts = (typeof namespaces)[number]["emptyinstance"];
export const impls = namespaces.map((n) => n.Impl);
