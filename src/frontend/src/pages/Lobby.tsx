import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Coins, Gift, Trophy, Zap } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { Page } from "../App";
import { useChips } from "../context/ChipContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCasinoProfile,
  useClaimBonus,
  useLeaderboard,
} from "../hooks/useQueries";

function formatChips(n: bigint): string {
  return Number(n).toLocaleString();
}

function canClaim(lastBonusClaim?: bigint): boolean {
  if (lastBonusClaim === undefined) return true;
  const nowNs = BigInt(Date.now()) * 1_000_000n;
  return nowNs - lastBonusClaim > 86_400_000_000_000n;
}

function truncatePrincipal(p: string): string {
  if (p.length <= 14) return p;
  return `${p.slice(0, 7)}...${p.slice(-5)}`;
}

const GAMES = [
  {
    id: "slots" as Page,
    emoji: "🎰",
    title: "Slot Machine",
    desc: "Spin to win up to 50× your bet",
    color: "from-amber-900/30 to-orange-900/20",
    badge: "Hot",
    badgeColor: "bg-ruby/80 text-white",
    minBet: 10,
  },
  {
    id: "blackjack" as Page,
    emoji: "🃏",
    title: "Blackjack",
    desc: "Beat the dealer and win 1.5× your bet",
    color: "from-emerald-900/30 to-green-900/20",
    badge: "Classic",
    badgeColor: "bg-emerald/80 text-white",
    minBet: 10,
  },
  {
    id: "roulette" as Page,
    emoji: "🎡",
    title: "Roulette",
    desc: "Pick your number and win up to 35×",
    color: "from-blue-900/30 to-indigo-900/20",
    badge: "Live",
    badgeColor: "bg-blue-700/80 text-white",
    minBet: 10,
  },
];

export default function Lobby({
  onNavigate,
}: { onNavigate: (p: Page) => void }) {
  const { login, loginStatus, identity } = useInternetIdentity();
  const { balance } = useChips();
  const { data: profile } = useCasinoProfile();
  const { data: leaderboard } = useLeaderboard();
  const claimBonus = useClaimBonus();

  const isLoggedIn = loginStatus === "success" && !!identity;
  const eligible = canClaim(profile?.lastBonusClaim);

  const handleClaim = async () => {
    try {
      await claimBonus.mutateAsync();
      toast.success("🎉 Daily bonus claimed! +500 chips", { duration: 4000 });
    } catch {
      toast.error("Failed to claim bonus. Try again.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10 relative"
      >
        <div className="relative inline-block mb-4">
          <img
            src="/assets/generated/casino-hero-bg.dim_1200x600.jpg"
            alt="Lucky Casino"
            className="w-full max-w-2xl mx-auto rounded-2xl opacity-60 object-cover h-52"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <h1 className="font-display text-5xl md:text-7xl font-bold shimmer-text leading-none mb-2">
              Lucky Casino
            </h1>
            <p className="text-muted-foreground text-lg">
              Premium Play-Money Casino Experience
            </p>
          </div>
        </div>
      </motion.div>

      {/* Balance + Bonus */}
      {isLoggedIn ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
        >
          <div
            data-ocid="lobby.balance.card"
            className="flex items-center gap-3 bg-card border border-gold/30 rounded-2xl px-8 py-5 glow-gold"
          >
            <Coins className="w-8 h-8 text-gold" />
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-widest mb-0.5">
                Your Balance
              </p>
              <p className="font-display text-4xl font-bold text-gold">
                {formatChips(balance)}
              </p>
            </div>
          </div>

          <Button
            data-ocid="lobby.claim_bonus.button"
            size="lg"
            disabled={!eligible || claimBonus.isPending}
            onClick={handleClaim}
            className={`rounded-xl font-bold text-base px-6 py-5 transition-all duration-300 ${
              eligible
                ? "bg-emerald/90 hover:bg-emerald text-white shadow-emerald"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            }`}
          >
            <Gift className="w-5 h-5 mr-2" />
            {claimBonus.isPending
              ? "Claiming..."
              : eligible
                ? "Claim Daily Bonus (+500 chips)"
                : "Bonus Claimed Today ✓"}
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-3 mb-10"
        >
          <p className="text-muted-foreground text-lg">
            Login to start playing and track your chips
          </p>
          <Button
            data-ocid="lobby.login.button"
            size="lg"
            onClick={login}
            className="bg-gold text-primary-foreground hover:bg-gold-light font-bold text-base px-8 py-5 rounded-xl"
          >
            <Zap className="w-5 h-5 mr-2" /> Login to Play
          </Button>
        </motion.div>
      )}

      {/* Game Cards */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-12"
      >
        <h2 className="font-display text-2xl font-bold text-gold mb-5">
          Choose Your Game
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {GAMES.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.08 }}
              whileHover={{ y: -4 }}
              data-ocid={`lobby.${game.id}.card`}
              className={`relative rounded-2xl border border-gold/20 bg-gradient-to-br ${game.color} bg-card p-6 cursor-pointer group hover:border-gold/50 transition-all duration-300 shadow-card`}
              onClick={() => onNavigate(game.id)}
            >
              <Badge
                className={`absolute top-4 right-4 text-xs font-bold ${game.badgeColor} border-0`}
              >
                {game.badge}
              </Badge>
              <div className="text-5xl mb-4">{game.emoji}</div>
              <h3 className="font-display text-xl font-bold text-foreground mb-1">
                {game.title}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">{game.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Min bet: {game.minBet} chips
                </span>
                <Button
                  data-ocid={`lobby.${game.id}.primary_button`}
                  size="sm"
                  className="bg-gold/90 hover:bg-gold text-primary-foreground font-bold rounded-lg group-hover:shadow-gold transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(game.id);
                  }}
                >
                  Play Now <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Leaderboard Preview */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-bold text-gold flex items-center gap-2">
            <Trophy className="w-6 h-6" /> Top Players
          </h2>
          <Button
            data-ocid="lobby.leaderboard.link"
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("leaderboard")}
            className="text-muted-foreground hover:text-gold"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-card">
          {!leaderboard || leaderboard.length === 0 ? (
            <div
              data-ocid="lobby.leaderboard.empty_state"
              className="py-10 text-center text-muted-foreground"
            >
              No players yet. Be the first!
            </div>
          ) : (
            leaderboard.slice(0, 5).map(([principal, chips], idx) => (
              <div
                key={principal.toString()}
                data-ocid={`lobby.leaderboard.item.${idx + 1}`}
                className={`flex items-center gap-4 px-5 py-3 ${
                  idx < leaderboard.slice(0, 5).length - 1
                    ? "border-b border-border/30"
                    : ""
                } hover:bg-secondary/30 transition-colors`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold font-display ${
                    idx === 0
                      ? "bg-gold text-primary-foreground"
                      : idx === 1
                        ? "bg-muted text-foreground"
                        : idx === 2
                          ? "bg-amber-800/80 text-amber-200"
                          : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="flex-1 font-mono text-sm text-foreground/80">
                  {truncatePrincipal(principal.toString())}
                </span>
                <span className="flex items-center gap-1 text-gold font-bold font-display">
                  <Coins className="w-3.5 h-3.5" />
                  {formatChips(chips)}
                </span>
              </div>
            ))
          )}
        </div>
      </motion.section>
    </div>
  );
}
