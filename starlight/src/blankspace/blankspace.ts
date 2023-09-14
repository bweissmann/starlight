import type { Forward, PromptOf, SpecOf } from "./utility-types";
import { impls, type GeneratedPrompts } from "./generated-prompts";
import { Tx } from "@/project/context";
import isEqual from "lodash.isequal";

export default class blankspace {
  static build<S extends SpecOf<GeneratedPrompts>>(spec: S) {
    return new space<S, PromptOf<S>>(spec, this.forwardOfSpec(spec));
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

export class space<S extends SpecOf<GeneratedPrompts>, P extends PromptOf<S>> {
  private spec: S;
  private forward: Forward<P>;

  constructor(spec: S, forward: Forward<P>) {
    this.spec = spec;
    this.forward = forward;
  }

  async run(
    tx: Tx,
    inputs: P["inferred"]["inputs"]
  ): Promise<P["inferred"]["returns"]> {
    return this.forward(tx, inputs);
  }
}
