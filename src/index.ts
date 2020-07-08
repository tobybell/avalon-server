import * as express from "express";
import * as url from "url";
import * as WebSocket from "ws";
import * as cors from "cors";

const BodyParser = require("body-parser");
const Multipart = require("connect-multiparty");
const RandomString = require("randomstring");

// const Avalon = require("./avalon.js")

import * as config from "./config";
import * as avalon from "./avalon";
import * as autopilot from "./autopilot";

const app = express();

app.use(cors());

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
app.use(Multipart());

let state: avalon.AppState = { games: {} };

function dispatch(e: avalon.Event) {

  const gameId = e.game;

  const game = state.games[gameId] || [];
  
  // TODO: Validate all event schemas.
  const phase = avalon.gamePhase(game);
  if (!avalon.eventValid(phase, e)) {
    console.log("Dropping invalid event", e);
    return;
  }

  // Update list of games.
  const newGame = [...game, e];
  state = { ...state, games: { ...state.games, [e.game]: newGame } };

  for (const client of getClients(gameId)) {
    client.send(JSON.stringify(e));
  }

  // TODO: Abstract this into server autonomy.
  const newPhase = avalon.phaseMachine(phase, e);
  autopilot.handle(gameId, e, newPhase, dispatch);
}

const server = app.listen(config.port, () => {
  console.log(`Avalon server started on port ${config.port}.`)
});

// WebSocket server
const wss = new WebSocket.Server({ server });

const clients: { [game: string]: Set<WebSocket> } = {};

function addClient(ws: WebSocket, gameId: avalon.GameId) {
  const forGame = clients[gameId];
  if (forGame) {
    forGame.add(ws);
  } else {
    clients[gameId] = new Set([ws]);
  }
}

function removeClient(ws: WebSocket, gameId: avalon.GameId) {
  const forGame = clients[gameId];
  if (!forGame) return false;
  if (!forGame.delete(ws)) return false;
  if (forGame.size === 0) delete clients[gameId];
  return true;
}

function getClients(gameId: avalon.GameId) {
  return clients[gameId] || new Set();
}

function numClients(gameId: avalon.GameId) {
  const gameClients = clients[gameId];
  return gameClients ? gameClients.size : 0;
}

function sendGame(res: express.Response, id: avalon.GameId) {
  console.log(state);

  // TODO: Move gameHistory and reeducer out of avalon module.
  const game = avalon.gameHistory(state, id);
  if (game.length) {
    res.json(game);
  } else {
    console.log("Not found.");
    res.json([]);
  }
}

app.post("/", (req, res) => {
  res.json({ "test": 5 });
});

app.get("/games/:id", (req, res) => {
  console.log(`GET /games/${req.params["id"]}`);
  sendGame(res, req.params["id"]);
});

app.post("/games", (req, res) => {
  const e = req.body;

  console.log(`POST /games`, e);

  dispatch(e);

  res.sendStatus(200);
});

function getGameId(urly: string): avalon.GameId | undefined {
  const path = url.parse(urly).pathname || "";
  if (path.startsWith("/games/") && path.indexOf("/", 7) === -1) {
    return path.substr(7);
  }
}

wss.on("connection", (ws, req) => {
  const gameId = getGameId(req.url || "");
  if (gameId == null) {
    ws.close();
    return;
  }

  addClient(ws, gameId);
  console.log(`Someone connected to ${gameId}. Size now ${numClients(gameId)}.`);

  ws.on("message", (message: string) => {
    //log the received message and send it back to the client
    console.log(`Received in ${gameId}: ${message}`);
    ws.send(`Hello, you sent -> ${message}`);
  });

  ws.on("close", () => {
    removeClient(ws, gameId);
    console.log(`Someone disconnected from ${gameId}. Size now ${numClients(gameId)}.`);
  });

  //send immediatly a feedback to the incoming connection
  ws.send("Hi there, I am a WebSocket server");

  // Send all previous events.
  const game = avalon.gameHistory(state, gameId);
  ws.send(JSON.stringify(game));
});
