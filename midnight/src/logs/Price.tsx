import { useMemo } from "react";

export default function Price({ logs }: { logs: Record<string, any>[] }) {
  const cumulativePrice = useMemo(() => {
    return logs
      .filter(
        (log) =>
          "price" in log.message && !Number.isNaN(parseFloat(log.message.price))
      )
      .map((log) => parseFloat(log.message.price))
      .reduce((acc, cur) => acc + cur, 0.0);
  }, [logs]);

  return <p>Cumulative Price: ${cumulativePrice.toFixed(3)}</p>;
}
