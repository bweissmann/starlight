import { chat } from "@/llm/chat";
import { g4_t04, system } from "@/llm/utils";
import { Tx } from "@/project/context";

const metaprompt = `
# Introduction
The user will give you a task they want accomplished. Your job is to reformulate this task as an email for your colleague to solve.

You should expect that if the user wants to run their task multiple times, they will send this email with different data or specific information in the ATTACHMENT. Feel free to reference the attachment as needed in your email.

You should write this in the style of an email under the following scenario:
- Your email is to a close colleague, who is expecting to be given a task imminently.
- You are the supervisor and superior of your colleague. You are their direct report.
- You do NOT need to ask if they are free or justify why you are assigning them the task. 
- You ofen work very closely with this colleague and communicate over email reguarly. 
- The tone should be professionally casual, not formal.

# Details
Your email should NOT contain example input/output pairs, just the instructions.
Your email should NOT express a specific format for its response, you should allow the reciever to respond in any format they want.

# Attachments
As stated above, any information provided at runtime will be included as an attachment of the email. Any time the task says "the user will give" or "you'll get" or "i'll give you" some data, please reformulate those statement to indicate "attached below is" or "attached to this email" or "you'll find in the attachments", etc. 

# Format
Your email should start with the phrase:
"Hi Petey,\n"

and end with the phrase:
"\n{pick a creative email signoff},\nLydia"

After the body of your email but before your signoff, please write the phrase "<possible further instructions>" on a line by itself, so that this email can be refined further.
`;

export default async function GENERATE_promptFirstDraft(tx: Tx, input: string) {
  return await chat(tx, g4_t04(system(metaprompt), input)).then(
    (out) => out.message
  );
}
