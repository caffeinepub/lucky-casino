import { Button } from "@/components/ui/button";
import { Coins, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useChips } from "../context/ChipContext";
import { useWinRates } from "../context/WinRateContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

function getColor(n: number): "red" | "black" | "green" {
  if (n === 0) return "green";
  return RED_NUMBERS.has(n) ? "red" : "black";
}

function formatChips(n: bigint): string {
  return Number(n).toLocaleString();
}

const GRID_ROWS = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];

type BetType =
  | { type: "number"; value: number }
  | { type: "color"; value: "red" | "black" }
  | { type: "parity"; value: "odd" | "even" };

interface PlacedBet {
  betType: BetType;
  amount: number;
}

function betKey(bt: BetType): string {
  if (bt.type === "number") return `num-${bt.value}`;
  if (bt.type === "color") return `col-${bt.value}`;
  return `par-${bt.value}`;
}

function betLabel(bt: BetType): string {
  if (bt.type === "number") return `#${bt.value}`;
  if (bt.type === "color") return bt.value === "red" ? "Red" : "Black";
  return bt.value === "odd" ? "Odd" : "Even";
}

function checkWin(bet: BetType, winNumber: number): boolean {
  if (bet.type === "number") return bet.value === winNumber;
  if (bet.type === "color")
    return winNumber !== 0 && getColor(winNumber) === bet.value;
  if (bet.type === "parity") {
    if (winNumber === 0) return false;
    return bet.value === "odd" ? winNumber % 2 !== 0 : winNumber % 2 === 0;
  }
  return false;
}

function getMultiplier(bet: BetType): bigint {
  if (bet.type === "number") return 35n;
  return 2n;
}

export default function Roulette() {
  const { identity, loginStatus } = useInternetIdentity();
  const isLoggedIn = loginStatus === "success" && !!identity;
  const { balance, subtractBalance, addBalance } = useChips();
  const winRates = useWinRates();

  const [placedBets, setPlacedBets] = useState<PlacedBet[]>([]);
  const [betAmount, setBetAmount] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [winNumber, setWinNumber] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);

  const totalBetAmount = placedBets.reduce((s, b) => s + b.amount, 0);

  const addBet = useCallback(
    (bt: BetType) => {
      const key = betKey(bt);
      setPlacedBets((prev) => {
        const existing = prev.find((b) => betKey(b.betType) === key);
        if (existing) {
          return prev.map((b) =>
            betKey(b.betType) === key
              ? { ...b, amount: b.amount + betAmount }
              : b,
          );
        }
        return [...prev, { betType: bt, amount: betAmount }];
      });
    },
    [betAmount],
  );

  const removeBet = (key: string) => {
    setPlacedBets((prev) => prev.filter((b) => betKey(b.betType) !== key));
  };

  const clearBets = () => setPlacedBets([]);

  const handleSpin = useCallback(async () => {
    if (placedBets.length === 0) {
      toast.error("Place at least one bet first!");
      return;
    }
    const totalBig = BigInt(totalBetAmount);
    if (totalBig > balance) {
      toast.error("Insufficient chips for your bets!");
      return;
    }

    subtractBalance(totalBig);
    setSpinning(true);
    setWinNumber(null);
    setWheelRotation((prev) => prev + 1440 + Math.random() * 360);

    // Determine win number using win rate bias
    const shouldWin = Math.random() * 100 < winRates.roulette;
    let num: number;
    if (shouldWin && placedBets.length > 0) {
      const firstBet = placedBets[0];
      if (firstBet.betType.type === "number") {
        num = firstBet.betType.value;
      } else if (firstBet.betType.type === "color") {
        const colorNums = Array.from({ length: 36 }, (_, i) => i + 1).filter(
          (n) => getColor(n) === firstBet.betType.value,
        );
        num = colorNums[Math.floor(Math.random() * colorNums.length)];
      } else {
        const parNums = Array.from({ length: 36 }, (_, i) => i + 1).filter(
          (n) => (firstBet.betType.value === "odd" ? n % 2 !== 0 : n % 2 === 0),
        );
        num = parNums[Math.floor(Math.random() * parNums.length)];
      }
    } else {
      num = Math.floor(Math.random() * 37); // 0-36
    }

    setTimeout(() => {
      setWinNumber(num);
      setSpinning(false);

      let totalWin = 0n;
      for (const bet of placedBets) {
        if (checkWin(bet.betType, num)) {
          const mult = getMultiplier(bet.betType);
          const betBig = BigInt(bet.amount);
          totalWin += betBig + betBig * mult;
        }
      }

      if (totalWin > 0n) {
        addBalance(totalWin);
        toast.success(
          `🎡 Ball landed on ${num} (${getColor(num)})! Won ${formatChips(totalWin)} chips!`,
          { duration: 5000 },
        );
      } else {
        toast.error(
          `Ball landed on ${num} (${getColor(num)}). No winning bets.`,
        );
      }
      setPlacedBets([]);
    }, 3000);
  }, [
    placedBets,
    totalBetAmount,
    balance,
    subtractBalance,
    addBalance,
    winRates,
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold shimmer-text mb-1">
            Roulette
          </h1>
          <p className="text-muted-foreground">
            Place your bets and spin the wheel
          </p>
        </div>

        {!isLoggedIn ? (
          <div
            data-ocid="roulette.login.error_state"
            className="text-center py-16 text-muted-foreground"
          >
            Login to play Roulette
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Betting Board */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl border border-gold/30 bg-card overflow-hidden shadow-card">
                <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
                  <span className="font-display font-bold text-gold text-sm uppercase tracking-wider">
                    Betting Table
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Chip:</span>
                    {[5, 10, 25, 50, 100].map((amt) => (
                      <button
                        type="button"
                        key={amt}
                        data-ocid="roulette.chip.toggle"
                        onClick={() => setBetAmount(amt)}
                        className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                          betAmount === amt
                            ? "bg-gold text-primary-foreground shadow-gold"
                            : "bg-secondary border border-border/50 text-muted-foreground hover:text-gold hover:border-gold/40"
                        }`}
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3">
                  {/* Zero */}
                  <div className="mb-1">
                    <button
                      type="button"
                      data-ocid="roulette.number.button"
                      onClick={() => addBet({ type: "number", value: 0 })}
                      className={`roulette-number roulette-green w-full rounded text-white text-sm font-bold py-2 ${
                        placedBets.some(
                          (b) =>
                            b.betType.type === "number" &&
                            b.betType.value === 0,
                        )
                          ? "selected"
                          : ""
                      } ${winNumber === 0 ? "winning-cell" : ""}`}
                    >
                      0
                    </button>
                  </div>

                  {/* Number grid */}
                  <div className="grid grid-cols-12 gap-0.5 mb-2">
                    {GRID_ROWS.map((row, ri) =>
                      row.map((num) => {
                        const color = getColor(num);
                        const isBetPlaced = placedBets.some(
                          (b) =>
                            b.betType.type === "number" &&
                            b.betType.value === num,
                        );
                        const isWin = winNumber === num;
                        return (
                          <button
                            type="button"
                            key={`${ri}-${num}`}
                            data-ocid="roulette.number.button"
                            onClick={() =>
                              addBet({ type: "number", value: num })
                            }
                            className={`roulette-number ${
                              color === "red"
                                ? "roulette-red"
                                : "roulette-black"
                            } rounded text-white text-xs font-bold py-1.5 ${
                              isBetPlaced ? "selected" : ""
                            } ${isWin ? "winning-cell" : ""}`}
                          >
                            {num}
                          </button>
                        );
                      }),
                    )}
                  </div>

                  {/* Outside bets */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {(["red", "black"] as const).map((col) => (
                      <button
                        type="button"
                        key={col}
                        data-ocid={`roulette.${col}.toggle`}
                        onClick={() => addBet({ type: "color", value: col })}
                        className={`roulette-number rounded py-2.5 text-sm font-bold text-white transition-all ${
                          col === "red"
                            ? "roulette-red"
                            : "roulette-black border border-border/50"
                        } ${
                          placedBets.some(
                            (b) =>
                              b.betType.type === "color" &&
                              b.betType.value === col,
                          )
                            ? "selected"
                            : ""
                        }`}
                      >
                        {col === "red" ? "🔴 Red" : "⚫ Black"}
                      </button>
                    ))}
                    {(["odd", "even"] as const).map((par) => (
                      <button
                        type="button"
                        key={par}
                        data-ocid={`roulette.${par}.toggle`}
                        onClick={() => addBet({ type: "parity", value: par })}
                        className={`roulette-number rounded py-2.5 text-sm font-bold bg-secondary border border-border/50 text-foreground hover:border-gold/40 ${
                          placedBets.some(
                            (b) =>
                              b.betType.type === "parity" &&
                              b.betType.value === par,
                          )
                            ? "selected"
                            : ""
                        }`}
                      >
                        {par === "odd" ? "Odd" : "Even"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="space-y-4">
              {/* Wheel */}
              <div className="rounded-2xl border border-gold/30 bg-card p-4 text-center shadow-card">
                <motion.div
                  animate={spinning ? { rotate: wheelRotation } : {}}
                  transition={spinning ? { duration: 3, ease: "easeOut" } : {}}
                  className="text-7xl mb-3 inline-block"
                >
                  🎡
                </motion.div>

                <AnimatePresence mode="wait">
                  {winNumber !== null && !spinning ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-1"
                    >
                      <div
                        data-ocid="roulette.result.card"
                        className={`text-3xl font-bold font-display ${
                          getColor(winNumber) === "red"
                            ? "text-red-400"
                            : getColor(winNumber) === "black"
                              ? "text-foreground"
                              : "text-emerald"
                        }`}
                      >
                        {winNumber}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {getColor(winNumber)}
                      </div>
                    </motion.div>
                  ) : spinning ? (
                    <motion.div
                      key="spinning"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      data-ocid="roulette.spin.loading_state"
                      className="text-muted-foreground text-sm animate-pulse"
                    >
                      Spinning...
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      className="text-muted-foreground text-xs"
                    >
                      Place bets and spin
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Current Bets */}
              <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Your Bets
                  </span>
                  {placedBets.length > 0 && (
                    <button
                      type="button"
                      data-ocid="roulette.clear_bets.button"
                      onClick={clearBets}
                      className="text-xs text-destructive hover:text-destructive/80"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                {placedBets.length === 0 ? (
                  <div
                    data-ocid="roulette.bets.empty_state"
                    className="py-5 text-center text-xs text-muted-foreground"
                  >
                    No bets placed yet
                  </div>
                ) : (
                  <div className="divide-y divide-border/20 max-h-40 overflow-y-auto">
                    {placedBets.map((b, idx) => (
                      <div
                        key={betKey(b.betType)}
                        data-ocid={`roulette.bet.item.${idx + 1}`}
                        className="flex items-center justify-between px-4 py-2 text-xs"
                      >
                        <span className="text-foreground/80">
                          {betLabel(b.betType)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-gold font-bold">
                            {b.amount}
                          </span>
                          <button
                            type="button"
                            data-ocid={`roulette.bet.delete_button.${idx + 1}`}
                            onClick={() => removeBet(betKey(b.betType))}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {placedBets.length > 0 && (
                  <div className="px-4 py-2 border-t border-border/30 text-xs flex justify-between">
                    <span className="text-muted-foreground">Total bet:</span>
                    <span className="text-gold font-bold">
                      {totalBetAmount} chips
                    </span>
                  </div>
                )}
              </div>

              {/* Balance */}
              <div className="flex items-center gap-2 text-sm">
                <Coins className="w-4 h-4 text-gold" />
                <span className="text-muted-foreground">Balance:</span>
                <span className="text-gold font-bold font-display">
                  {formatChips(balance)}
                </span>
              </div>

              {/* Spin Button */}
              <Button
                data-ocid="roulette.spin.primary_button"
                size="lg"
                onClick={handleSpin}
                disabled={
                  spinning ||
                  placedBets.length === 0 ||
                  BigInt(totalBetAmount) > balance
                }
                className="w-full bg-gold hover:bg-gold-light text-primary-foreground font-bold font-display text-lg py-6 rounded-xl shadow-gold transition-all disabled:opacity-60"
              >
                {spinning ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Spinning...
                  </span>
                ) : (
                  "🎡 SPIN"
                )}
              </Button>

              {/* Payout info */}
              <div className="rounded-xl border border-border/30 bg-card/60 p-3 space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Payouts
                </p>
                <div className="flex justify-between text-xs">
                  <span className="text-foreground/70">Single number</span>
                  <span className="text-gold font-bold">35×</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-foreground/70">Red / Black</span>
                  <span className="text-gold font-bold">2×</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-foreground/70">Odd / Even</span>
                  <span className="text-gold font-bold">2×</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
