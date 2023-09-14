import { Tx } from "@/project/context";
import { Forward, ImplOf } from "../utility-types";

export type Prompt = {
  spec: typeof spec;
  inferred: {
    inputs: unknown; // TODO: fill in inputs
    returns: unknown; // TODO: fill in returns
  };
};

const spec = {
    // TODO: fill in spec
} as const;

const forward: Forward<Prompt> = async (tx: Tx, inputs) => {
  throw "unimplemented" // TODO: implement forward pass
};

// ------------------------------------------
// ------------------------------------------

export const emptyinstance: Prompt = {} as Prompt;
export const Impl: ImplOf<Prompt> = {
  spec: spec,
  forward,
};
