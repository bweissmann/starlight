import throttle from "lodash.throttle";
import { useEffect, useRef, useState } from "react";
import useWebSocket from "react-use-websocket";

export function useStream<T>(wpt: number, streamName: string) {
  const [remoteData, setRemoteData] = useState<T[]>([]);
  const [localData, setLocalData] = useState<T[]>([]);
  const remoteDataRef = useRef(remoteData);
  remoteDataRef.current = remoteData;

  const transferRemoteToLocal = useRef(
    throttle(
      (id: string) => {
        console.log(id);
        setLocalData((prev) => [
          ...prev,
          ...remoteDataRef.current.slice(prev.length, prev.length + 1),
        ]);
      },
      1000 * 60.0 / wpt,
      { trailing: true, leading: false }
    )
  ).current; // Using useRef to persist the throttled function across renders without recreation

  useEffect(() => {
    if (localData.length < remoteData.length) {
      transferRemoteToLocal("effect");
    }
  }, [localData, remoteData, transferRemoteToLocal]);

  const { sendJsonMessage, readyState } = useWebSocket("ws://127.0.0.1:8080", {
    onOpen: () => {
      sendJsonMessage({
        command: "sub",
        stream: streamName,
      });
    },
    onMessage: (event) => {
      const { type, data } = JSON.parse(event.data) as {
        type: "init" | "append";
        data: T[];
      };
      if (type === "init") {
        setRemoteData(data);
        setLocalData([]);
      } else {
        setRemoteData((oldData) => [...oldData, ...data]);
      }
      transferRemoteToLocal("og");
    },
    onClose: () => {
      console.log("Connection closed");
    },
  });

  const unsub = () => {
    console.trace("UNSUBBED CALLED");
    sendJsonMessage({
      command: "unsub",
      stream: streamName,
    });
  };

  return { data: localData, unsub, readyState };
}
