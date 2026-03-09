import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import Layout from "./components/Layout";
import { ChipProvider } from "./context/ChipContext";
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
  | "profile";

export default function App() {
  const [page, setPage] = useState<Page>("lobby");

  return (
    <ChipProvider>
      <Layout page={page} onNavigate={setPage}>
        {page === "lobby" && <Lobby onNavigate={setPage} />}
        {page === "slots" && <Slots />}
        {page === "blackjack" && <Blackjack />}
        {page === "roulette" && <Roulette />}
        {page === "leaderboard" && <Leaderboard />}
        {page === "profile" && <Profile />}
      </Layout>
      <Toaster richColors position="top-center" />
    </ChipProvider>
  );
}
