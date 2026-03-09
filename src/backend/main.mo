import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import List "mo:core/List";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Random "mo:core/Random";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Types
  type SpinSymbol = {
    #cherry;
    #lemon;
    #orange;
    #plum;
    #bell;
    #star;
    #seven;
    #joker;
  };

  type Card = {
    suit : { #hearts; #diamonds; #clubs; #spades };
    rank : { #ace; #two; #three; #four; #five; #six; #seven; #eight; #nine; #ten; #jack; #queen; #king };
  };

  type Hand = {
    cards : [Card];
    value : Nat;
    isSoft : Bool; // True if hand contains an ace counted as 11
  };

  type WheelSpin = {
    number : Nat;
    color : { #red; #black; #green };
  };

  type Bet = {
    amount : Nat;
    betType : {
      #number : Nat;
      #color : { #red; #black };
      #parity : { #odd; #even };
    };
  };

  type GameType = {
    #slots;
    #blackjack;
    #roulette;
  };

  type GameResult = {
    gameType : GameType;
    outcome : {
      #win;
      #loss;
      #tie;
    };
    amount : Nat;
    timestamp : Time.Time;
  };

  type Chips = Nat;

  public type UserProfile = {
    name : Text;
  };

  public type WinRates = {
    slots : Nat;
    blackjack : Nat;
    roulette : Nat;
  };

  type CasinoPlayerProfile = {
    chipBalance : Chips;
    totalWinnings : Chips;
    gamesPlayed : Nat;
    lastBonusClaim : ?Time.Time;
    gameHistory : [GameResult];
  };

  // Persistent State
  let playerProfiles = Map.empty<Principal, CasinoPlayerProfile>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Win Rates State (0-100 representing percentage chance of player winning)
  var slotsWinRate : Nat = 50;
  var blackjackWinRate : Nat = 50;
  var rouletteWinRate : Nat = 50;

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Win Rate Functions
  public query func getWinRates() : async WinRates {
    {
      slots = slotsWinRate;
      blackjack = blackjackWinRate;
      roulette = rouletteWinRate;
    };
  };

  public shared ({ caller }) func setWinRate(gameType : GameType, rate : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set win rates");
    };
    if (rate > 100) {
      Runtime.trap("Win rate must be between 0 and 100");
    };
    switch (gameType) {
      case (#slots) { slotsWinRate := rate };
      case (#blackjack) { blackjackWinRate := rate };
      case (#roulette) { rouletteWinRate := rate };
    };
  };

  // User Profile Management (Required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Utility Functions
  module CasinoPlayerProfile {
    public func compareByChips(profile1 : CasinoPlayerProfile, profile2 : CasinoPlayerProfile) : Order.Order {
      Int.compare(profile2.chipBalance, profile1.chipBalance);
    };
  };

  func ensureRegistered(caller : Principal) : CasinoPlayerProfile {
    switch (playerProfiles.get(caller)) {
      case (null) {
        let newProfile : CasinoPlayerProfile = {
          chipBalance = 1_000;
          totalWinnings = 0;
          gamesPlayed = 0;
          lastBonusClaim = null;
          gameHistory = [];
        };
        playerProfiles.add(caller, newProfile);
        newProfile;
      };
      case (?profile) { profile };
    };
  };

  func updateProfile(caller : Principal, profile : CasinoPlayerProfile) {
    playerProfiles.add(caller, profile);
  };

  // Main Functionality
  public shared ({ caller }) func claimDailyBonus() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can claim daily bonus");
    };

    let profile = ensureRegistered(caller);
    let currentTime = Time.now();
    let dayNanos = 24 * 60 * 60 * 1_000_000_000;

    // Check if bonus already claimed today
    switch (profile.lastBonusClaim) {
      case (?lastClaim) {
        if (currentTime - lastClaim < dayNanos) {
          Runtime.trap("Bonus already claimed today");
        };
      };
      case (null) {};
    };

    let newProfile : CasinoPlayerProfile = {
      chipBalance = profile.chipBalance + 500;
      totalWinnings = profile.totalWinnings;
      gamesPlayed = profile.gamesPlayed;
      lastBonusClaim = ?currentTime;
      gameHistory = profile.gameHistory;
    };
    updateProfile(caller, newProfile);
    newProfile.chipBalance;
  };

  public query ({ caller }) func getCallerChipBalance() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view chip balance");
    };

    switch (playerProfiles.get(caller)) {
      case (null) { 0 };
      case (?profile) { profile.chipBalance };
    };
  };

  public query ({ caller }) func getLeaderboard() : async [(Principal, Nat)] {
    // Leaderboard is public - no authorization check needed
    playerProfiles.entries().toArray().sort(
      func((_, a), (_, b)) { Nat.compare(b.chipBalance, a.chipBalance) }
    ).map(
      func((p, prof)) { (p, prof.chipBalance) }
    ).sliceToArray(0, 10);
  };

  public query ({ caller }) func getLastGameResults() : async [GameResult] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view game history");
    };

    switch (playerProfiles.get(caller)) {
      case (null) { [] };
      case (?profile) {
        profile.gameHistory.sliceToArray(0, 20);
      };
    };
  };

  public query ({ caller }) func getCallerProfile() : async ?CasinoPlayerProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their profile");
    };

    playerProfiles.get(caller);
  };

  public query ({ caller }) func getPlayerProfile(player : Principal) : async ?CasinoPlayerProfile {
    if (caller != player and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile or admin access required");
    };

    playerProfiles.get(player);
  };

  // Admin Functions
  public shared ({ caller }) func resetPlayerBalance(player : Principal, newBalance : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reset player balances");
    };

    switch (playerProfiles.get(player)) {
      case (null) {
        Runtime.trap("Player not found");
      };
      case (?profile) {
        let updatedProfile : CasinoPlayerProfile = {
          chipBalance = newBalance;
          totalWinnings = profile.totalWinnings;
          gamesPlayed = profile.gamesPlayed;
          lastBonusClaim = profile.lastBonusClaim;
          gameHistory = profile.gameHistory;
        };
        updateProfile(player, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func clearPlayerHistory(player : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can clear player history");
    };

    switch (playerProfiles.get(player)) {
      case (null) {
        Runtime.trap("Player not found");
      };
      case (?profile) {
        let updatedProfile : CasinoPlayerProfile = {
          chipBalance = profile.chipBalance;
          totalWinnings = 0;
          gamesPlayed = 0;
          lastBonusClaim = profile.lastBonusClaim;
          gameHistory = [];
        };
        updateProfile(player, updatedProfile);
      };
    };
  };

  // Spin Method for High-stakes Gamblers
  public shared ({ caller }) func spinWheel() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can spin the wheel");
    };

    "This wheel doesn't spin anymore!";
  };
};
