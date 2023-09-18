# starlight

writes code with gpt-4

# structure

- starlight: nodejs standalone program with core logic, controlled and monitored via CLI. Monitoring events also streamed out via redis.
- starlight/blankspace: prompt compilation subsystem. Generates prompts, output parsers, and typescript annotations from natural language specs
- mirrorball: VSCode extension which adds a "Quick Fix" to compile blankspace prompts without leaving VSCode 
- midnight: create-react-app frontend -- connects to starlight instances (via redis) and lets users view event streams in real time (future: will be bidirectional with user-input)
- server: simple express server to manage client (midnight) connections to redis and route events accordingly

# usage

its a bit in flux right now, ill update the readme when its more stable.