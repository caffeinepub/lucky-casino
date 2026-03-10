import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  KeyRound,
  Loader2,
  Lock,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GameType } from "../backend";
import { useWinRates } from "../context/WinRateContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function Admin() {
  const { login, loginStatus, identity } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const { refetch } = useWinRates();
  const isLoggedIn = loginStatus === "success" && !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [slots, setSlots] = useState("50");
  const [blackjack, setBlackjack] = useState("50");
  const [roulette, setRoulette] = useState("50");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Claim admin state
  const [claimToken, setClaimToken] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimExpanded, setClaimExpanded] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !actor || isFetching) return;
    const a = actor as any;
    setCheckingAdmin(true);
    actor
      .isCallerAdmin()
      .then((admin: boolean) => {
        setIsAdmin(admin);
        if (admin) {
          setLoading(true);
          a.getWinRates()
            .then(
              (r: { slots: bigint; blackjack: bigint; roulette: bigint }) => {
                setSlots(String(r.slots));
                setBlackjack(String(r.blackjack));
                setRoulette(String(r.roulette));
              },
            )
            .catch(() => {})
            .finally(() => setLoading(false));
        }
      })
      .catch(() => setIsAdmin(false))
      .finally(() => setCheckingAdmin(false));
  }, [isLoggedIn, actor, isFetching]);

  const handleSave = async () => {
    if (!actor) return;
    const a = actor as any;
    const s = Number.parseInt(slots, 10);
    const b = Number.parseInt(blackjack, 10);
    const r = Number.parseInt(roulette, 10);
    if ([s, b, r].some((v) => Number.isNaN(v) || v < 0 || v > 100)) {
      toast.error("Win rates must be between 0 and 100");
      return;
    }
    setSaving(true);
    try {
      await Promise.all([
        a.setWinRate(GameType.slots, BigInt(s)),
        a.setWinRate(GameType.blackjack, BigInt(b)),
        a.setWinRate(GameType.roulette, BigInt(r)),
      ]);
      refetch();
      toast.success("Win rates updated successfully!");
    } catch {
      toast.error("Failed to save win rates.");
    } finally {
      setSaving(false);
    }
  };

  const handleClaimAdmin = async () => {
    if (!actor || !claimToken.trim()) return;
    const a = actor as any;
    setClaiming(true);
    try {
      await a._initializeAccessControlWithSecret(claimToken.trim());
      toast.success("Admin access granted! Refreshing...");
      // Re-check admin status
      const admin = await actor.isCallerAdmin();
      setIsAdmin(admin);
      if (admin) {
        setLoading(true);
        a.getWinRates()
          .then((r: { slots: bigint; blackjack: bigint; roulette: bigint }) => {
            setSlots(String(r.slots));
            setBlackjack(String(r.blackjack));
            setRoulette(String(r.roulette));
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      }
    } catch {
      toast.error("Invalid token or already claimed");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold/10 border border-gold/30 mb-4">
            <Shield className="w-8 h-8 text-gold" />
          </div>
          <h1 className="font-display text-4xl font-bold shimmer-text mb-2">
            Admin Panel
          </h1>
          <p className="text-muted-foreground text-sm">
            Casino win rate configuration
          </p>
        </div>

        {!isLoggedIn ? (
          <div className="rounded-2xl border border-gold/30 bg-card shadow-gold-lg p-8 text-center space-y-5">
            <Lock className="w-10 h-10 text-gold/60 mx-auto" />
            <div>
              <p className="font-display font-bold text-lg text-foreground mb-1">
                Admin Login Required
              </p>
              <p className="text-muted-foreground text-sm">
                Sign in with your admin identity to access win rate controls.
              </p>
            </div>
            <Button
              data-ocid="admin.login.primary_button"
              size="lg"
              onClick={login}
              disabled={isLoggingIn}
              className="w-full bg-gold hover:bg-gold-light text-primary-foreground font-bold font-display text-lg py-6 rounded-xl shadow-gold"
            >
              {isLoggingIn ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Connecting...
                </span>
              ) : (
                "🔐 Login with Internet Identity"
              )}
            </Button>
          </div>
        ) : checkingAdmin ? (
          <div
            data-ocid="admin.check.loading_state"
            className="text-center py-16"
          >
            <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Verifying admin access...
            </p>
          </div>
        ) : isAdmin === false ? (
          <div className="space-y-4">
            {/* Access Denied */}
            <div
              data-ocid="admin.access_denied.error_state"
              className="rounded-2xl border border-destructive/40 bg-ruby/10 p-8 text-center space-y-3"
            >
              <ShieldAlert className="w-10 h-10 text-destructive mx-auto" />
              <p className="font-display font-bold text-lg text-destructive">
                Access Denied
              </p>
              <p className="text-muted-foreground text-sm">
                Your account does not have admin privileges. Contact the casino
                owner to request access.
              </p>
            </div>

            {/* Claim Admin Access */}
            <div className="rounded-2xl border border-gold/20 bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => setClaimExpanded((v) => !v)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gold/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <KeyRound className="w-5 h-5 text-gold/70" />
                  <span className="font-display font-semibold text-sm text-foreground/80">
                    Claim Admin Access
                  </span>
                </div>
                <motion.span
                  animate={{ rotate: claimExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-muted-foreground text-xs"
                >
                  ▼
                </motion.span>
              </button>

              <AnimatePresence>
                {claimExpanded && (
                  <motion.div
                    key="claim-panel"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="px-6 pb-6 space-y-4 border-t border-gold/10 pt-4">
                      <p className="text-muted-foreground text-xs">
                        If you have the casino admin token, enter it below to
                        claim admin privileges for your account.
                      </p>
                      <div className="space-y-2">
                        <Label
                          htmlFor="admin-token"
                          className="text-foreground/80 text-sm font-medium"
                        >
                          Admin Token
                        </Label>
                        <Input
                          id="admin-token"
                          data-ocid="admin.claim_token.input"
                          type="password"
                          placeholder="Enter admin token"
                          value={claimToken}
                          onChange={(e) => setClaimToken(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleClaimAdmin();
                          }}
                          disabled={claiming}
                          className="bg-secondary border-border/60 text-foreground"
                        />
                      </div>
                      <Button
                        data-ocid="admin.claim.primary_button"
                        onClick={handleClaimAdmin}
                        disabled={claiming || !claimToken.trim()}
                        className="w-full bg-gold hover:bg-gold-light text-primary-foreground font-bold font-display rounded-xl shadow-gold"
                      >
                        {claiming ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Claiming...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" />
                            Claim Admin
                          </span>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-gold/30 bg-card shadow-gold-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gold/20 bg-gold/5">
              <h2 className="font-display font-bold text-gold uppercase tracking-wider text-sm">
                Win Rate Settings
              </h2>
              <p className="text-muted-foreground text-xs mt-0.5">
                Set the probability (0–100%) that a player wins each game.
              </p>
            </div>

            {loading ? (
              <div
                data-ocid="admin.rates.loading_state"
                className="py-12 text-center"
              >
                <Loader2 className="w-6 h-6 text-gold animate-spin mx-auto" />
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {(
                  [
                    {
                      label: "🎰 Slots",
                      id: "slots",
                      value: slots,
                      setter: setSlots,
                      ocid: "admin.slots_rate.input",
                    },
                    {
                      label: "🃏 Blackjack",
                      id: "blackjack",
                      value: blackjack,
                      setter: setBlackjack,
                      ocid: "admin.blackjack_rate.input",
                    },
                    {
                      label: "🎡 Roulette",
                      id: "roulette",
                      value: roulette,
                      setter: setRoulette,
                      ocid: "admin.roulette_rate.input",
                    },
                  ] as const
                ).map((game) => (
                  <div key={game.id}>
                    <div className="flex items-center justify-between mb-2">
                      <Label
                        htmlFor={game.id}
                        className="text-foreground font-medium"
                      >
                        {game.label}
                      </Label>
                      <span className="text-gold font-bold font-display text-lg">
                        {game.value}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        id={game.id}
                        data-ocid={game.ocid}
                        type="number"
                        min={0}
                        max={100}
                        value={game.value}
                        onChange={(e) => game.setter(e.target.value)}
                        className="bg-secondary border-border/60 text-foreground font-display text-lg font-bold text-center w-24 flex-shrink-0"
                      />
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Number(game.value) || 0}
                        onChange={(e) => game.setter(e.target.value)}
                        className="flex-1 accent-[oklch(var(--gold))]"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Number(game.value) < 30
                        ? "House edge favored"
                        : Number(game.value) > 70
                          ? "Player favored"
                          : "Balanced"}
                    </p>
                  </div>
                ))}

                <Button
                  data-ocid="admin.save.primary_button"
                  size="lg"
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-gold hover:bg-gold-light text-primary-foreground font-bold font-display text-lg py-6 rounded-xl shadow-gold mt-2"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                    </span>
                  ) : (
                    "💾 Save Win Rates"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
