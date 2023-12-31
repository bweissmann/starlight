import type {
  Forward,
  ForwardOfInferred,
  PromptOf,
  PromptOfSpec,
  SpecOf,
  SpecToFilename,
  SpecToInferred,
} from "./utility-types";
import { impls, type GeneratedPrompts } from "./built/built-prompts";
import { Tx, defaultTx } from "@/project/context";
import isEqual from "lodash.isequal";

export default class blankspace {
  static build<F extends SpecToFilename[S], S extends SpecOf<GeneratedPrompts>>(
    spec: S
  ) {
    return new space<F, SpecToInferred[S]>(this.forwardOfSpec(spec) as ForwardOfInferred<SpecToInferred[S]>);
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

export class space<F, Inferred extends { returns: any }> {
  private forward: ForwardOfInferred<Inferred>;
  private tx?: Tx;

  constructor(forward: ForwardOfInferred<Inferred>, tx?: Tx) {
    this.tx = tx;
    this.forward = forward;
  }

  with(tx: Tx) {
    return new space<F, Inferred>(this.forward, tx);
  }

  // todo: replace back with SpecToInferred[S]["inputs"]
  async run(
    inputs: Record<string, string>
  ): Promise<Inferred["returns"]>;
  async run(inputs: string[]): Promise<Inferred["returns"]>;
  async run(): Promise<Inferred["returns"]>;
  async run(
    inputs?: string[] | Record<string, string>
  ): Promise<Inferred["returns"]> {

    const messages: string[] = inputs === undefined ? [] :
      Array.isArray(inputs)
        ? inputs
        : Object.entries(inputs).map(([key, value]) => `${key}:\n${value}`);
    return this.forward(this.tx ?? defaultTx(), messages);
  }
}
