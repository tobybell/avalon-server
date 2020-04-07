import { Phase, StartedPhase, assignRole, GameHistory, gameStarted, Team, GameId, gamePlayers, rolesAssigned, Event, Role, finishAssigningRoles } from "./avalon";
import { shuffle } from "./util";
import { Agent } from "./agent";

export function handle(id: GameId, e: Event, state: Phase, dispatch: (e: Event) => void) {
  if (state.phase === "started" && e.type === "start-game") {
    assignRoles(id, state).forEach(dispatch);
    dispatch(finishAssigningRoles(id));
  }
}

function makeRoles(nKnights: number, nMinions: number): Role[] {
  const knights = Array(nKnights - 1).fill("knight");
  const minions = Array(nMinions - 1).fill("minion");
  return ["merlin", ...knights, "assassin", ...minions];
}

function getRoles(nPlayers: number) {
  switch (nPlayers) {
    case 5: return makeRoles(3, 2);
    case 6: return makeRoles(4, 2);
    case 7: return makeRoles(4, 3);
    case 8: return makeRoles(5, 3);
    case 9: return makeRoles(6, 3);
    case 10: return makeRoles(6, 4);
  }
  return [];
}

function assignRoles(id: GameId, state: StartedPhase) {
  const roles = getRoles(state.players.length);
  shuffle(roles);
  return roles.map((role, i) => assignRole(id, state.players[i], role));
}
