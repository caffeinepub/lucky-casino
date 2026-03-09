import { useMutation, useQuery } from "@tanstack/react-query";
import { useChips } from "../context/ChipContext";
import { useActor } from "./useActor";

export function useCasinoProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["casinoProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerProfile();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}

export function useLeaderboard() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60000,
  });
}

export function useClaimBonus() {
  const { actor } = useActor();
  const { setBalance } = useChips();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not authenticated");
      return actor.claimDailyBonus();
    },
    onSuccess: (newBalance: bigint) => {
      setBalance(newBalance);
    },
  });
}

export function useSpinWheel() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not authenticated");
      return actor.spinWheel();
    },
  });
}
