// import { eventNames } from "cluster";

import { Agent, get as getAgent } from "./agent";

type PlayerID = string;
export type GameId = string;
type MissionID = string;

export type Role = "knight" | "minion" | "merlin" | "assassin";
export type Team = "knights" | "minions";

// interface MakeGame {
//   agent: AgentID;
//   game: GameID;
// }

// interface JoinGame {
//   agent: AgentID;
//   game: GameID;
//   player: PlayerID;
// }

// interface StartGame {
//   agent: AgentID;
//   player: PlayerID;
//   game: GameID;
// }

// interface ProposeMission {
//   agent: AgentID;
//   player: PlayerID;
//   id: MissionID;
//   mission: PlayerID[];
// }

// interface StartRound {
//   agent: AgentID;  // Will almost always be server agent ID
//   round: number;
// }

// interface StartTurn {
//   agent: AgentID;  // Will almost always be server agent ID
//   player: PlayerID;
// }

// interface Vote {
//   agent: AgentID;
//   player: PlayerID;
//   vote: boolean;
// }

// interface VotingOutcome {
//   agent: AgentID;  // Probably server agent ID
//   mission: MissionID;
//   outcome: boolean;  // Means it was approved or rejected
// }

// interface PassFailAction {
//   agent: AgentID;
//   player: PlayerID;  // Which player this action is for
//   mission: MissionID;  // Which mission this action is for
//   action: boolean;
// }

// type Event = MakeGame;

// /** State for a game. */
// interface OldGame {
//   owner: AgentID;
//   started: boolean;

//   // Stages:
//   // - Created (during this time players can join)

//   // - Round     -- All in here vvv, idea of "current round" and "current turn" is meaningful.
//   //   - Turn
//   //   - ...
//   // - Round
//   //   - Turn
//   //   - ...
//   // - Round
//   //   - Turn
//   //   - ...

//   // - Finished  -- Here, no "current round", no "current "
//   //
//   //
//   players: PlayerID[];

// }

// type GameStage = "created" | "active" | "finished";


// interface BaseGame {
//   owner: AgentID;
//   players: PlayerID[];
//   stage: GameStage;
// }

// interface CreatedGame extends BaseGame {
//   stage: "created";
// }

// interface ActiveGame extends BaseGame {
//   finished: number;
//   stage: "active";
//   round: number;
//   turn: number;
// }

// interface FinishedGame extends BaseGame {
//   stage: "finished";
//   winner: Team;
// }

// type Game = CreatedGame | ActiveGame | FinishedGame;


// /** State for whole app. */
// interface AppState {
//   games: { [id: string]: Game | undefined };
// }

// // Event engine needs to be like:
// // Event -> ingest -> process -> distribute to buddies

// // Each agent must be able to receive events, events can come from any agent.
// // User agents send all their events to the server; server has event engine
// // which may or may not distribute those events elsewhere, but server agent
// // also ingests them and does stuff

// function newEmptyGame(owner: AgentID): Game {
//   return {
//     owner,
//     players: [],
//   };
// }

// function handleMakeGame(x: AppState, e: MakeGame): AppState {
//   if (e.game in x.games) {
//     console.log(`error: Game ${e.game} already exists.`);
//     return x;
//   }

//   return {
//     ...x,
//     games: {
//       ...x.games,
//       [e.game]: newEmptyGame(e.agent),
//     },
//   };
// }

// function game(x: AppState, id: GameID): Game | undefined {
//   return x.games[id];
// }

// function handleJoinGame(x: AppState, e: JoinGame): AppState {
//   const g = game(x, e.game);
//   if (g == null) {
//     console.log(`error: Game ${e.game} doesn't exist.`);
//     return x;
//   }
//   if (e.player in g.players) {
//     console.log(`error: Game ${e.game} already contains a player ${e.player}.`);
//     return x;
//   }

//   const newPlayers = [...g.players, e.player];
//   const newGame = { ...g, players: newPlayers };
//   const newGames = { ...x.games, [e.game]: newGame };
//   return { ...x, games: newGames };
// }

// function handleStartGame(x: AppState, e: StartGame): AppState {
//   // Lo-fi, just start the game if you receive this
//   const g = game(x, e.game);
  
//   if (e.agent != x.owner) {
//     console.log(`error: Agent ${e.agent} cannot start game ${e.game} because they don't own it.`);
//     return x;
//   }
// }

// function handleProposeMission(g: Game, e: ProposeMission): Game {

// }

// function handleStartRound(g: Game, e: StartRound): Game {

// }

// function handleStartTurn(g: Game, e: StartTurn): Game {

// }

// function handleVote(g: Game, e: Vote): Game {

// }

// function handleVotingOutcome(g: Game, e: VotingOutcome): Game {

// }

// function handlePassFailAction(g: Game, e: PassFailAction): Game {

// }


// // Agent will be created on browser —
// //
// // MakeGame (agent ID, new ID)
// // JoinGame (agent ID, game ID, player ID) -- joins under a given player ID, player IDs must be unique to game
// // StartGame (agent ID, game ID) -- will trigger server to assign roles and give notifications and stuff
// //
// // ProposeMission (agent ID, )
// //
// // VoteOnMission (agent ID)

// // How to identify other players in game?
// // - Agent ID, then one agent can be in multiple games, but they cannot be in the same game multiple times. Seems reasonable.
// // - Player ID, unique string assigned to them within the game, or maybe just a number. Player ID
// //

// /*
// Players get roles, maybe see some info on other players.

// Random first player -- correct?
// It's someone's turn to propose a mission.
// */

interface ChangeName {
  type: "change-name";
  agent: Agent;
  name: string;
}

interface JoinGame {
  type: "join-game";
  agent: Agent;
  game: GameId;
}

interface StartGame {
  type: "start-game";
  agent: Agent;
  game: GameId;
}

interface AssignRole {
  type: "assign-role";
  agent: Agent;  // agent doing the assigning
  assignee: Agent;
  role: Role;
  game: GameId;
}

interface FinishAssigningRoles {
  type: "finish-assigning-roles";
  agent: Agent;  // agent doing the assigning
  game: GameId;
}

interface ProposeMission {
  type: "propose-mission";
  agent: Agent;
  mission: Agent[];
  game: GameId;
}

interface Vote {
  type: "vote";
  agent: Agent;
  vote: boolean;
  game: GameId;
}

interface Trial {
  type: "trial";
  agent: Agent;
  trial: boolean;
  game: GameId;
}

export type Event = JoinGame | StartGame | AssignRole | FinishAssigningRoles | ProposeMission | Vote | Trial;

export function assignRole(game: GameId, assignee: Agent, role: Role): AssignRole {
  return {
    type: "assign-role",
    agent: getAgent(),
    assignee,
    role,
    game,
  };
}

export function finishAssigningRoles(game: GameId): FinishAssigningRoles {
  return {
    type: "finish-assigning-roles",
    agent: getAgent(),
    game,
  }
}

export type GameHistory = Event[];

export interface AppState {
  games: { [id: string]: Event[] | undefined };
}

export function gameHistory(x: AppState, g: GameId) {
  return x.games[g] || [];
}

export function gameExists(x: AppState, g: GameId) {
  return x.games[g] != null;
}

export function gameStarted(game: GameHistory): boolean {
  return game.find(e => e.type === "start-game") != null;
}

function gameFinished(game: GameHistory): boolean {
  return false;
}

function gameActive(game: GameHistory): boolean {
  return gameStarted(game) && !gameFinished(game);
}

// export function canJoin(history: GameHistory): boolean {
//   return !gameStarted(history) && !amInGame(history);
// }

// export function canStart(game: GameHistory): boolean {
//   return amOwner(game) && !gameStarted(game);
// }

export function gamePlayers(game: GameHistory): Agent[] {
  return game.reduce((players: Agent[], e: Event) => {
    if (e.type === "join-game") return [...players, e.agent];
    return players;
  }, []);
}

export function gameRound(g: GameHistory): number {
  return 0;
}

export function turnCount(game: GameHistory): number {
  return game.reduce((n, e) => {
    return n;
  }, 0);
}

export function turnAgent(game: GameHistory): Agent | undefined {
  if (!gameActive(game)) return;
  const players = gamePlayers(game);
  const turn = turnCount(game);
  return players[turn % players.length];
}

export function rolesAssigned(game: GameHistory): boolean {
  const unassigned: Set<Agent> = new Set();
  game.forEach(e => {
    if (e.type === "join-game") unassigned.add(e.agent);
    if (e.type === "assign-role") unassigned.delete(e.assignee);
  });
  return unassigned.size === 0;
}

function gameSize(g: GameHistory): number {
  return g.reduce((n: number, e: Event) => {
    if (e.type === "join-game") return n + 1;
    return n;
  }, 0);
}

function nextMissionSize(g: GameHistory): number | undefined {
  switch (gameSize(g)) {
    case 5: return [2, 3, 2, 3, 3][gameRound(g)];
    case 6: return [2, 3, 4, 3, 4][gameRound(g)];
    case 7: return [2, 3, 3, 4, 4][gameRound(g)];
    case 8: return [3, 4, 4, 5, 5][gameRound(g)];
    case 9: return [3, 4, 4, 5, 5][gameRound(g)];
    case 10: return [3, 4, 4, 5, 5][gameRound(g)];
  }
}

function missionRemainingVotes(g: GameHistory): number {
  return g.reduce((remaining, e) => {
    if (e.type === "propose-mission") return gameSize(g);
    if (e.type === "vote") return remaining - 1;
    return remaining;
  }, 0);
}

function missionVoting(g: GameHistory): boolean {
  return missionRemainingVotes(g) !== 0;
}

// For, you know, unnecessary type safety. A game can have between 5 and 10
// players.
type Players =
  [Agent, Agent, Agent, Agent, Agent] |
  [Agent, Agent, Agent, Agent, Agent, Agent] |
  [Agent, Agent, Agent, Agent, Agent, Agent, Agent] |
  [Agent, Agent, Agent, Agent, Agent, Agent, Agent, Agent] |
  [Agent, Agent, Agent, Agent, Agent, Agent, Agent, Agent, Agent] |
  [Agent, Agent, Agent, Agent, Agent, Agent, Agent, Agent, Agent, Agent];

// For, you know, unnecessary type safety. A mission can have between 2 and 5
// players.
type Mission =
  [Agent, Agent] |
  [Agent, Agent, Agent] |
  [Agent, Agent, Agent, Agent] |
  [Agent, Agent, Agent, Agent, Agent];

// A game in the "new" phase can be joined and configured.
interface NewPhase {
  phase: "new";
  players: Agent[];
}

interface Closed {
  players: Players;
  roles: { [agent: string]: Role };
}

// A game in the "started" phase has fixed players and configuration, but its
// roles have not been assigned yet.
export interface StartedPhase extends Closed {
  phase: "started";
  players: Players;
}

interface ActivePhase extends Closed {
  players: Players;
  roles: { [agent: string]: Role };
  round: number;
  turn: number;
  consecutiveRejects: number;
  knightsScore: number;
  minionsScore: number;
}

// A game in the "proposing" phase has a defined round number and turn number.
interface ProposingPhase extends ActivePhase {
  phase: "proposing";
}

// A game in the "voting" phase has a specific mission that's been proposed,
// and a set of pending votes.
export interface VotingPhase extends ActivePhase {
  phase: "voting";
  mission: Mission;
  votes: { [agent: string]: boolean };
}

// A game in the "trial" phase has a mission that's been approved, and those
// players can each pass or fail the mission.
export interface QuestPhase extends ActivePhase {
  phase: "quest";
  mission: Mission;
  trials: { [agent: string]: boolean };
}

interface RedemptionPhase extends Closed {
  phase: "redemption";
}

interface FinishedPhase extends Closed {
  phase: "finished";
  winner: Team;
}

export type Phase = NewPhase | StartedPhase | ProposingPhase | VotingPhase | QuestPhase | RedemptionPhase | FinishedPhase;

export function proposer(x: ProposingPhase | VotingPhase | QuestPhase): Agent {
  return x.players[x.turn % x.players.length];
}

export function missionSize(x: ProposingPhase | VotingPhase | QuestPhase): number {
  switch (x.players.length) {
    case 5: return [2, 3, 2, 3, 3][x.round];
    case 6: return [2, 3, 4, 3, 4][x.round];
    case 7: return [2, 3, 3, 4, 4][x.round];
    case 8: return [3, 4, 4, 5, 5][x.round];
    case 9: return [3, 4, 4, 5, 5][x.round];
    case 10: return [3, 4, 4, 5, 5][x.round];
  }
}

type VotingOutcome = "accepted" | "rejected";

function votingOutcome(g: VotingPhase, e: Vote): VotingOutcome | undefined {
  const nPlayers = g.players.length;
  const nVotes = Object.keys(g.votes).length;
  const alreadyVoted = g.votes.hasOwnProperty(e.agent);

  // If this wouldn't be the last vote anyway, then there is no outcome.
  if (alreadyVoted || nVotes !== nPlayers - 1) return undefined;

  // Count the nunmber of accepts and rejects to determine the outcome.
  const votes = Object.values(g.votes);
  const accepts = votes.filter(x => !!x).length + (+e.vote);
  const rejects = votes.length - accepts + 1;
  return accepts > rejects ? "accepted" : "rejected";
}

type QuestOutcome = "passed" | "failed";

function questOutcome(x: QuestPhase, e: Trial): QuestOutcome | undefined {
  const nPlayers = x.mission.length;
  const nVotes = Object.keys(x.trials).length;
  const alreadyVoted = x.trials.hasOwnProperty(e.agent);

  // If this wouldn't be the last vote anyway, then there is no outcome.
  if (alreadyVoted || nVotes !== nPlayers - 1) return undefined;

  // Count the nunmber of fails to determine the outcome.
  const trials = Object.values(x.trials);
  const fails = trials.filter(x => !x).length + (+!e.trial);

  // The 4th quest (index 3) in games of 7 or more players requires at least 2
  // fails to be failed.
  const needed = (x.players.length >= 7 && x.round === 3) ? 2 : 1;
  return fails < needed ? "passed" : "failed";
}

export function eventValid(x: Phase, e: Event): boolean {
  switch (x.phase) {
    case "new":
      switch (e.type) {
        case "join-game":
          return !x.players.includes(e.agent);
        case "start-game":
          return x.players.includes(e.agent) &&
            x.players.length >= 5 &&
            x.players.length <= 10;
      }
      return false;
    case "started":
      switch (e.type) {
        case "assign-role":
          // TODO: Allow other gods.
          return e.agent === "00000000";
        case "finish-assigning-roles":
          // TODO: Allow other gods.
          return e.agent === "00000000";
      }
      return false;
    case "proposing":
      switch (e.type) {
        case "propose-mission":
          return e.agent === proposer(x) &&
            e.mission.length === missionSize(x) &&
            e.mission.filter(p => !x.players.includes(p)).length === 0;
      }
      return false;
    case "voting":
      switch (e.type) {
        case "vote":
          return x.players.includes(e.agent);
      }
      return false;
    case "quest":
      switch (e.type) {
        case "trial":
          return x.mission.includes(e.agent);
      }
      return false;
    case "redemption":
      return false;
    case "finished":
      return false;
  }
}

export function phaseMachine(x: Phase, e: Event): Phase {
  if (!eventValid(x, e)) return x;
  switch (x.phase) {
    case "new":
      switch (e.type) {
        case "join-game":
          return { phase: "new", players: [...x.players, e.agent]}
        case "start-game":
          return { phase: "started", players: x.players as Players, roles: {} };
      }
      return x;
    case "started":
      switch (e.type) {
        case "assign-role":
          return {
            phase: x.phase,
            players: x.players,
            roles: { ...x.roles, [e.assignee]: e.role },
          };
        case "finish-assigning-roles":
          return {
            phase: "proposing",
            players: x.players,
            roles: x.roles,
            round: 0,
            turn: 0,
            consecutiveRejects: 0,
            knightsScore: 0,
            minionsScore: 0,
          };
      }
      return x;
    case "proposing":
      switch (e.type) {
        case "propose-mission":
          return {
            phase: "voting",
            players: x.players,
            roles: x.roles,
            round: x.round,
            turn: x.turn,
            consecutiveRejects: x.consecutiveRejects,
            knightsScore: x.knightsScore,
            minionsScore: x.minionsScore,
            mission: e.mission as Mission,
            votes: {},
          };
      }
      return x;
    case "voting":
      switch (e.type) {
        case "vote":
          const outcome = votingOutcome(x, e);
          if (outcome === "accepted") {
            return {
              phase: "quest",
              players: x.players,
              roles: x.roles,
              round: x.round,
              turn: x.turn,
              consecutiveRejects: 0,
              knightsScore: x.knightsScore,
              minionsScore: x.minionsScore,
              mission: x.mission,
              trials: {},
            };
          } else if (outcome === "rejected") {
            return {
              phase: "proposing",
              players: x.players,
              roles: x.roles,
              round: x.round,
              turn: x.turn + 1,
              consecutiveRejects: x.consecutiveRejects + 1,
              knightsScore: x.knightsScore,
              minionsScore: x.minionsScore,
            };
          }
          return { ...x, votes: { ...x.votes, [e.agent]: e.vote } };
      }
      return x;
    case "quest":
      switch (e.type) {
        case "trial":
          const outcome = questOutcome(x, e);
          if (outcome === "passed") {
            return {
              phase: "proposing",
              players: x.players,
              roles: x.roles,
              round: x.round + 1,
              turn: x.turn + 1,
              consecutiveRejects: x.consecutiveRejects,
              knightsScore: x.knightsScore + 1,
              minionsScore: x.minionsScore,
            };
          } else if (outcome === "failed") {
            return {
              phase: "proposing",
              players: x.players,
              roles: x.roles,
              round: x.round + 1,
              turn: x.turn + 1,
              consecutiveRejects: x.consecutiveRejects,
              knightsScore: x.knightsScore,
              minionsScore: x.minionsScore + 1,
            };
          }
          return { ...x, trials: { ...x.trials, [e.agent]: e.trial } };
      }
      return x;
    case "redemption":
      return x;
    case "finished":
      return x;
  }
}

export function gamePhase(g: GameHistory): Phase {
  return g.reduce(phaseMachine, { phase: "new", players: [] });
}
