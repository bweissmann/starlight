import { useState } from "react";
import Listener from "./Listener";
import useWebSocket from "react-use-websocket";

function App() {
  const [recents, setRecents] = useState<
    Record<string, { connected: boolean; timestamp: string }>
  >({});

  const { sendJsonMessage } = useWebSocket("ws://127.0.0.1:8080", {
    onOpen: () => {
      sendJsonMessage({
        command: "sub",
        stream: "initializations",
      });
    },
    onMessage: (event) => {
      const data: { id: string; message: { id: string } }[] = JSON.parse(
        event.data
      );
      data.reverse();
      setRecents((current) => {
        const newData = Object.fromEntries(
          data.map((entry, index) => {
            return [
              entry.message.id,
              { 
                connected: index === 0 ? true : false, 
                timestamp: entry.id.split("-")[0] 
              },
            ] as [string, { connected: boolean; timestamp: string }];
          })
        );
        return { ...newData, ...current };
      });
    },
  });

  return (
    <div className="App">
      <div style={{ display: "flex", flexDirection: "column", margin: 16 }}>
        {Object.entries(recents).map(
          ([id, { connected, timestamp }], index) => (
            <div
              key={id}
              style={{
                border: index === 0 ? "1px solid #888888" : "1px solid #cccccc",
                borderRadius: "3px",
                margin: "4px",
                padding: "6px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {!connected && (
                  <button
                    onClick={() =>
                      setRecents({
                        ...recents,
                        [id]: { ...recents[id], connected: !connected },
                      })
                    }
                  >
                    Connect
                  </button>
                )}
                <p style={{ marginLeft: "6px" }}>
                  {epochToReadableDate(timestamp)}
                </p>
                <p
                  style={{
                    margin: "6px",
                    fontSize: "small",
                    color: "grey",
                    fontWeight: "600",
                  }}
                >
                  {id}
                </p>
              </div>

              {connected && (
                <Listener
                  stream={id}
                  onDisconnect={() =>
                    setRecents({
                      ...recents,
                      [id]: { ...recents[id], connected: false },
                    })
                  }
                />
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

const epochToReadableDate = (milliseconds: string) => {
  const date = new Date(parseInt(milliseconds));
  return (
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }) +
    ", " +
    date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    })
  );
};

export default App;
