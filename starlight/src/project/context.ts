/* The working context for an agent */
export type Cx = {
  name: string;
  projectDirectory: string;
};

/* The root context */
export class Rx {
  cx: Cx;
  children: Tx[];
  tag: "rx";

  constructor(cx: Cx) {
    this.cx = cx;
    this.tag = "rx";
    this.children = [];
  }

  spawn() {
    return spawnChild(this);
  }
}

function spawnChild(parent: Tx | Rx): Tx {
  const child = new Tx(parent);
  parent.children.push(child);
  return child;
}

export function indexInParent(child: Tx): number {
  return child.parent.children.indexOf(child);
}

function isRx(obj: Object): obj is Rx {
  return "tag" in obj && obj.tag === "rx";
}

/* The task context */
export class Tx {
  parent: Tx | Rx;
  children: Tx[];

  constructor(parent: Tx | Rx) {
    this.parent = parent;
    this.children = [];
  }

  get cx(): Cx {
    if (isRx(this)) {
      return this.cx;
    } else {
      return this.parent.cx;
    }
  }

  get projectDirectory() {
    return this.cx.projectDirectory;
  }

  spawn() {
    return spawnChild(this);
  }
}

export function defaultTx() {
  return new Rx(defaultCx()).spawn();
}

export function defaultCx(): Cx {
  return {
    name: "default",
    projectDirectory: ".",
  };
}
