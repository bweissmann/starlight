/* The working context for an agent */
export type Cx = {
    name: string,
    projectDirectory: string,
}

export function defaultCx(): Cx {
    return {
        name: 'default',
        projectDirectory: '.'
    }
}