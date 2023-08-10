import 'dotenv/config';

/*
Top Level Tasks:
- Move user, system, assistant from utils to llm/utils
  > implement search?

- Change file detection to the forward partials style

- in utils/pricing make input and output optional, default to []
 
- documentation
  > document every file in the codebase
*/



// sequence([
//   g4(
//     `I have an existing codebase. with the following structure:

//     ${pretty_print_directory(await ls(`./src`))}

//     I want to add some function for search, like "search by exact keyword" "search by regex", etc.
//     Where should I put this in my repo?
//     `)
// ])

/*
WORKING STACK:
1. Move user, system, assistant from utils to llm/utils
2. implement search
3. make pretty print accept promise
4. Change file should have a reject proposal option.
5. Show file 
*/