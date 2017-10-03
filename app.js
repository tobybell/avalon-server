const Express = require('express')
const BodyParser = require('body-parser')
const Multipart = require('connect-multiparty')()
const RandomString = require('randomstring')
const Avalon = require('./avalon.js')

const config = require('./config.js')
const app = Express()

app.use(BodyParser.json())
app.use(BodyParser.urlencoded({ extended: true }))
app.use(Multipart)

// Persistent store of games. If the server restarts, hopefully it won't be
// during a game!
const games = {}

// Make sending error messages more consise by adding a .error() function to the
// response object. The .success function simply adds the extra
// { success: true } property to the returned object.
app.use((req, res, next) => {
    res.error = (message) => {
        res.send({
            success: false,
            error: message
        })
    }
    res.success = (data) => {
        data.success = true
        res.send(data)
    }
    next()
})

// Automatically look up the given game for all game-specific requests, and
// error if we can't. Also ensures that the playerID matches with a player
// in the game.
app.use('/games/:gameID', (req, res, next) => {
    const {gameID} = req.params
    const playerName = req.body.playerName

    // Find the game with the given game ID.
    const game = games[gameID]
    if (!game) return res.error('The requested game does not exist.')
    req.game = game

    // If a player ID was provided, find its match.
    if (!playerName) return res.error('You must provide a player name.')
    const player = req.game.players.find(p => p.name = playerName)
    if (!player) return res.error('You are not a player in this game.')
    req.player = player

    next()
})

// GET requests on the index path should simply return the web app. This
// is the single web page used to interact with the server (all other
// functionality is based on AJAX).
app.get('/', function (req, res) {
    res.send('Hello World!')
})

app.post('/', (req, res) => {
    console.log(req.body)
    res.send('Hey!')
})

// Create a new game. This will send back the ID of the created game.
app.post('/games', (req, res) => {

    // First, let's set up the configuration.
    const numKnights = req.body.knights
    const numMinions = req.body.minions
    let specialCharacters = req.body.specials

    if (!numKnights || !numMinions)
        return res.error('Invalid number of knights or minions.')

    const config = {
        kinghts: numKnights,
        minions: numMinions,
        specials: specialCharacters
    }

    const game = new Avalon.Game(config)

    // Repeatedly generate a random game ID until we find one that's free.
    let gameID
    do {
        gameID = RandomString.generate({
            length: 6,
            capitalization: 'uppercase'
        })
    } while (games[gameID])

    res.success({
        game: {
            ID: gameID,
            config: config
        }
    })

    const g = games.update({ ID: gameID },
        {
            ID: gameID,
            players: [],
            status: {
                score: {
                    minions: 0,
                    knights: 0
                },
                state: 'open'
            }
        },
        { upsert: true },
        (err, game) => {
            if (err || !game)
                return res.error('Avalon was unable to create a new game.')
            res.success({game: {ID: gameID}})
        }
    )
})

// Join a game. The client provides a playerName ("Noah", "Alistair"), and
// the server will send back a unique playerID number for that player within
// the game.
app.post('/games/:gameID', (req, res) => {
    const {game} = req
    const {playerName} = req.body

    if (playerName == null)
        return res.error('A player name is required.')

    // Make sure the player doesn't already exist.
    if (game.players.find(p => p.name == playerName))
        return res.error('A player with that name already exists.')

    // Update the game, adding the new player.
    const player = {
        ID: RandomString.generate(16),
        name: playerName
    }
    game.players.push(player)
    games.update({ ID: gameID }, game, (err) => {
        if (err) return res.send('Unable to join game.')
        res.success({player: player})
    })
})

// "Get" a game. This is only available to players. It returns basic
// information about all players, as well as priviledged information about
// the querying player, and some priviledged information about other
// players, depending on the querying player's role.
app.get('/games/:gameID', (req, res) => {
    const {game, player} = req
})

// Start listening.
app.listen(config.port, () => {
    console.log('Avalon server started on port ' + config.port + '.')
})
