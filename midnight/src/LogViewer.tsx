import { useMemo } from "react";
import TextRenderer, { MAX_LINE_HEIGHT, keyFor } from "./StreamChunk";
import { useStream } from "./StreamReciever";
import LLMChat from "./nodes/LLMChat";

function Listener({
  stream,
  onDisconnect,
}: {
  stream: string;
  onDisconnect: () => void;
}) {
  const { data, readyState, unsub } = useStream<Record<string, any>>(
    2800,
    stream
  );

  const logs = data;

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

  const keyToIndexInSectionMap = useMemo(() => {
    const map = new Map<string, number>();
    chunkSections.forEach((section) => {
      section.forEach((key, indexInSection) => {
        map.set(key, indexInSection);
      });
    });
    return map;
  }, [chunkSections]);

  const keyToSectionMap = useMemo(() => {
    const map = new Map<string, number>();
    chunkSections.forEach((section, index) => {
      section.forEach((key) => {
        map.set(key, index);
      });
    });
    return map;
  }, [chunkSections]);

  const cumulativePrice = useMemo(() => {
    return logs
      .filter(
        (log) =>
          "price" in log.message && !Number.isNaN(parseFloat(log.message.price))
      )
      .map((log) => parseFloat(log.message.price))
      .reduce((acc, cur) => acc + cur, 0.0);
  }, [logs]);
  return (
    <div style={{ marginBottom: "160px" }}>
      <button
        onClick={() => {
          unsub();
          onDisconnect();
        }}
      >
        Disconnect
      </button>
      {readyState === 3 && "Connection is Closed. Check console"}
      <p>Cumulative Price: ${cumulativePrice.toFixed(3)}</p>
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
                  keyToIndexInSectionMap={keyToIndexInSectionMap}
                  key={index}
                  log={log}
                  indexFromEnd={logs.length - index - 1}
                />
              );
            case "LLM_CHAT":
              return (
                <div style={{ width: "100%" }}>
                  <LLMChat key={index} messageRaw={log.message} />
                </div>
              );
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
