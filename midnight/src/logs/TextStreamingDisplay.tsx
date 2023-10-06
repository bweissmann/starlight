import { useEffect, useMemo, useRef, useState } from "react";
import throttle from "lodash.throttle";
import Chunk from "./StreamChunk";

export default function TextStreamingDisplay({
  logs,
}: {
  logs: TextChunkLog[];
}) {
  const logsRef = useRef(logs);
  logsRef.current = logs;

  const [delayedLogs, setDelayedLogs] = useState<TextChunkLog[]>([]);

  const DEFAULT_TPM = 1000;
  const tpm = useMemo(() => {
    if (
      delayedLogs.length > 0 &&
      (delayedLogs[delayedLogs.length - 1].message.chunk === "." ||
        /[\n:]/g.test(delayedLogs[delayedLogs.length - 1].message.chunk))
    ) {
      return DEFAULT_TPM / 4;
    }
    return DEFAULT_TPM;
  }, [delayedLogs]);

  const addToDelayedLogs = useMemo(
    () =>
      throttle(
        () => {
          setDelayedLogs((prev) => [
            ...prev,
            ...logsRef.current.slice(prev.length, prev.length + 1),
          ]);
        },
        (1000 * 60.0) / tpm,
        { trailing: true, leading: false }
      ),
    [tpm]
  );

  useEffect(() => {
    if (delayedLogs.length < logs.length) {
      addToDelayedLogs();
    }
  }, [delayedLogs, logs, addToDelayedLogs]);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        marginBottom: "12px",
      }}
    >
      {logs.map((log, index) => (
        <Chunk
          key={index}
          text={log.message.chunk}
          delayReady={index < delayedLogs.length}
        />
      ))}
    </div>
  );
}

export function isTextChunk(d: Record<string, any>): d is TextChunkLog {
  return d.message.type === "TEXT_CHUNK";
}

export type TextChunkLog = {
  id: string;
  message: { chunk: string; type: "TEXT_CHUNK" } & Record<string, any>;
};
