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

  async run(
    inputs: SpecToInferred[S]["inputs"],
  ): Promise<SpecToInferred[S]["returns"]> {
    return this.forward(this.tx ?? defaultTx(), inputs);
  }
}
