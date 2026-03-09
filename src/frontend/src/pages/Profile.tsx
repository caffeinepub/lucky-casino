import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Coins, Gamepad2, LogIn, TrendingUp, User } from "lucide-react";
import { motion } from "motion/react";
import { GameType, Variant_tie_win_loss } from "../backend.d";
import { useChips } from "../context/ChipContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCasinoProfile } from "../hooks/useQueries";

function formatChips(n: bigint): string {
  return Number(n).toLocaleString();
}

function formatDate(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleString();
}

const GAME_EMOJI: Record<GameType, string> = {
  [GameType.slots]: "🎰",
  [GameType.blackjack]: "🃏",
  [GameType.roulette]: "🎡",
};

const OUTCOME_CONFIG: Record<
  Variant_tie_win_loss,
  { label: string; color: string }
> = {
  [Variant_tie_win_loss.win]: {
    label: "Win",
    color: "bg-emerald/20 text-accent-foreground border-emerald/40",
  },
  [Variant_tie_win_loss.loss]: {
    label: "Loss",
    color: "bg-ruby/20 text-destructive-foreground border-destructive/40",
  },
  [Variant_tie_win_loss.tie]: {
    label: "Tie",
    color: "bg-secondary text-muted-foreground border-border",
  },
};

const STAT_SKELETON_IDS = ["sk-balance", "sk-games", "sk-winnings", "sk-bonus"];

export default function Profile() {
  const { loginStatus, identity, login } = useInternetIdentity();
  const isLoggedIn = loginStatus === "success" && !!identity;
  const { balance } = useChips();
  const { data: profile, isLoading } = useCasinoProfile();

  const principal = identity?.getPrincipal().toString() ?? "";

  if (!isLoggedIn) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-5">
        <User className="w-20 h-20 text-gold/20 mx-auto" />
        <h2 className="font-display text-3xl font-bold text-foreground">
          Your Profile
        </h2>
        <p className="text-muted-foreground">
          Login to view your stats and game history
        </p>
        <Button
          data-ocid="profile.login.button"
          onClick={login}
          size="lg"
          className="bg-gold text-primary-foreground hover:bg-gold-light font-bold px-8"
        >
          <LogIn className="w-5 h-5 mr-2" /> Login
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        data-ocid="profile.loading_state"
        className="max-w-2xl mx-auto px-4 py-10 space-y-4"
      >
        <Skeleton className="h-32 rounded-2xl bg-secondary/60" />
        <div className="grid grid-cols-2 gap-3">
          {STAT_SKELETON_IDS.map((id) => (
            <Skeleton key={id} className="h-24 rounded-2xl bg-secondary/60" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl bg-secondary/60" />
      </div>
    );
  }

  const stats = [
    {
      id: "balance",
      icon: <Coins className="w-5 h-5 text-gold" />,
      label: "Chip Balance",
      value: formatChips(balance),
      color: "text-gold",
    },
    {
      id: "games",
      icon: <Gamepad2 className="w-5 h-5 text-accent" />,
      label: "Games Played",
      value: profile ? String(profile.gamesPlayed) : "0",
      color: "text-accent",
    },
    {
      id: "winnings",
      icon: <TrendingUp className="w-5 h-5 text-emerald" />,
      label: "Total Winnings",
      value: profile ? formatChips(profile.totalWinnings) : "0",
      color: "text-emerald",
    },
    {
      id: "bonus",
      icon: <Clock className="w-5 h-5 text-muted-foreground" />,
      label: "Last Bonus",
      value: profile?.lastBonusClaim
        ? formatDate(profile.lastBonusClaim)
        : "Never",
      color: "text-foreground",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Profile Header */}
        <div
          data-ocid="profile.header.card"
          className="rounded-2xl border border-gold/30 bg-card p-6 flex items-center gap-5 shadow-card"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold/40 to-gold/10 border border-gold/40 flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 text-gold" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-xl font-bold text-foreground">
              Casino Player
            </p>
            <p className="text-muted-foreground text-xs font-mono mt-1 truncate">
              {principal}
            </p>
          </div>
          <div className="ml-auto flex-shrink-0">
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Balance
              </p>
              <p className="font-display text-2xl font-bold text-gold">
                {formatChips(balance)}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              data-ocid="profile.stat.card"
              className="rounded-2xl border border-border/40 bg-card p-4 shadow-card"
            >
              <div className="flex items-center gap-2 mb-2">
                {stat.icon}
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
              <p
                className={`font-display text-xl font-bold ${stat.color} truncate`}
              >
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Game History */}
        <div className="rounded-2xl border border-border/40 bg-card overflow-hidden shadow-card">
          <div className="px-5 py-4 border-b border-border/30">
            <h3 className="font-display font-bold text-gold text-lg">
              Game History
            </h3>
            <p className="text-muted-foreground text-xs mt-0.5">
              Last 20 games recorded on-chain
            </p>
          </div>

          {!profile || profile.gameHistory.length === 0 ? (
            <div
              data-ocid="profile.history.empty_state"
              className="py-10 text-center"
            >
              <p className="text-muted-foreground">No game history yet.</p>
              <p className="text-muted-foreground text-sm mt-1">
                Play some games to see your history here!
              </p>
            </div>
          ) : (
            <ScrollArea className="h-72">
              <div className="divide-y divide-border/20">
                {profile.gameHistory.slice(0, 20).map((result, i) => {
                  const cfg = OUTCOME_CONFIG[result.outcome];
                  const histKey = `${result.gameType}-${result.timestamp}-${i}`;
                  return (
                    <div
                      key={histKey}
                      data-ocid={`profile.history.item.${i + 1}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/20 transition-colors"
                    >
                      <span className="text-xl">
                        {GAME_EMOJI[result.gameType]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium capitalize text-foreground">
                          {result.gameType}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(result.timestamp)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Badge
                          variant="outline"
                          className={`text-xs border ${cfg.color}`}
                        >
                          {cfg.label}
                        </Badge>
                        <p
                          className={`text-xs font-bold mt-1 ${
                            result.outcome === Variant_tie_win_loss.win
                              ? "text-emerald"
                              : result.outcome === Variant_tie_win_loss.loss
                                ? "text-destructive"
                                : "text-muted-foreground"
                          }`}
                        >
                          {result.outcome === Variant_tie_win_loss.win
                            ? `+${formatChips(result.amount)}`
                            : result.outcome === Variant_tie_win_loss.loss
                              ? `-${formatChips(result.amount)}`
                              : `±${formatChips(result.amount)}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </motion.div>
    </div>
  );
}
