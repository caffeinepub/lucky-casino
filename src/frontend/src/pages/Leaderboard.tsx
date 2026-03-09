import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, RefreshCw, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useLeaderboard } from "../hooks/useQueries";

function truncatePrincipal(p: string): string {
  if (p.length <= 14) return p;
  return `${p.slice(0, 8)}...${p.slice(-6)}`;
}

function formatChips(n: bigint): string {
  return Number(n).toLocaleString();
}

const RANK_STYLES = [
  "bg-gold text-primary-foreground shadow-gold",
  "bg-muted text-foreground",
  "bg-amber-800/70 text-amber-200",
];

const SKELETON_IDS = [
  "sk-1",
  "sk-2",
  "sk-3",
  "sk-4",
  "sk-5",
  "sk-6",
  "sk-7",
  "sk-8",
  "sk-9",
  "sk-10",
];

export default function Leaderboard() {
  const { loginStatus, identity, login } = useInternetIdentity();
  const isLoggedIn = loginStatus === "success" && !!identity;
  const {
    data: leaderboard,
    isLoading,
    refetch,
    isFetching,
  } = useLeaderboard();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold shimmer-text flex items-center gap-3">
              <Trophy className="w-8 h-8 text-gold" /> Leaderboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Top players by chip balance
            </p>
          </div>
          <Button
            data-ocid="leaderboard.refresh.button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-border/60 text-muted-foreground hover:text-gold hover:border-gold/40"
          >
            <RefreshCw
              className={`w-4 h-4 mr-1 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {!isLoggedIn ? (
          <div
            data-ocid="leaderboard.login.error_state"
            className="text-center py-16 space-y-4"
          >
            <Trophy className="w-16 h-16 text-gold/30 mx-auto" />
            <p className="text-muted-foreground">
              Login to view the leaderboard
            </p>
            <Button
              data-ocid="leaderboard.login.button"
              onClick={login}
              className="bg-gold text-primary-foreground hover:bg-gold-light font-bold"
            >
              Login to View
            </Button>
          </div>
        ) : isLoading ? (
          <div data-ocid="leaderboard.loading_state" className="space-y-3">
            {SKELETON_IDS.map((id) => (
              <Skeleton key={id} className="h-16 rounded-xl bg-secondary/60" />
            ))}
          </div>
        ) : !leaderboard || leaderboard.length === 0 ? (
          <div
            data-ocid="leaderboard.empty_state"
            className="text-center py-16 space-y-3"
          >
            <Trophy className="w-16 h-16 text-gold/20 mx-auto" />
            <p className="text-muted-foreground">
              No players on the leaderboard yet.
            </p>
            <p className="text-muted-foreground text-sm">
              Start playing to claim the top spot!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.slice(0, 10).map(([principal, chips], idx) => (
              <motion.div
                key={principal.toString()}
                data-ocid={`leaderboard.item.${idx + 1}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center gap-4 rounded-xl border px-5 py-4 shadow-card transition-all ${
                  idx === 0
                    ? "border-gold/50 bg-gradient-to-r from-gold/10 to-transparent"
                    : idx === 1
                      ? "border-border/50 bg-card"
                      : idx === 2
                        ? "border-amber-800/40 bg-card"
                        : "border-border/30 bg-card/60"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold font-display text-base flex-shrink-0 ${
                    idx < 3
                      ? RANK_STYLES[idx]
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {idx === 0
                    ? "🥇"
                    : idx === 1
                      ? "🥈"
                      : idx === 2
                        ? "🥉"
                        : idx + 1}
                </div>

                <span className="flex-1 font-mono text-sm text-foreground/80 truncate">
                  {truncatePrincipal(principal.toString())}
                </span>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Coins className="w-4 h-4 text-gold" />
                  <span className="font-bold font-display text-gold text-lg">
                    {formatChips(chips)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
