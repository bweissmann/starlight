import type {
  Forward,
  PromptOf,
  PromptOfSpec,
  SpecOf,
  SpecToFilename,
  SpecToInferred,
} from "./utility-types";
import { impls, type GeneratedPrompts } from "./generated-prompts";
import { Tx, defaultTx } from "@/project/context";
import isEqual from "lodash.isequal";

export default class blankspace {
  static build<F extends SpecToFilename[S], S extends SpecOf<GeneratedPrompts>>(
    spec: S
  ) {
    return new space<F, S>(spec, this.forwardOfSpec(spec));
  }

  static forwardOfSpec<
    S extends SpecOf<GeneratedPrompts>,
    P extends PromptOf<S>,
  >(spec: S): Forward<P> {
    for (let iter of impls) {
      if (isEqual(spec, iter.spec)) {
        return iter.forward as unknown as Forward<P>;
      }
    }

    throw new Error("Spec has not been built. Try rebuilding specs?");
  }
}

export class space<F, S extends SpecOf<GeneratedPrompts>> {
  private spec: S;
  private forward: Forward<PromptOf<S>>;
  private tx?: Tx;

  constructor(spec: S, forward: Forward<PromptOf<S>>, tx?: Tx) {
    this.spec = spec;
    this.tx = tx;
    this.forward = forward;
  }

  with(tx: Tx) {
    return new space<F, S>(this.spec, this.forward, tx);
  }

  // todo: replace back with SpecToInferred[S]["inputs"]
  async run(
    inputs: Record<string, string>
  ): Promise<SpecToInferred[S]["returns"]>;
  async run(inputs: string[]): Promise<SpecToInferred[S]["returns"]>;
  async run(): Promise<SpecToInferred[S]["returns"]>;
  async run(
    inputs?: string[] | Record<string, string>
  ): Promise<SpecToInferred[S]["returns"]> {

    const messages: string[] = inputs === undefined ? [] :
      Array.isArray(inputs)
        ? inputs
        : Object.entries(inputs).map(([key, value]) => `${key}:\n${value}`);
    return this.forward(this.tx ?? defaultTx(), messages);
  }
}
