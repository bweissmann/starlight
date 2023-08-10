import { Message, query } from '../llm/utils.js';
import { system, user } from '../utils.js';

/* Re-used snippets */
export const baseRole = "You are an AI assistant that is an expert at writing software. "
export const respondInJSON = "Respond in JSON Format. Do not provide any other text of commenary outside of the JSON format. Your answer must be directly parsable via JSON.parse(). "
export const thereIsAnUntrustworthyAssistant = "An untrustworthy, easily confused AI assistant is trying to help the user write their software. That assistant is known to frequently make mistakes."
export const youAreTheSupervisor = "You, as an expert and supervisor to that assistant, are responsible for double-checking the assistant's work."
export const provideOnlyTheCodeSoItCanRun = "Provide only the code or commands without any other text or commentary. The user should be able to take your response and copy-paste it so that it just runs."
export const dontWriteCodeFences = (language = 'typescript') => `Do not include code fences in your response, for example
Bad response (because it contains the code fence):
${"```"}${language} 
console.log("hello world")
${"```"}
Good response (because it only contains the code):
console.log("hello world")`
export const noTalkJustDo = "No Talk; Just Do."
export function respondInJSONFormat(jsonSpec: string) {
    return `
    ${respondInJSON}
    Here is the JSON format for your response:
    [start of json spec]
    ${jsonSpec}
    [end of json spec]
    `
}

/* End of Re-used snippets */

export const ensureCodeFormat = (draft: string): Message[] => [
    system(`
    You are a correction model that fixes responses from other Large Language models. 
    Your input is a LLM response which contains source code or terminal commands.
    However your input might also include other text or commentary.
    You must strip the response of this commentary and return only the code.
    `),
    user(draft),
    system(`
    The above is a response from a Large Language model. 
    The model was supposed to provide code or terminal commands. that could be run as-is with no changes.
    However, this model is known to get confused and include additional text or commentary in its response.

    ${provideOnlyTheCodeSoItCanRun}
    
    Here are some examples:
    Input: 
    "Here is the code: ${"```"}<some code snippet>${"```"}"
    Output:
    <some code snippet>

    Input:
    "Step 1: <commentary for step 1> <code for step 1>, Step 2: <commentary for step 2>  <code for step 2>".
    Output:
    <code for step 1>
    <code for step 2>

    ${provideOnlyTheCodeSoItCanRun}
    `),
]

export const determineProgrammingLanguage = (draft: string) => query<ProgrammingLanguage>({
    name: "Determining Programming Language",
    jsonSpec: ` 
    {
        "language":  "python" | "javascript" | "typescript" | "c#" | "bash" | "other" | "mixture"
    }`,
    messages: (jsonSpec) => [
        system(
            `What programming language is this code written in? 
            If there is only one programming language present, respond with the name of that programming language.
            The programming langauge names you can respond with are "python", "c#", "javascript", "typescript", "bash" or "other" 

            If there are multiple programming languages in the code, respond with "mixture".
            Even if one programming language is used much more than the others, respond with "mixture".

            ${respondInJSONFormat(jsonSpec)}`
        ),
        user(draft),
    ]
})

type ProgrammingLanguage = {
    language: "python" | "javascript" | "typescript" | "c#" | "bash" | "other" | "mixture"
};

export const editor = (question: string, draft: string): Message[] => [
    { role: 'system', content: "Here is what the user asked for:" },
    { role: 'user', content: question },
    { role: 'system', content: "Here is what programming assistant responded with:" },
    { role: 'assistant', content: draft },
    {
        role: 'system', content: `${baseRole}
    
    ${thereIsAnUntrustworthyAssistant}
    
    Specifically, the other assistant is known to write verbose and redundant code. 

    ${youAreTheSupervisor}
    
    It's your job to refine this code. This could involve removing redundant code, simplifying logic, or improving function or variable names for clarity. 
    Please be detail oriented about each line of code. Quietly verify that each line is necessary, clear, and optimal. 
    Even small changes to the code are useful.
    `},
    {
        role: 'system', content: `
    Please provide the refined code, with the expectation that the user could copy and paste it directly for use. 
    Remember, the refined code should accomplish the same task as the original code.

    ${provideOnlyTheCodeSoItCanRun}

    ${dontWriteCodeFences()}

    Do not say the sentence "Here is the refined code:" or any other commentary. 

    ${noTalkJustDo}
    `},
]
