import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useActor } from "../hooks/useActor";

interface ChipContextType {
  balance: bigint;
  setBalance: (b: bigint) => void;
  addBalance: (amount: bigint) => void;
  subtractBalance: (amount: bigint) => void;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const ChipContext = createContext<ChipContextType>({
  balance: 0n,
  setBalance: () => {},
  addBalance: () => {},
  subtractBalance: () => {},
  isLoading: false,
  refetch: async () => {},
});

export function ChipProvider({ children }: { children: ReactNode }) {
  const { actor, isFetching } = useActor();
  const [balance, setBalance] = useState<bigint>(0n);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!actor) return;
    try {
      setIsLoading(true);
      const bal = await actor.getCallerChipBalance();
      setBalance(bal);
    } catch (e) {
      console.error("Failed to fetch chip balance", e);
    } finally {
      setIsLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (actor && !isFetching) {
      fetchBalance();
    } else if (!actor && !isFetching) {
      setBalance(0n);
    }
  }, [actor, isFetching, fetchBalance]);

  const addBalance = useCallback((amount: bigint) => {
    setBalance((prev) => prev + amount);
  }, []);

  const subtractBalance = useCallback((amount: bigint) => {
    setBalance((prev) => (prev >= amount ? prev - amount : 0n));
  }, []);

  return (
    <ChipContext.Provider
      value={{
        balance,
        setBalance,
        addBalance,
        subtractBalance,
        isLoading,
        refetch: fetchBalance,
      }}
    >
      {children}
    </ChipContext.Provider>
  );
}

export function useChips() {
  return useContext(ChipContext);
}
