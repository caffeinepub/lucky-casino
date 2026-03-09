import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import Layout from "./components/Layout";
import { ChipProvider } from "./context/ChipContext";
import { WinRateProvider } from "./context/WinRateContext";
import Admin from "./pages/Admin";
import Blackjack from "./pages/Blackjack";
import Leaderboard from "./pages/Leaderboard";
import Lobby from "./pages/Lobby";
import Profile from "./pages/Profile";
import Roulette from "./pages/Roulette";
import Slots from "./pages/Slots";

export type Page =
  | "lobby"
  | "slots"
  | "blackjack"
  | "roulette"
  | "leaderboard"
  | "profile"
  | "admin";

export default function App() {
  const [page, setPage] = useState<Page>("lobby");

  return (
    <ChipProvider>
      <WinRateProvider>
        <Layout page={page} onNavigate={setPage}>
          {page === "lobby" && <Lobby onNavigate={setPage} />}
          {page === "slots" && <Slots />}
          {page === "blackjack" && <Blackjack />}
          {page === "roulette" && <Roulette />}
          {page === "leaderboard" && <Leaderboard />}
          {page === "profile" && <Profile />}
          {page === "admin" && <Admin />}
        </Layout>
        <Toaster richColors position="top-center" />
      </WinRateProvider>
    </ChipProvider>
  );
}
