import { v4 as uuidv4 } from "uuid";

/* The working context for an agent */
export type Cx = {
  name: string;
  projectDirectory: string;
};

/* The root context */
export class Rx {
  id: string;
  cx: Cx;
  children: Tx[];
  tag: "rx";

  constructor(cx: Cx) {
    this.id = `[root]${uuidv4()}`;
    this.cx = cx;
    this.tag = "rx";
    this.children = [];
  }

  spawn() {
    return spawnChild(this);
  }

  get ancestryIds(): string[] {
    return [];
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
  id: string;
  parent: Tx | Rx;
  children: Tx[];

  constructor(parent: Tx | Rx) {
    this.id = uuidv4();
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

  get ancestryIds(): string[] {
    return [this.parent.id, ...this.parent.ancestryIds];
  }

  spawn() {
    return spawnChild(this);
  }
}

export function defaultTx(projectDirectory?: string) {
  return new Rx(defaultCx(projectDirectory)).spawn();
}

export function defaultCx(projectDirectory?: string): Cx {
  return {
    name: "default",
    projectDirectory: projectDirectory || process.cwd(),
  };
}
