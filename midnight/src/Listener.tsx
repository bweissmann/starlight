import { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
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
      setLogs((value) => [
        ...value,
        ...JSON.parse(event.data).flatMap((entry: any) => entry),
      ]);
    },
  });

  return (
    <div>
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
      {logs.map((log, index) => (
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
          {log.message.type === "LLM_CHAT" ? (
            <LLMChat messageRaw={log.message} />
          ) : (
            <p>{JSON.stringify(log.message, null, 2)}</p>
          )}
        </details>
      ))}
    </div>
  );
}

export default Listener;
