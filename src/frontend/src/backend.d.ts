import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Chips = bigint;
export type Time = bigint;
export interface CasinoPlayerProfile {
    gamesPlayed: bigint;
    gameHistory: Array<GameResult>;
    chipBalance: Chips;
    totalWinnings: Chips;
    lastBonusClaim?: Time;
}
export interface GameResult {
    timestamp: Time;
    gameType: GameType;
    amount: bigint;
    outcome: Variant_tie_win_loss;
}
export interface UserProfile {
    name: string;
}
export enum GameType {
    blackjack = "blackjack",
    slots = "slots",
    roulette = "roulette"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_tie_win_loss {
    tie = "tie",
    win = "win",
    loss = "loss"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    claimDailyBonus(): Promise<bigint>;
    clearPlayerHistory(player: Principal): Promise<void>;
    getCallerChipBalance(): Promise<bigint>;
    getCallerProfile(): Promise<CasinoPlayerProfile | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getLastGameResults(): Promise<Array<GameResult>>;
    getLeaderboard(): Promise<Array<[Principal, bigint]>>;
    getPlayerProfile(player: Principal): Promise<CasinoPlayerProfile | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    resetPlayerBalance(player: Principal, newBalance: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    spinWheel(): Promise<string>;
}
