# starlight

writes code with gpt-4

# structure

- **starlight:** nodejs standalone program with core logic, controlled and monitored via CLI. Monitoring events also streamed out via redis.
- **starlight/blankspace:** prompt compilation subsystem. Generates prompts, output parsers, and typescript annotations from natural language specs
- **starlight/graph:** experiment in homegrown execution graph, evenually aimed at constraining the execution flow of agent-laid plans
- **mirrorball:** VSCode extension which adds a "Quick Fix" to compile blankspace prompts without leaving VSCode 
- **midnight:** create-react-app frontend, experimentations with more readable streaming UI when LLM speed is >> average reading wpm. Connects to starlight instances (via redis streams) and lets users view starlight event streams in real time
- **server:** express server that manages frontend (midnight) connections via websockets, and routes streaming events from redis
  - todo: there's a memory leak here that accumulates redis client connections over time

## visual structure
<img src="https://github.com/bweissmann/starlight/assets/7266179/2d2c10fb-60a0-45ef-9c29-ce8ba518d609" alt="repo diagram" height="400"/>

source: https://chat.openai.com/share/88ee50af-84ed-40fe-9526-28d14bf50d50

# usage

its a bit in flux right now, ill update the readme when its more stable.
