# Lucky Casino

## Current State
Lucky Casino has three games (Slots, Blackjack, Roulette) using play-money chips. Game outcomes are determined purely by frontend randomness. The backend (main.mo) handles chip balances, game history, and user profiles. Authorization (MixinAuthorization) is already installed with admin/user roles.

## Requested Changes (Diff)

### Add
- Win rate storage in backend: per-game win rate (0–100 integer %) for Slots, Blackjack, and Roulette
- `getWinRates()` public query returning win rates for all three games
- `setWinRate(gameType, rate)` admin-only update function
- Admin page in the frontend accessible via a hidden/bottom link or nav item
- Admin login using Internet Identity (already available via useInternetIdentity hook)
- Admin win rate control UI: sliders or number inputs (0–100) per game, save button
- Frontend reads win rates on load and uses them to bias game outcomes

### Modify
- Slots: use fetched win rate to bias spin result (if rand < winRate%, force a winning combination)
- Blackjack: use fetched win rate to bias dealer behavior (if rand < winRate%, ensure player wins)
- Roulette: use fetched win rate to bias wheel result (if rand < winRate%, ensure bet wins)
- App.tsx: add "admin" page to page type and routing
- Layout: add discreet admin link (visible only when logged in as admin)

### Remove
- Nothing removed

## Implementation Plan
1. Add `winRates` map to backend state, default 50 for each game
2. Implement `getWinRates` and `setWinRate` (admin-only) in main.mo
3. Create WinRateContext in frontend to fetch and cache win rates
4. Create Admin.tsx page with Internet Identity login gate, per-game sliders (0–100), and save
5. Update Slots, Blackjack, Roulette to read win rate from context and bias randomness accordingly
6. Add admin route to App.tsx; add discreet admin nav link in Layout
