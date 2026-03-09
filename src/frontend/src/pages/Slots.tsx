import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coins, RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useChips } from "../context/ChipContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "🔔", "7️⃣"];
const REEL_IDS = ["reel-0", "reel-1", "reel-2"];

function randomSymbol(): string {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function calcPayout(reels: string[], bet: bigint): bigint {
  const [a, b, c] = reels;
  if (a === b && b === c) {
    if (a === "7️⃣") return bet * 50n;
    if (a === "🔔") return bet * 20n;
    return bet * 5n;
  }
  if (a === b || b === c || a === c) return bet * 2n;
  return 0n;
}

function formatChips(n: bigint): string {
  return Number(n).toLocaleString();
}

const PAYOUTS = [
  { match: "7️⃣ 7️⃣ 7️⃣", multiplier: "50×", label: "Jackpot" },
  { match: "🔔 🔔 🔔", multiplier: "20×", label: "Big Win" },
  { match: "Any 3 of a kind", multiplier: "5×", label: "Win" },
  { match: "Any 2 matching", multiplier: "2×", label: "Small Win" },
  { match: "No match", multiplier: "0×", label: "Loss" },
];

export default function Slots() {
  const { identity, loginStatus } = useInternetIdentity();
  const isLoggedIn = loginStatus === "success" && !!identity;
  const { balance, subtractBalance, addBalance } = useChips();

  const [bet, setBet] = useState("50");
  const [reels, setReels] = useState(["🍒", "🍋", "🍊"]);
  const [spinning, setSpinning] = useState(false);
  const [spinningReels, setSpinningReels] = useState([false, false, false]);
  const [lastResult, setLastResult] = useState<{
    win: boolean;
    payout: bigint;
    reels: string[];
  } | null>(null);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  useEffect(() => {
    return () => {
      intervalsRef.current.forEach(clearInterval);
    };
  }, []);

  const handleSpin = useCallback(() => {
    const betNum = Number.parseInt(bet, 10);
    if (Number.isNaN(betNum) || betNum < 10) {
      toast.error("Minimum bet is 10 chips");
      return;
    }
    const betBig = BigInt(betNum);
    if (betBig > balance) {
      toast.error("Insufficient chips!");
      return;
    }

    subtractBalance(betBig);
    setSpinning(true);
    setLastResult(null);

    const finalSymbols = [randomSymbol(), randomSymbol(), randomSymbol()];

    setSpinningReels([true, true, true]);
    const newReels = [...reels];

    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];

    const spinInterval = setInterval(() => {
      setReels([randomSymbol(), randomSymbol(), randomSymbol()]);
    }, 80);
    intervalsRef.current.push(spinInterval);

    const stopDelays = [700, 1100, 1500];
    stopDelays.forEach((delay, i) => {
      setTimeout(() => {
        clearInterval(spinInterval);
        newReels[i] = finalSymbols[i];
        setReels([...newReels]);
        setSpinningReels((prev) => {
          const next = [...prev];
          next[i] = false;
          return next;
        });

        if (i === 2) {
          setSpinning(false);
          const payout = calcPayout(finalSymbols, betBig);

          if (payout > 0n) {
            addBalance(payout);
            toast.success(
              payout > betBig * 5n
                ? `🎰 JACKPOT! You won ${formatChips(payout)} chips! 🎉`
                : `🎰 Winner! You won ${formatChips(payout)} chips!`,
              { duration: 5000 },
            );
          } else {
            toast.error(`No match. Lost ${formatChips(betBig)} chips.`);
          }
          setLastResult({ win: payout > 0n, payout, reels: finalSymbols });
        }
      }, delay);
    });
  }, [bet, balance, subtractBalance, addBalance, reels]);

  const setBetPreset = (amount: number | "max") => {
    if (amount === "max") {
      setBet(balance.toString());
    } else {
      setBet(String(Math.min(amount, Number(balance))));
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold shimmer-text mb-1">
            Slot Machine
          </h1>
          <p className="text-muted-foreground">
            Spin and match symbols to win big
          </p>
        </div>

        {/* Machine */}
        <div className="relative rounded-3xl border-2 border-gold/40 bg-card shadow-gold-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-card via-secondary to-card px-6 py-3 border-b border-gold/20 text-center">
            <span className="font-display text-gold font-bold tracking-widest text-sm uppercase">
              Lucky Casino Slots
            </span>
          </div>

          {/* Reels */}
          <div className="casino-felt p-8">
            <div className="flex justify-center gap-4 mb-6">
              {reels.map((symbol, i) => (
                <motion.div
                  key={REEL_IDS[i]}
                  data-ocid={`slots.reel.${i + 1}`}
                  animate={
                    spinning && spinningReels[i] ? { scale: [1, 1.02, 1] } : {}
                  }
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 0.15,
                  }}
                  className={`w-24 h-24 rounded-xl bg-card/90 border-2 flex items-center justify-center text-5xl shadow-card ${
                    lastResult?.win
                      ? "border-gold win-glow"
                      : lastResult && !lastResult.win
                        ? "border-ruby/60"
                        : "border-gold/40"
                  } ${spinning && spinningReels[i] ? "slot-reel-spinning" : ""}`}
                >
                  {symbol}
                </motion.div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {lastResult && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`text-center py-2 px-4 rounded-xl font-bold font-display text-lg ${
                    lastResult.win
                      ? "bg-emerald/20 text-accent-foreground border border-emerald/40"
                      : "bg-ruby/20 text-destructive-foreground border border-destructive/40"
                  }`}
                >
                  {lastResult.win
                    ? `🎉 Won ${formatChips(lastResult.payout)} chips!`
                    : "😔 Better luck next time!"}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="bg-card/60 border-t border-gold/20 px-6 py-5 space-y-4">
            {!isLoggedIn ? (
              <p
                data-ocid="slots.login.error_state"
                className="text-center text-muted-foreground py-2"
              >
                Login to play the slot machine
              </p>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1">
                    <Label className="text-muted-foreground text-xs mb-1.5 uppercase tracking-wider">
                      Bet Amount
                    </Label>
                    <Input
                      data-ocid="slots.bet.input"
                      type="number"
                      value={bet}
                      onChange={(e) => setBet(e.target.value)}
                      min={10}
                      max={Number(balance)}
                      disabled={spinning}
                      className="bg-secondary border-border/60 text-foreground font-display text-lg font-bold text-center"
                    />
                  </div>
                  <div className="flex gap-2">
                    {[10, 25, 50, 100].map((amt) => (
                      <button
                        type="button"
                        key={amt}
                        data-ocid="slots.bet_preset.button"
                        onClick={() => setBetPreset(amt)}
                        disabled={spinning || BigInt(amt) > balance}
                        className="px-2.5 py-2 rounded-lg bg-secondary border border-border/50 text-xs font-bold text-muted-foreground hover:text-gold hover:border-gold/40 disabled:opacity-40 transition-colors"
                      >
                        {amt}
                      </button>
                    ))}
                    <button
                      type="button"
                      data-ocid="slots.bet_max.button"
                      onClick={() => setBetPreset("max")}
                      disabled={spinning || balance === 0n}
                      className="px-2.5 py-2 rounded-lg bg-secondary border border-border/50 text-xs font-bold text-muted-foreground hover:text-gold hover:border-gold/40 disabled:opacity-40 transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <Button
                  data-ocid="slots.spin.primary_button"
                  size="lg"
                  onClick={handleSpin}
                  disabled={spinning || balance < 10n}
                  className="w-full bg-gold hover:bg-gold-light text-primary-foreground font-bold font-display text-xl py-6 rounded-xl shadow-gold transition-all duration-200 disabled:opacity-60"
                >
                  {spinning ? (
                    <span className="flex items-center gap-2">
                      <RotateCcw className="w-5 h-5 animate-spin" /> Spinning...
                    </span>
                  ) : (
                    "🎰 SPIN"
                  )}
                </Button>

                <div className="flex items-center text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Coins className="w-3 h-3 text-gold" /> Balance:{" "}
                    <span className="text-gold font-bold">
                      {formatChips(balance)}
                    </span>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payout Table */}
        <div className="rounded-2xl border border-border/40 bg-card/60 overflow-hidden">
          <div className="px-5 py-3 border-b border-border/30">
            <h3 className="font-display font-bold text-gold text-sm uppercase tracking-wider">
              Payout Table
            </h3>
          </div>
          <div className="divide-y divide-border/20">
            {PAYOUTS.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between px-5 py-2.5"
              >
                <span className="text-sm text-foreground/80">{row.match}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {row.label}
                  </span>
                  <span
                    className={`font-bold font-display text-sm ${row.multiplier === "0×" ? "text-destructive" : "text-gold"}`}
                  >
                    {row.multiplier}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
