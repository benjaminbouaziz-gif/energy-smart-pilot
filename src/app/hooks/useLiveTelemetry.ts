import { useEffect, useState } from "react";
import { buildLiveTelemetry, type LiveTelemetry } from "@/app/mock/live";

export function useLiveTelemetry(intervalMs = 5000) {
  const [tick, setTick] = useState(0);
  const [data, setData] = useState<LiveTelemetry>(() => buildLiveTelemetry(0));

  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => {
        const nt = t + 1;
        setData(buildLiveTelemetry(nt));
        return nt;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return data;
}
