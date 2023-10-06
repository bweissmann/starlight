import { useState } from "react";
import useWebSocket from "react-use-websocket";

export function useStream<T>(name: string) {
  const [data, setData] = useState<T[]>([]);

  const { sendJsonMessage, readyState } = useWebSocket("ws://127.0.0.1:8080", {
    onOpen: () => {
      sendJsonMessage({
        command: "sub",
        stream: name,
      });
    },
    onMessage: (event) => {
      const { type, data } = JSON.parse(event.data) as {
        type: "init" | "append";
        data: T[];
      };
      if (type === "init") {
        setData(data);
      } else {
        setData((oldData) => [...oldData, ...data]);
      }
    },
    onClose: () => {
      console.log("Connection closed");
    },
  });

  const unsub = () => {
    sendJsonMessage({
      command: "unsub",
      stream: name,
    });
  };

  return { data, unsub, isClosed: readyState === 3 };
}
