import { Tx } from "@/project/context";
import { GeneratedPrompts } from "./built/built-prompts";

type Join<T extends string[]> = T extends []
  ? ""
  : T extends [infer F extends string]
  ? F
  : T extends [infer F extends string, ...infer R extends string[]]
  ? `${F} ${Join<R>}`
  : never;

type SpecToMarker<S> = S extends { intro: string; examples: string[] }
  ? `@@PROMPT@@=> ${S["intro"]} @@EXAMPLES@@=> ${Join<S["examples"]>}`
  : S extends { tag: string }
  ? `@@TAG@@=> ${S["tag"]}`
  : never;

export type PromptOfSpec<S, P> = P extends { spec: infer IterSpec }
  ? SpecToMarker<S> extends SpecToMarker<IterSpec>
  ? P
  : never
  : never;

export type PromptOf<S> = PromptOfSpec<S, GeneratedPrompts>;
export type SpecOf<P> = P extends { spec: infer S } ? S : never;
export type FilenameOf<P> = P extends { filename: infer F } ? F : never;
export type ImplOf<P> = {
  spec: SpecOf<P>;
  forward: InferForward<P>;
};

type InferForward<P> = P extends { inferred: { returns: any } }
  ? Forward<P>
  : never;

export type ForwardOfInferred<Inferred> = Inferred extends { returns: any } ? (
  tx: Tx,
  inputs: string[]
) => Promise<Inferred["returns"]> : never;


export type Forward<P extends { inferred: { returns: any } }> = (
  tx: Tx,
  inputs: string[]
) => Promise<P["inferred"]["returns"]>;

type SpecToInferredGeneric<P extends { spec: string; inferred: any }> = {
  [K in P as K["spec"]]: K["inferred"];
};

export type SpecToInferred = SpecToInferredGeneric<GeneratedPrompts>;

type SpecToFilenameGeneric<P extends { spec: string; filename: string }> = {
  [K in P as K["spec"]]: K["filename"];
};

export type SpecToFilename = SpecToFilenameGeneric<GeneratedPrompts>;

type FilenameToSpecGeneric<P extends { spec: string; filename: string }> = {
  [K in P as K["filename"]]: K["spec"];
};

export type FilenameToSpec = FilenameToSpecGeneric<GeneratedPrompts>;
