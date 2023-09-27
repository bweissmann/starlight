import { Tx } from "@/project/context";
import { MaybePromise } from "@/utils.js";
import chalk from "chalk";

export type ToString = { toString: () => string };

export class Atom<In extends ToString, Out extends ToString> {
  forward: Forward<In, Out>;
  description?: string;

  constructor(
    forward: Forward<In, Out>,
    opts: {
      description?: string;
    } = {}
  ) {
    this.forward = forward;
    this.description =
      opts.description ??
      forward
        .toString()
        .replace(/[\n\r\t]/g, "")
        .replace(/  /g, "");
  }

  get node() {
    return new AtomicNode(this);
  }
}

export abstract class Node<In extends ToString, Out extends ToString> {
  prior?: Node<any, In>;

  pipe<To extends ToString>(
    _next: Node<Out, To> | Atom<Out, To>
  ): SubgraphNode<In, To> {
    const next = _next instanceof Node ? _next : new AtomicNode(_next);
    next.prior = this;

    const subgraph = new SubgraphNode(next, this);
    return subgraph;
  }

  abstract get description(): string;
  abstract run(input: In, env: Env): MaybePromise<Out>;

  print_debug(indent = "") {
    console.log(indent + this.description);
    this.prior?.print_debug(indent + "| ");
  }
}

export class SubgraphNode<
  In extends ToString,
  Out extends ToString,
> extends Node<In, Out> {
  nodes: Node<any, any>[];
  terminus: Node<any, Out>;

  constructor(terminus: Node<any, Out>, ...nodes: Node<any, any>[]) {
    super();
    this.nodes = [terminus, ...nodes];
    this.terminus = terminus;
  }

  get description(): string {
    return (
      "Subgraph \n  " +
      this.nodes
        .map((s) => (s === this.terminus ? "*" : "-") + s.description)
        .map((n) => n.split("\n").join("\n  "))
        .join("\n  ")
    );
  }

  async run(input: In, env: Env): Promise<Out> {
    if (!this.terminus.prior) {
      return this.terminus.run(input, env);
    }
    if (!this.nodes.includes(this.terminus.prior)) {
      throw new Error(
        `SubgraphNode: terminus prior ${
          this.terminus.prior.description
        } not in nodes ${this.nodes.map((n) => n.description)}`
      );
    }
    const prior_graph = new SubgraphNode(
      this.terminus.prior,
      ...this.nodes.slice(1)
    );

    return this.terminus.run(await prior_graph.run(input, env), env);
  }
}

export class AtomicNode<In extends ToString, Out extends ToString> extends Node<
  In,
  Out
> {
  atom: Atom<In, Out>;

  constructor(atom: Atom<In, Out>) {
    super();
    this.atom = atom;
  }

  get description(): string {
    return "Atom " + chalk.magenta(this.atom.description ?? "(no description)");
  }

  run(input: In, env: Env) {
    console.log("RUN", this.description);
    return this.atom.forward(input, env);
  }
}

export class DecisionNode<
  In extends ToString,
  Out extends ToString,
> extends Node<In, Out> {
  choices: Record<string, Node<any, Out>>;
  decide: (from: In, env: Env) => MaybePromise<{ choice: string; args: any }>;

  constructor(
    choices: Record<string, Node<any, Out>>,
    decide: (from: In, env: Env) => MaybePromise<{ choice: string; args: any }>
  ) {
    super();
    this.choices = choices;
    this.decide = decide;
  }

  get description(): string {
    return (
      "Decision" +
      Object.keys(this.choices)
        .map((choice) => `\n | ${choice.split("\n").join("\n  ")}`)
        .join("")
    );
  }

  async run(input: In, env: Env) {
    const decision = await this.decide(input, env);
    if (!Object.keys(this.choices).includes(decision.choice)) {
      throw new Error(
        `DecisionNode: choice ${decision.choice} not in ${Object.keys(
          this.choices
        )}`
      );
    }
    return this.choices[decision.choice].run(decision.args, env);
  }
}

export type Producer<Out extends ToString> = Node<Unit, Out>;

type Env = { tx: Tx };
export type Forward<I, O> = (from: I, env: Env) => Promise<O> | O;

export const origin: Producer<Unit> = new AtomicNode(
  new Atom(() => new Unit(), {
    description: "origin",
  })
);

export class Unit {
  toString() {
    return "Unit";
  }
}
export const unit = new Unit();

export const map =
  <I, O>(f: (from: I) => O) =>
  (collection: I[]) =>
    collection.map(f);

type ElementOf<T> = T extends Array<infer Element>
  ? Element extends ToString
    ? Element
    : never
  : never;
type AssertIsArray<Arr, Then> = Arr extends Array<any> ? Then : never;
