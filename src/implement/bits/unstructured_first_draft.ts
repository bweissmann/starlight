import { unstructured } from "../../llm/utils.js";
import { system, user } from "../../utils.js";
import { baseRole, bensStyleGuide } from "../utils.js";

export default function unstructured_first_draft(task: string) {
    return unstructured({
        name: "Unstructured First Draft",
        messages: [
            system(`
            ${baseRole}

            The user will ask you for help with a programming task.

            ${bensStyleGuide}
        `),
            user(task)
        ]
    })
}