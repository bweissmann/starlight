/* The working context for an agent */
export type Cx = {
    name: string,
    projectDirectory: string,
}

/* The root context */
export class Rx {
    cx: Cx
    tag: 'rx'

    constructor(cx: Cx) {
        this.cx = cx;
        this.tag = 'rx'
    }

    // Spawn a task from the root context
    spawn(): Tx {
        return {
            parent: this,
            peers: []
        }
    }
}

function isRx(obj: Object): obj is Rx {
    return 'tag' in obj && obj.tag === 'rx'
}

/* The task context */
export type Tx = {
    parent: Tx | Rx,
    peers: Tx[]
}

export function cxOf(x: Tx | Rx): Cx {
    if (isRx(x)) {
        return x.cx
    } else {
        return cxOf(x.parent)
    }
}

export function defaultRx() {
    return new Rx(defaultCx());
}

export function defaultCx(): Cx {
    return {
        name: 'default',
        projectDirectory: '.'
    }
}