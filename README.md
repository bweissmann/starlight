# starlight

writes code with gpt-4

## notes

right now there are two semi-nonfunctional agents
- `shell-driver.ts` (navigates terminal with tree, cat, touch, mkdir)
- `coding-driver.ts` (modifies files with insert, replace, copy/paste, delete)

changes are written to `.proposal` directories so changes don't clobber your code:
`src/folder/file.ts`
`src/folder/.proposal/file.ts`

from proposals, we generate diffs and prompt the user to accept changes