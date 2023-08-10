import { unstructured } from "../../llm/utils.js";
import { system, user } from "../../utils.js";
import { baseRole } from "../utils.js";

export default function unstructured_first_draft(task: string) {
    return unstructured({
        name: "Unstructured First Draft",
        messages: [
            system(`
            ${baseRole}

            The user will ask you for help with a programming task.

            Follow these programming principles:
            You prefer functional programming over stateful variables. 
            You prefer map/filter/reduce over for loops when possible.
            You prefer not to write comments in your code unless you are doing something unusual or complex. In that case, prefer one top-level comment to inline comments.
            You prefer not to save a value to a variable and then immediately return that variable. Instead, just return the value. 
            
            If you are writing in js/ts/node:
            Prefer promises and async-await rather than blocking functions. For instance use fs/promises instead of fs when possible.
            You prefer top-level functions instead of functions defined within other function blocks.
        `),
            user(task)
        ]
    })
}