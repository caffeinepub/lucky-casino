import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coins } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useChips } from "../context/ChipContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type Suit = "♠" | "♥" | "♦" | "♣";
type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

interface Card {
  rank: Rank;
  suit: Suit;
  hidden?: boolean;
}

type GameState = "betting" | "playing" | "dealer" | "done";
type GameOutcome = "win" | "loss" | "tie" | "blackjack" | null;

function createDeck(): Card[] {
  const suits: Suit[] = ["♠", "♥", "♦", "♣"];
  const ranks: Rank[] = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
  ];
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ rank, suit });
    }
  }
  return shuffleDeck(deck);
}

function shuffleDeck(arr: Card[]): Card[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cardValue(card: Card): number {
  if (card.rank === "A") return 11;
  if (["J", "Q", "K"].includes(card.rank)) return 10;
  return Number.parseInt(card.rank, 10);
}

function handTotal(cards: Card[]): number {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.hidden) continue;
    total += cardValue(c);
    if (c.rank === "A") aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handTotal(cards) === 21;
}

function isBust(cards: Card[]): boolean {
  return handTotal(cards) > 21;
}

function formatChips(n: bigint): string {
  return Number(n).toLocaleString();
}

function cardKey(card: Card, pos: number, prefix: string): string {
  return `${prefix}-${pos}-${card.rank}${card.suit}`;
}

function PlayingCard({ card, delay = 0 }: { card: Card; delay?: number }) {
  const isRed = card.suit === "♥" || card.suit === "♦";
  return (
    <motion.div
      initial={{ opacity: 0, y: -40, rotate: -8 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, delay }}
      className={`w-14 h-20 md:w-16 md:h-24 rounded-lg flex flex-col justify-between p-1.5 font-bold text-sm select-none shadow-card ${
        card.hidden
          ? "bg-gradient-to-br from-blue-900 to-blue-800 border border-blue-600/40"
          : isRed
            ? "bg-white text-red-600 border border-gray-200/20"
            : "bg-white text-gray-900 border border-gray-200/20"
      }`}
    >
      {card.hidden ? (
        <div className="flex items-center justify-center h-full">
          <span className="text-blue-300 text-2xl">🂠</span>
        </div>
      ) : (
        <>
          <div className="leading-none">
            <div className="text-xs font-bold">{card.rank}</div>
            <div className="text-xs">{card.suit}</div>
          </div>
          <div className="text-center text-2xl leading-none">{card.suit}</div>
          <div className="leading-none text-right rotate-180">
            <div className="text-xs font-bold">{card.rank}</div>
            <div className="text-xs">{card.suit}</div>
          </div>
        </>
      )}
    </motion.div>
  );
}

export default function Blackjack() {
  const { identity, loginStatus } = useInternetIdentity();
  const isLoggedIn = loginStatus === "success" && !!identity;
  const { balance, subtractBalance, addBalance } = useChips();

  const [gameState, setGameState] = useState<GameState>("betting");
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [bet, setBet] = useState("50");
  const [currentBet, setCurrentBet] = useState(0n);
  const [outcome, setOutcome] = useState<GameOutcome>(null);
  const [isDealing, setIsDealing] = useState(false);

  const dealGame = useCallback(() => {
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

    const newDeck = createDeck();
    const pCard1 = newDeck.pop()!;
    const dCard1 = newDeck.pop()!;
    const pCard2 = newDeck.pop()!;
    const dCard2 = { ...newDeck.pop()!, hidden: true };

    const ph = [pCard1, pCard2];
    const dh = [dCard1, dCard2];

    subtractBalance(betBig);
    setCurrentBet(betBig);
    setDeck(newDeck);
    setPlayerHand(ph);
    setDealerHand(dh);
    setOutcome(null);
    setIsDealing(true);
    setTimeout(() => setIsDealing(false), 600);

    if (isBlackjack(ph)) {
      const revealedDh = dh.map((c) => ({ ...c, hidden: false }));
      setDealerHand(revealedDh);
      const dealerBJ = isBlackjack(revealedDh);
      if (dealerBJ) {
        setOutcome("tie");
        addBalance(betBig);
        setGameState("done");
        toast.success("Both Blackjack! It's a tie. Bet returned.");
      } else {
        const payout = betBig + (betBig * 3n) / 2n;
        addBalance(payout);
        setOutcome("blackjack");
        setGameState("done");
        toast.success(`🃏 BLACKJACK! Won ${formatChips(payout)} chips!`, {
          duration: 5000,
        });
      }
      return;
    }

    setGameState("playing");
  }, [bet, balance, subtractBalance, addBalance]);

  const hit = useCallback(() => {
    const card = deck[deck.length - 1];
    const newDeck = deck.slice(0, -1);
    const newHand = [...playerHand, card];
    setDeck(newDeck);
    setPlayerHand(newHand);

    if (isBust(newHand)) {
      setOutcome("loss");
      setGameState("done");
      toast.error(
        `Bust! You went over 21. Lost ${formatChips(currentBet)} chips.`,
      );
    }
  }, [deck, playerHand, currentBet]);

  const stand = useCallback(() => {
    const dealerDeck = [...deck];
    const dh = dealerHand.map((c) => ({ ...c, hidden: false }));
    setDealerHand(dh);
    setGameState("dealer");

    const runDealer = (hand: Card[], deckState: Card[]): [Card[], Card[]] => {
      let d = [...hand];
      let dk = [...deckState];
      while (handTotal(d) < 17) {
        const card = dk.pop();
        if (!card) break;
        d = [...d, card];
        dk = dk.slice(0, -1);
      }
      return [d, dk];
    };

    const [finalDealerHand] = runDealer(dh, dealerDeck);
    setDealerHand(finalDealerHand);

    const playerTotal = handTotal(playerHand);
    const dealerTotal = handTotal(finalDealerHand);

    let result: GameOutcome;
    if (isBust(finalDealerHand) || playerTotal > dealerTotal) {
      result = "win";
      const payout = currentBet * 2n;
      addBalance(payout);
      toast.success(`🎉 You win! Won ${formatChips(currentBet)} chips!`);
    } else if (dealerTotal > playerTotal) {
      result = "loss";
      toast.error(`Dealer wins. Lost ${formatChips(currentBet)} chips.`);
    } else {
      result = "tie";
      addBalance(currentBet);
      toast.success("It's a tie! Bet returned.");
    }

    setOutcome(result);
    setGameState("done");
  }, [deck, dealerHand, playerHand, currentBet, addBalance]);

  const newGame = () => {
    setGameState("betting");
    setPlayerHand([]);
    setDealerHand([]);
    setOutcome(null);
    setDeck([]);
    setCurrentBet(0n);
  };

  const playerTotal = handTotal(playerHand);
  const dealerVisible = handTotal(dealerHand.filter((c) => !c.hidden));

  const outcomeConfig: Record<
    NonNullable<GameOutcome>,
    { label: string; color: string; bg: string }
  > = {
    win: {
      label: "You Win! 🎉",
      color: "text-accent-foreground",
      bg: "bg-emerald/20 border-emerald/50",
    },
    loss: {
      label: "Dealer Wins 😔",
      color: "text-destructive-foreground",
      bg: "bg-ruby/20 border-destructive/50",
    },
    tie: {
      label: "Push — Tie 🤝",
      color: "text-foreground",
      bg: "bg-secondary/80 border-border",
    },
    blackjack: {
      label: "BLACKJACK! 🃏✨",
      color: "text-gold",
      bg: "bg-gold/10 border-gold/50",
    },
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold shimmer-text mb-1">
            Blackjack
          </h1>
          <p className="text-muted-foreground">
            Beat the dealer — get closest to 21 without going over
          </p>
        </div>

        {!isLoggedIn ? (
          <div
            data-ocid="blackjack.login.error_state"
            className="text-center py-16 text-muted-foreground"
          >
            Login to play Blackjack
          </div>
        ) : (
          <div className="rounded-3xl border-2 border-gold/30 bg-card shadow-gold-lg overflow-hidden">
            {/* Table */}
            <div className="casino-felt min-h-[320px] p-6 relative">
              {/* Dealer hand */}
              {(gameState !== "betting" || dealerHand.length > 0) && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-widest text-emerald/80 font-bold">
                      Dealer
                    </span>
                    {dealerHand.length > 0 && (
                      <Badge
                        variant="outline"
                        className="text-xs border-emerald/40 text-emerald"
                      >
                        {gameState === "playing"
                          ? `${dealerVisible}+?`
                          : handTotal(dealerHand)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {dealerHand.map((card, i) => (
                      <PlayingCard
                        key={cardKey(card, i, "d")}
                        card={card}
                        delay={i * 0.1}
                      />
                    ))}
                  </div>
                </div>
              )}

              {gameState !== "betting" && (
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-white/30 text-xs uppercase tracking-widest">
                    vs
                  </span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
              )}

              {/* Player hand */}
              {(gameState !== "betting" || playerHand.length > 0) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-widest text-gold/80 font-bold">
                      You
                    </span>
                    {playerHand.length > 0 && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          playerTotal > 21
                            ? "border-destructive/60 text-destructive"
                            : playerTotal === 21
                              ? "border-gold/60 text-gold"
                              : "border-gold/40 text-gold"
                        }`}
                      >
                        {playerTotal}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {playerHand.map((card, i) => (
                      <PlayingCard
                        key={cardKey(card, i, "p")}
                        card={card}
                        delay={i * 0.15}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Outcome */}
              <AnimatePresence>
                {outcome && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mt-5 py-3 px-5 rounded-xl border text-center font-bold font-display text-xl ${
                      outcomeConfig[outcome].bg
                    } ${outcomeConfig[outcome].color}`}
                    data-ocid="blackjack.outcome.card"
                  >
                    {outcomeConfig[outcome].label}
                    {currentBet > 0n && (
                      <div className="text-sm font-sans font-normal opacity-80 mt-0.5">
                        {outcome === "win"
                          ? `+${formatChips(currentBet)} chips`
                          : outcome === "blackjack"
                            ? `+${formatChips((currentBet * 3n) / 2n)} chips`
                            : outcome === "loss"
                              ? `-${formatChips(currentBet)} chips`
                              : "Bet returned"}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {gameState === "betting" && playerHand.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-white/30 text-sm">
                  Place your bet and deal to start
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="bg-card/70 border-t border-gold/20 p-5 space-y-4">
              {gameState === "betting" && (
                <>
                  <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-1.5">
                        Bet Amount
                      </Label>
                      <Input
                        data-ocid="blackjack.bet.input"
                        type="number"
                        value={bet}
                        onChange={(e) => setBet(e.target.value)}
                        min={10}
                        max={Number(balance)}
                        className="bg-secondary border-border/60 text-foreground font-display text-lg font-bold text-center"
                      />
                    </div>
                    <div className="flex gap-2">
                      {[10, 25, 50, 100].map((amt) => (
                        <button
                          type="button"
                          key={amt}
                          data-ocid="blackjack.bet_preset.button"
                          onClick={() =>
                            setBet(String(Math.min(amt, Number(balance))))
                          }
                          disabled={BigInt(amt) > balance}
                          className="px-2.5 py-2 rounded-lg bg-secondary border border-border/50 text-xs font-bold text-muted-foreground hover:text-gold hover:border-gold/40 disabled:opacity-40 transition-colors"
                        >
                          {amt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button
                    data-ocid="blackjack.deal.primary_button"
                    size="lg"
                    onClick={dealGame}
                    disabled={isDealing || balance < 10n}
                    className="w-full bg-gold hover:bg-gold-light text-primary-foreground font-bold font-display text-xl py-6 rounded-xl shadow-gold"
                  >
                    🃏 Deal Cards
                  </Button>
                </>
              )}

              {gameState === "playing" && (
                <div className="flex gap-3">
                  <Button
                    data-ocid="blackjack.hit.primary_button"
                    size="lg"
                    onClick={hit}
                    className="flex-1 bg-emerald/80 hover:bg-emerald text-white font-bold font-display text-lg py-5 rounded-xl"
                  >
                    Hit
                  </Button>
                  <Button
                    data-ocid="blackjack.stand.secondary_button"
                    size="lg"
                    onClick={stand}
                    variant="outline"
                    className="flex-1 border-gold/50 text-gold hover:bg-gold/10 font-bold font-display text-lg py-5 rounded-xl"
                  >
                    Stand
                  </Button>
                </div>
              )}

              {gameState === "dealer" && (
                <div
                  data-ocid="blackjack.dealer.loading_state"
                  className="text-center py-3 text-muted-foreground animate-pulse"
                >
                  Dealer playing...
                </div>
              )}

              {gameState === "done" && (
                <Button
                  data-ocid="blackjack.new_game.primary_button"
                  size="lg"
                  onClick={newGame}
                  className="w-full bg-gold hover:bg-gold-light text-primary-foreground font-bold font-display text-xl py-6 rounded-xl shadow-gold"
                >
                  New Game
                </Button>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Coins className="w-3 h-3 text-gold" />
                  Balance:{" "}
                  <span className="text-gold font-bold ml-1">
                    {formatChips(balance)}
                  </span>
                </span>
                {currentBet > 0n && gameState !== "betting" && (
                  <span>
                    Bet:{" "}
                    <span className="text-gold font-bold">
                      {formatChips(currentBet)}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
