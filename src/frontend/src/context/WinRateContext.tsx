import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useActor } from "../hooks/useActor";

interface WinRates {
  slots: number;
  blackjack: number;
  roulette: number;
}

interface WinRateContextValue extends WinRates {
  refetch: () => void;
}

const WinRateContext = createContext<WinRateContextValue>({
  slots: 50,
  blackjack: 50,
  roulette: 50,
  refetch: () => {},
});

export function WinRateProvider({ children }: { children: React.ReactNode }) {
  const { actor, isFetching } = useActor();
  const [rates, setRates] = useState<WinRates>({
    slots: 50,
    blackjack: 50,
    roulette: 50,
  });

  const fetchRates = useCallback(async () => {
    if (!actor || isFetching) return;
    try {
      const a = actor as any;
      const r = await a.getWinRates();
      setRates({
        slots: Number(r.slots),
        blackjack: Number(r.blackjack),
        roulette: Number(r.roulette),
      });
    } catch {
      // keep defaults
    }
  }, [actor, isFetching]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return (
    <WinRateContext.Provider value={{ ...rates, refetch: fetchRates }}>
      {children}
    </WinRateContext.Provider>
  );
}

export function useWinRates() {
  return useContext(WinRateContext);
}
