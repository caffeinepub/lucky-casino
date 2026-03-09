# Lucky Casino

## Current State
New project, nothing exists yet.

## Requested Changes (Diff)

### Add
- Virtual casino website with play-money chips (no real money)
- Player wallet: starts with 1000 chips, can claim daily bonus
- Three games: Slot Machine, Blackjack, Roulette
- Leaderboard tracking top chip holders
- Game history per player

### Modify
N/A

### Remove
N/A

## Implementation Plan

### Backend (Motoko)
- Player profile: identity-based, chip balance, total winnings, games played
- Daily bonus claim (once per 24h): +500 chips
- Slot machine: bet amount, random 3-reel spin, payout multipliers
- Blackjack: bet, deal, hit, stand logic with dealer AI
- Roulette: bet on number/color/odd-even, spin result
- Leaderboard: top 10 players by chip balance
- Game history: last 20 results per player

### Frontend
- Landing/lobby page with chip balance prominently displayed
- Three game cards to navigate to each game
- Slot machine page with animated reels UI
- Blackjack page with card UI
- Roulette page with betting board
- Leaderboard page
- Daily bonus button
