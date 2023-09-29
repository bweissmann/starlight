import { useMemo, useState } from "react";
import useWebSocket from "react-use-websocket";
import TextRenderer, { MAX_LINE_HEIGHT, keyFor } from "./Chunk";
import LLMChat from "./nodes/LLMChat";

function Listener({
  stream,
  onDisconnect,
}: {
  stream: string;
  onDisconnect: () => void;
}) {
  const [logs, setLogs] = useState<Record<string, any>[]>([]);
  const { sendJsonMessage, readyState } = useWebSocket("ws://127.0.0.1:8080", {
    onOpen: () => {
      sendJsonMessage({
        command: "sub",
        stream,
      });
    },
    onMessage(event) {
      console.log(event.data);
      setLogs((value) => [
        ...value,
        ...JSON.parse(event.data).flatMap((entry: any) => entry),
      ]);
    },
    onClose: () => {
      console.log("Connection closed");
    },
  });

  const chunkSections = useMemo(() => {
    return logs.reduce<string[][]>(
      (acc, cur) => {
        if (cur.message.type !== "TEXT_CHUNK") {
          if (acc[acc.length - 1].length > 0) {
            acc.push([]);
          }
          return acc;
        }
        const chunks = cur.message.chunk.split("\n") as string[];
        chunks.forEach((chunk, index) => {
          if (index > 0) {
            acc.push([]);
          }
          acc[acc.length - 1].push(keyFor(cur, index));
          if (chunk === ".") {
            acc.push([]);
          }
        });
        return acc;
      },
      [[]] as string[][]
    );
  }, [logs]);

  const keyToSectionMap = useMemo(() => {
    const map = new Map<string, number>();
    chunkSections.forEach((section, index) => {
      section.forEach((key) => {
        map.set(key, index);
      });
    });
    return map;
  }, [chunkSections]);

  return (
    <div style={{ marginBottom: "160px" }}>
      <button
        onClick={() => {
          sendJsonMessage({
            command: "unsub",
            stream,
          });
          onDisconnect();
        }}
      >
        Disconnect
      </button>
      {readyState === 3 && "Connection is Closed. Check console"}
      <p>
        Cumulative Price:{" "}
        {logs
          .filter(
            (log) =>
              "price" in log.message &&
              !Number.isNaN(parseFloat(log.message.price))
          )
          .map((log) => parseFloat(log.message.price))
          .reduce((acc, cur) => acc + cur, 0.0)}
      </p>
      <div
        style={{ display: "flex", flexWrap: "wrap", transition: "height 0.2s" }}
      >
        {logs.map((log, index) => {
          switch (log.message.type) {
            case "TEXT_CHUNK":
              return (
                <TextRenderer
                  nSections={chunkSections.length}
                  keyToSectionMap={keyToSectionMap}
                  key={index}
                  log={log}
                  indexFromEnd={logs.length - index - 1}
                />
              );
            case "LLM_CHAT":
              return <LLMChat key={index} messageRaw={log.message} />;
            case "INIT":
              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: MAX_LINE_HEIGHT,
                  }}
                >
                  <div
                    style={{
                      borderRadius: "50%",
                      backgroundColor: "green",
                      width: "8px",
                      height: "8px",
                      margin: "4px",
                    }}
                  ></div>
                </div>
              );
            default:
              return (
                <details key={index} open={index === logs.length - 1}>
                  <summary>
                    <span>{log.message.type}</span>
                    <span
                      style={{
                        marginLeft: "4px",
                        fontSize: "small",
                        fontWeight: "600",
                        color: "grey",
                      }}
                    >
                      {log.message.txId}
                    </span>
                  </summary>
                  <p>{JSON.stringify(log.message, null, 2)}</p>
                </details>
              );
          }
        })}
      </div>
    </div>
  );
}

export default Listener;
