import { useEffect, useState } from "react";
import Listener from "./Listener";

function App() {
  const [recents, setRecents] = useState<
    Record<string, { connected: boolean; timestamp: string }>
  >({});

  useEffect(() => {
    const interval = setInterval(() => {
      fetchRecents();
    }, 1000);

    // Run fetchRecents once on load
    fetchRecents();

    // Clear interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const fetchRecents = async () => {
    try {
      const response = await fetch("http://localhost:8080/recents");
      const data: { id: string; message: { id: string } }[] = await response.json();
      setRecents((current) => {
        const newData = Object.fromEntries(
          data.map((entry) => {
            return [
              entry.message.id,
              { connected: false, timestamp: entry.id.split("-")[0] },
            ] as [string, { connected: boolean; timestamp: string }];
          })
        );
        return { ...newData, ...current };
      });
    } catch (error) {
      console.error(error);
    }
  };

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
              <p>{epochToReadableDate(timestamp)}</p>
              <p
                style={{
                  fontSize: "small",
                  color: "grey",
                  fontWeight: "600",
                }}
              >
                {id}
              </p>
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
  return date.toLocaleString();
};

export default App;
