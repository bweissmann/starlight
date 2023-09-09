import express from "express";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import redis, { AbortError } from "redis";
import http from "http";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

const nonBlockingRedisClient = redis.createClient();
await nonBlockingRedisClient.connect();
nonBlockingRedisClient.on("error", (err) => {
  console.error("NonBlocking Client Error:", err);
});

const streamController: Record<
  string,
  {
    listeners: WebSocket[];
    abortController: AbortController;
    client: redis.RedisClientType<
      redis.RedisModules,
      redis.RedisFunctions,
      redis.RedisScripts
    >;
  }
> = {};

async function openBlockingClient() {
  const client = redis.createClient();
  await client.connect();
  client.on("error", (err) => {
    console.error("Blocking Client Error:", err);
  });
  return client;
}

async function listenToStream(stream: string) {
  console.log("started new listen loop for", stream);
  let currentId = "$";

  while (true) {
    try {
      const response = await streamController[stream].client.xRead(
        redis.commandOptions({
          signal: streamController[stream].abortController.signal,
          isolated: true,
        }),
        [
          {
            key: stream,
            id: currentId,
          },
        ],
        {
          BLOCK: 0,
        }
      );
      console.log("loop of xread", stream);

      if (response) {
        if (response.length > 1) {
          console.error("MULTIPLE STREAMS UNSUPPORTED");
          continue;
        }
        const streamData = response[0];
        currentId = streamData.messages[streamData.messages.length - 1].id;
        console.log(streamData);
        streamController[stream].listeners.forEach((ws) => {
          ws.send(JSON.stringify(streamData.messages));
        });
      }
    } catch (e) {
      if (!(e instanceof AbortError)) {
        console.error(e);
      }
      return;
    }
  }
}

async function sendHistoricalDataToWs(stream: string, ws: WebSocket) {
  const response = await nonBlockingRedisClient.xRead([
    {
      key: stream,
      id: "0",
    },
  ]);

  if (response) {
    ws.send(JSON.stringify(response[0].messages));
  }
}

async function addListenerForStream(stream: string, ws: WebSocket) {
  if (stream in streamController) {
    streamController[stream].listeners.push(ws);
    console.log(
      "adding listener to existing stream",
      stream,
      "total listeners",
      streamController[stream].listeners.length
    );
    sendHistoricalDataToWs(stream, ws);
  } else {
    streamController[stream] = {
      listeners: [ws],
      abortController: new AbortController(),
      client: await openBlockingClient(),
    };
    listenToStream(stream);
    await sendHistoricalDataToWs(stream, ws);
    console.log("started listing to stream", stream, "with one listener");
  }
}

async function removeListenerFromStream(stream: string, ws: WebSocket) {
  streamController[stream].listeners = streamController[
    stream
  ].listeners.filter((listener) => listener !== ws);

  if (streamController[stream].listeners.length === 0) {
    streamController[stream].abortController.abort();
    await streamController[stream].client.quit();
    delete streamController[stream];
  }
}

wss.on("connection", (ws) => {
  ws.on("message", (rawMessage) => {
    const message = JSON.parse(rawMessage.toString());
    const { command, stream } = message;
    if (command === "sub") {
      addListenerForStream(stream, ws);
    } else if (command === "unsub") {
      removeListenerFromStream(stream, ws);
    } else {
      console.log("did not get a sub message, got", message);
    }
  });

  ws.on("close", () => {
    removeListenerFromAllStreams(ws);
  });

  ws.on("error", () => {
    removeListenerFromAllStreams(ws);
  });
});

function removeListenerFromAllStreams(ws: WebSocket) {
  Object.keys(streamController).forEach((stream) => {
    if (streamController[stream].listeners.includes(ws)) {
      removeListenerFromStream(stream, ws);
    }
  });
}

app.get("/recents", async (req, res) => {
  try {
    let n = 10; // default
    if (req.query.n && typeof req.query.n === "string") {
      n = parseInt(req.query.n);
    }
    const response = await nonBlockingRedisClient.xRevRange(
      "initializations",
      "+",
      "-",
      { COUNT: n }
    );
    res.send(response);
  } catch (e) {
    console.error(e);
    res.status(500).send();
  }
});

server.listen(8080, () => {
  console.log("Server running on http://localhost:8080");
});

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

async function cleanup() {
  console.log("\nClosing Redis client...");
  await nonBlockingRedisClient.quit();
  console.log("Redis client closed.");
  process.exit(0);
}
