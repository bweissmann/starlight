import chalk from 'chalk';
import { sequence, execute } from '../llm/chat.js';
import parse_draft_into_snippets from './bits/parse_draft_into_snippets.js';
import unstructured_first_draft from './bits/unstructured_first_draft.js';
import { system, user } from '../utils.js';
import { g35 } from '../llm/utils.js';

export default async function implement(goal: string) {

    const first_draft = await execute(
        unstructured_first_draft(goal)
    );

    const snippets = await execute(
        parse_draft_into_snippets(first_draft)
    )

    console.log(typeof snippets)
    snippets.snippets.forEach(sn => {
        console.log(chalk.italic(sn.description))
        console.log(chalk.blue(sn.programmingLanguage))
        console.log(chalk.bold(sn.code))
        console.log("-------------------------")
    })

    return snippets.snippets
}

// unused
export async function implement_hard(goal: string) {

    sequence([
        g35(
            system(`Make a plan for how to implement this.
            Describe the paragram as a paragraph.
            This should be a clear, concise document that can be critiqued by another engineer and understood by a product manager.
            Focus on code structure and design.
            `),
            user(goal)
        ),
        g35(
            user(`Write that plan as a step-by-step list of instructions.`)
        ),
        g35(
            user(`write the code`)
        )
    ])
}