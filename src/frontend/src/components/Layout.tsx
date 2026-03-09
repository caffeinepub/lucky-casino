import { Button } from "@/components/ui/button";
import {
  Coins,
  Dices,
  LogIn,
  LogOut,
  Menu,
  Spade,
  Trophy,
  User,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useState } from "react";
import type { Page } from "../App";
import { useChips } from "../context/ChipContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface LayoutProps {
  children: ReactNode;
  page: Page;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS: { id: Page; label: string; icon: ReactNode }[] = [
  { id: "lobby", label: "Lobby", icon: <Spade className="w-4 h-4" /> },
  { id: "slots", label: "Slots", icon: <span className="text-sm">🎰</span> },
  {
    id: "blackjack",
    label: "Blackjack",
    icon: <span className="text-sm">🃏</span>,
  },
  {
    id: "roulette",
    label: "Roulette",
    icon: <span className="text-sm">🎡</span>,
  },
  {
    id: "leaderboard",
    label: "Leaderboard",
    icon: <Trophy className="w-4 h-4" />,
  },
  { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
];

function formatChips(n: bigint): string {
  return Number(n).toLocaleString();
}

export default function Layout({ children, page, onNavigate }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { balance } = useChips();
  const isLoggedIn = loginStatus === "success" && !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <button
            type="button"
            data-ocid="nav.lobby.link"
            onClick={() => {
              onNavigate("lobby");
              setMobileOpen(false);
            }}
            className="flex items-center gap-2 flex-shrink-0"
          >
            <Dices className="w-7 h-7 text-gold" />
            <span className="font-display text-xl font-bold shimmer-text hidden sm:block">
              Lucky Casino
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                type="button"
                key={item.id}
                data-ocid={`nav.${item.id}.link`}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  page === item.id
                    ? "bg-primary/20 text-gold border border-gold/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right side: balance + login */}
          <div className="flex items-center gap-3">
            {isLoggedIn && (
              <div className="hidden sm:flex items-center gap-2 bg-secondary/80 border border-gold/20 rounded-lg px-3 py-1.5">
                <Coins className="w-4 h-4 text-gold" />
                <span className="text-gold font-bold text-sm font-display">
                  {formatChips(balance)}
                </span>
              </div>
            )}

            {isLoggedIn ? (
              <Button
                data-ocid="nav.logout.button"
                variant="outline"
                size="sm"
                onClick={clear}
                className="border-border/60 text-muted-foreground hover:text-foreground hidden sm:flex"
              >
                <LogOut className="w-4 h-4 mr-1" /> Logout
              </Button>
            ) : (
              <Button
                data-ocid="nav.login.button"
                size="sm"
                onClick={login}
                disabled={isLoggingIn}
                className="bg-gold text-primary-foreground hover:bg-gold-light font-bold hidden sm:flex"
              >
                <LogIn className="w-4 h-4 mr-1" />
                {isLoggingIn ? "Connecting..." : "Login"}
              </Button>
            )}

            {/* Mobile hamburger */}
            <button
              type="button"
              data-ocid="nav.menu.toggle"
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border/50 bg-card"
          >
            <div className="px-4 py-3 space-y-1">
              {isLoggedIn && (
                <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-secondary/60 rounded-lg">
                  <Coins className="w-4 h-4 text-gold" />
                  <span className="text-gold font-bold font-display">
                    {formatChips(balance)} chips
                  </span>
                </div>
              )}
              {NAV_ITEMS.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  data-ocid={`nav.mobile.${item.id}.link`}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    page === item.id
                      ? "bg-primary/20 text-gold"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {item.icon} {item.label}
                </button>
              ))}
              <div className="pt-2 border-t border-border/50">
                {isLoggedIn ? (
                  <button
                    type="button"
                    data-ocid="nav.mobile.logout.button"
                    onClick={clear}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                ) : (
                  <Button
                    data-ocid="nav.mobile.login.button"
                    className="w-full bg-gold text-primary-foreground hover:bg-gold-light font-bold"
                    onClick={() => {
                      login();
                      setMobileOpen(false);
                    }}
                    disabled={isLoggingIn}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    {isLoggingIn ? "Connecting..." : "Login to Play"}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-card/40 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()}. Built with ♥ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:text-gold-light transition-colors"
            >
              caffeine.ai
            </a>{" "}
            — Play responsibly. No real money involved.
          </p>
        </div>
      </footer>
    </div>
  );
}
