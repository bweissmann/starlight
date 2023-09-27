# Graph

Experiment with custom execution graph construction

> (future) Theoretically, an agent can eventually constuct its own nodes because execution is standardized

Core code exection is wrapped by `Atom`s

```typescript
class Atom<In,Out> {
    forward (from:In, env:Env): Promise<Out>
```

Execution tree modeled with `Node`s

```typescript
class Node<In, Out> {
  prior: Node<any, In>; // parent dependency of this node
}
```

Additional Concepts:

- DecisionNode - branch point, picks from potential next nodes to continue execution
- AtomicNode - wrapper around Atom
- SubgraphNode - contains arbitrary subgraph of nodes

At this point env contains the cwd of the project, unclear the long term vision.
