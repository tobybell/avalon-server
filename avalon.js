require('./util')

// Module: Avalon
// --------------
// Provides a model for a game of Avalon.

const MAX_PLAYERS = 16
const MAX_PLAYER_ID = 65536
const PUBLIC_EVENTS = ['creation', 'join', 'start', 'round', 'turn', 'proposal',
                       'outcome', 'effect', 'close']
const PRIVATE_EVENTS = ['vote', 'action']
const EVENTS = PUBLIC_EVENTS.concat(PRIVATE_EVENTS)
const KNIGHT_SPECIALS = ['merlin', 'percival']
const MINION_SPECIALS = ['morgana', 'mordred', 'oberon']
const MISSION_SIZES = [3, 3, 4, 4, 5, 5]
const MISSION_FAILS = [1, 1, 1, 2, 1]

class Avalon {

    // Create a new game of Avalon.
    // config: Object   The configuration properties for the game.
    constructor(config) {
        this.history = []
        this.players = []
        this.config = undefined
        this.started = false
        this.score = { knights: 0, minions: 0 }
        this.round = 0
        this.turn = undefined

        // The meat. Push the creation event.
        this.history.push(new CreationEvent(config))
        this.update()
    }

    historyFor(player) {
        const sanitizedHistory = []
        for (let i = 0; i < this.history.length; i += 1) {
            const e = this.history[i]
            if (PUBLIC_EVENTS.includes(e.type))
                sanitizedHistory.push(e)
            if (PRIVATE_EVENTS.includes(e.type) && e.player == player.name)
                sanitizedHistory.push(e)
        }
        return sanitizedHistory
    }

    player(p) {
        if (typeof p == 'string' || p instanceof String)
            for (let i = 0; i < this.players.length; i += 1)
                if (this.players[i].name == p)
                    return this.players[i]
        if (typeof p == 'number' || p instanceof Number)
            return this.players[p]
    }

    get config() {
        for (let i = 0; i < this.history.length; i += 1)
            if (this.history[i] instanceof CreationEvent)
                return this.history[i].config
    }

    get started() {
        for (let i = 0; i < this.history.length; i += 1)
            if (this.history[i] instanceof StartEvent)
                return true
        return false
    }

    get players() {
        const ps = []
        for (let i = 0; i < this.history.length; i += 1)
            if (this.history[i] instanceof JoinEvent)
                ps.push(this.history[i].player)
            else if (this.history[i] instanceof StartEvent)
                break
        return ps
    }

    get round() {
        for (let i = this.history.length - 1; i >= 0; i -= 1)
            if (this.history[i] instanceof RoundEvent)
                return this.history[i].number
        return 0
    }

    get turn() {
        const e = this.history[this.history.length - 1]
        if (e instanceof TurnEvent) return e.player
    }

    get score() {
        return {
            knights: this.history.count(e => e instanceof PassEvent),
            minions: this.history.count(e => e instanceof FailEvent)
        }
    }

    get recentVotes() {
        const votes = []
        for (let i = this.history.length - 1; i >= 0; i -= 1)
            if (!(this.history[i] instanceof VoteEvent)) break
            else votes.push(this.history[i])
        return votes
    }

    get recentActions() {
        const actions = []
        for (let i = this.history.length - 1; i >= 0; i -= 1)
            if (!(this.history[i] instanceof ActionEvent)) break
            else actions.push(this.history[i])
        return actions
    }

    // General update checks. Called at the end of many user-invoked actions to
    // carry out automated game logic.
    update() {
        const last = this.history[this.history.length - 1]

        if (last instanceof CreationEvent)
            this.config = last.config

        if (last instanceof JoinEvent)
            this.players.push(last.player)

        if (last instanceof StartEvent)
            this.started = true

        if (last instanceof RoundEvent)
            this.round = last.number

        if (last instanceof TurnEvent)
            this.turn = last.player
        else
            this.turn = undefined

        if (last instanceof ProposalEvent)
            this.mission = new Mission(last.players)

        if (last instanceof VoteEvent)
            this.mission.votes[last.value].push(last.player)

        if (last instanceof RejectionEvent)
            this.mission = undefined

        if (last instanceof ActionEvent)
            this.mission[last.value]()

        if (last instanceof PassEvent) {
            this.mission = undefined
            this.score.knights += 1
        }

        if (last instanceof FailEvent) {
            this.mission = undefined
            this.score.minions += 1
        }

        // If all players have joined, start the game.
        if (players.length == needed && !this.started) {
            this.start()
            this.nextRound()
            this.nextTurn()
        }

        // If the game has just started, or if a mission has completed, advance
        // to the next round.
        else if (last instanceof PassEvent || last instanceof FailEvent) {
            this.nextRound()
            this.nextTurn()
        }

        // If a mission has been rejected, go to the next player's turn, without
        // advancing the round.
        else if (last instanceof RejectionEvent) {
            this.nextRound()
            this.nextTurn()
        }

        // If all players have voted, generate an outcome event.
        else if (recentVotes.length >= players.length) {
            const yes = recentVotes.count(v => v.yes)
            const no = recentVotes.count(v => v.no)
            if (yes > no)
                this.history.push(new ApprovalEvent(recentVotes))
            else
                this.history.push(new RejectionEvent(recentVotes))
            update()
        }

        // If all players on the current mission have acted, generate the
        // pass/fail effect.
        else if (recentActions.length >= MISSION_SIZES[this.round]) {
            const pass = recentActions.count(a => a.pass)
            const fail = recentActions.count(a => a.fail)
            if (fail >= MISSION_FAILS[this.round])
                this.history.push(new PassEvent(recentActions))
            else
                this.history.push(new FailEvent(recentActions))
            update()
        }

        // If the score has reached 3, win the game.
        else if (score.knights >= 3 || score.minions >= 3) {
            this.history.push(new CloseEvent(score))
        }
    }

    // Add a new player to the game.
    // Will return void on success, and an error string on failure.
    // player: String   name of the player to add.
    join(name) {

        // Bail if the game is full.
        if (this.started)
            throw new Error('The game has already started.')

        // Bail if the player already exists.
        if (this.exists(player))
            throw new Error('There is already a player with that name.')

        // The meat. Add the player record and perform automatic updates.
        this.history.push(new JoinEvent(player))
        this.update()

        // Transition: if all players have joined, start the game.
        const needed = this.config.knights + this.config.minions
        if (this.players.length == needed && !this.started) {
            this.start()
            this.nextRound()
            this.nextTurn()
        }
    }

    start() {

        // Simple. The meat. Push the role assignments and start event. Then
        // perform automatic updates.
        this.history.push(new RolesEvent(this.players, this.config))
        this.history.push(new StartEvent())
        this.update()
    }

    // Propose a new mission.
    // name: String     name of the player proposing the mission
    // members: Array   names of members of the mission
    propose(player, members) {

        // Bail if the player does not exist.
        if (!this.exists(player))
            throw new Error('You\'re not a real player.')

        // Bail if it's not their turn.
        if (player != this.turn)
            throw new Error('It\'s not your turn.')

        // Bail if there are the wrong number of mission members.
        const size = MISSION_SIZES[this.round]
        if (members.length != size)
            throw new Error('The mission must have ' + size + ' members.')

        // Bail if any mission members don't exist.
        const players = this.players
        for (let i = 0; i < members.length; i += 1)
            if (!players.includes(members[i]))
                throw new Error(members[i] + ' isn\t a real player.')

        // The meat. Push the new proposal event and perform automatic updates.
        this.history.push(new ProposalEvent(members))
        this.update()
    }

    // Vote on the current mission.
    // player: String   name of the player voting on the mission
    // v: String        their vote, either "yes" or "no"
    vote(player, vote) {

        // Bail if the player does not exist.
        if (!this.exists(player))
            throw new Error('You\'re not a real player.')

        // Bail if the player has already voted.
        const recentVotes = this.recentVotes
        if (recentVotes.count(v => v.player == player) > 0)
            throw new Error('You already voted.')

        // The meat. Push a new vote event and perform automatic updates.
        this.history.push(new VoteEvent(name, vote))
        this.update()
    }

    // Submit a performance/action for the current mission.
    // player: String   name of the player acting on the mission
    // a: String        their action, either "pass" or "fail"
    action(player, action) {

        // Bail if the player does not exist.
        if (!this.exists(player))
            throw new Error('You\'re not a real player.')

        // Bail if the player has already acted.
        const recentActions = this.recentActions
        if (recentActions.count(a => a.player == player) > 0)
            throw new Error('You already acted on this mission.')

        // The meat. Push a new vote event and perform automatic updates.
        this.history.push(new ActionEvent(name, action))
        this.update()
    }

    nextRound() {
        this.history.push(new RoundEvent(this.round + 1))
    }

    nextTurn() {
        const turn = Math.floor(Math.random() * this.players.length)
        for (let i = this.history.length - 1; i >= 0; i -= 1)
            if (this.history[i] instanceof TurnEvent)
                turn = this.history[i].number

        const next = (turn + 1) % this.players.length
        this.history.push(new TurnEvent(next, this.players[next]))
    }
}

class Player {

    constructor(game, name) {
        this.game = game
        this.name = name
        this.role = []
    }

    propose(members) {
        this.game.propose(this, members)
    }

    vote(value) {
        this.game.vote(this, value)
    }

    action(value) {
        this.game.action(this, value)
    }
}

class AvalonEvent {
    constructor(type) {
        this.type = type
    }
}

class CreationEvent extends AvalonEvent {
    constructor(config) {
        super('creation')
        config.specials = config.specials.map(s => s.toLowerCase())
        config.specials = config.specials.filter(s => {
            return KNIGHT_SPECIALS.includes(s) || MINION_SPECIALS.includes(s)
        })
        this.config = config
    }
}

class JoinEvent extends AvalonEvent {
    constructor(player) {
        super('join')
        this.player = player
    }
}

class RolesEvent extends AvalonEvent {
    constructor(players, config) {
        super('roles')

        // Generate the available role pool. First, extract important
        // information from the config.
        const roles = []
        const {knights, minions, specials} = config
        const kSpecials = specials.filter(s => KNIGHT_SPECIALS.includes(s))
        const mSpecials = specials.filter(s => MINION_SPECIALS.includes(s))
        if (kSpecials.length > knights || mSpecials.length > minions)
            throw new Error('Bad player counts and special characters.')

        // As a base, we generate the correct number of knight and minion roles
        // for the pool.
        for (let i = 0; i < knights; i += 1) roles.push(['knight'])
        for (let i = 0; i < minions; i += 1) roles.push(['minion'])

        // Then, combine each special with an appropriate existing role, and
        // randomize the pool.
        for (let i = 0; i < kSpecials.length; i += 1)
            roles[i].push(kSpecials[i])
        for (let i = 0; i < mSpecials.length; i += 1)
            roles[knights + i].push(mSpecials[i])
        roles.shuffle()

        // Assign the roles.
        this.roles = []
        for (let i = 0; i < players.length; i += 1)
            this.roles.push({
                player: players[i],
                role: roles[i]
            })
    }
}

class StartEvent extends AvalonEvent {
    constructor() {
        super('start')
    }
}

class RoundEvent extends AvalonEvent {
    constructor(number) {
        super('round')
        this.number = number
    }
}

class TurnEvent extends AvalonEvent {
    constructor(number, player) {
        super('turn')
        this.number = number
        this.player = player
    }
}

class ProposalEvent extends AvalonEvent {
    constructor(players) {
        super('proposal')
        this.players = players
    }
}

class VoteEvent extends AvalonEvent {
    constructor(player, vote) {
        super('vote')
        this.player = player
        this.value = vote.toLowerCase().charAt(0) == 'y' ? 'yes' : 'no'
    }
    get yes() {
        return this.value == 'yes'
    }
    get no() {
        return this.value == 'no'
    }
}

class ApprovalEvent extends AvalonEvent {
    constructor(votes) {
        super('approval')
        this.votes = votes
    }
}

class RejectionEvent extends AvalonEvent {
    constructor(votes) {
        super('rejection')
        this.votes = votes
    }
}

class ActionEvent extends AvalonEvent {
    constructor(player, action) {
        super('action')
        this.player = player
        this.value = action.toLowerCase().charAt(0) == 'p' ? 'pass' : 'fail'
    }
    get pass() {
        return this.value == 'pass'
    }
    get fail() {
        return this.value == 'fail'
    }
}

class PassEvent extends AvalonEvent {
    constructor(actions) {
        super('pass')
        this.actions = actions
    }
}

class FailEvent extends AvalonEvent {
    constructor(actions) {
        super('fail')
        this.actions = actions
    }
}

class CloseEvent extends AvalonEvent {
    constructor(score) {
        this.score = score
        this.winner = score.knights > score.minions ? 'knights' : 'minions'
    }
}

module.exports = {
    Game: Avalon
}
