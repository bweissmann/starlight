import { useEffect, useMemo } from "react";
import LLMChat from "../nodes/LLMChat";
import Price from "./Price";
import { MAX_LINE_HEIGHT } from "./StreamChunk";
import TextStreamingDisplay, {
  TextChunkLog,
  isTextChunk,
} from "./TextStreamingDisplay";
import { useStream } from "./WSStreamer";

type Log = {
  id: string;
  message: { type: string } & Record<string, any>;
};

export default function LogViewer({
  streamName,
  onDisconnect,
}: {
  streamName: string;
  onDisconnect: () => void;
}) {
  const { data, isClosed, unsub } = useStream<Log>(streamName);

  const splitSequences = useMemo(
    () => splitIntoContinuousSequences(data),
    [data]
  );

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
      {isClosed && (
        <span style={{ color: "red" }}>
          <b> Connection is Closed. Check console</b>
        </span>
      )}
      <Price logs={data} />
      <div>
        {splitSequences.map((seq, index) => {
          if (seq.isTextChunks) {
            return (
              <TextStreamingDisplay
                key={index}
                logs={seq.data as unknown as any}
              />
            );
          } else {
            return renderNonTextChunkData(seq.data);
          }
        })}
      </div>
    </div>
  );
}

function renderNonTextChunkData(data: Log[]) {
  return data.map((log, index) => {
    switch (log.message.type) {
      case "LLM_CHAT":
        return (
          <div key={index} style={{ width: "100%" }}>
            <LLMChat messageRaw={log.message as unknown as any} />
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
          <details key={index} open={index === data.length - 1}>
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
  });
}

function splitIntoContinuousSequences(
  data: Log[]
): Array<
  | { isTextChunks: true; data: TextChunkLog[] }
  | { isTextChunks: false; data: Log[] }
> {
  const acc = [] as Array<
    | { isTextChunks: true; data: TextChunkLog[] }
    | { isTextChunks: false; data: Log[] }
  >;

  // add to the current sequence or create a new sequence if isTextChunks differs
  const add = (d: any) => {
    const isCurTextChunk = isTextChunk(d);
    if (
      acc.length === 0 ||
      acc[acc.length - 1].isTextChunks !== isCurTextChunk
    ) {
      acc.push({ isTextChunks: isCurTextChunk, data: [d] });
    } else {
      acc[acc.length - 1].data.push(d);
    }
  };

  for (const d of data) {
    add(d);
  }

  return acc;
}
