// Place your server entry point code here
// 🌟 importing packages:
// express for API
const express = require('express');
// morgan for logging
const morgan = require('morgan');
// fs for managing file paths
const fs = require('fs');
// define args to use process.argv, requires minimist
const args = require('minimist')(process.argv.slice(2))
// require database
const logdb = require("./src/services/database");

// 🌟 other server config
// define app to use express
const app = express();
// Serve static HTML files
app.use(express.static('./public'));
// Make Express use its own built-in body parser to handle JSON
app.use(express.json());
// use express parser to handle url encoded data
app.use(express.urlencoded({extended: true}))

// 🌟 initialize useful things
// Store help text
const help = (`
server.js [options]

--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.

--debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws
            an error with the message "Error test successful." Defaults to
            false.

--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.

--help	Return this message and exit.
`)
// If --help or -h, echo help text to STDOUT and exit
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}

// 🌟 middleware
// logging middleware for getting information about each request
app.use((req, res, next) => {
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referer: req.headers['referer'],
        useragent: req.headers['user-agent']
    }
    // console.log(logdata);
    const stmt = logdb.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referer, logdata.useragent)
    next();})

// 🌟 debug routes/endpoints
if(args.debug) {
    app.get('/app/log/access', (req, res) => {
        const stmt = logdb.prepare('SELECT * FROM accesslog').all()
        res.status(200).json(stmt)
    });

    app.get('/app/error', (req, res) => {
        throw new Error('Error test successful.') // Express will catch this on its own.
    });

    if (args.log) {
        const WRITESTREAM = fs.createWriteStream('access.log', { flags: 'a'})
        app.use(morgan('combined', {stream: WRITESTREAM}))
    }
}

// 🌟 get the port
if(args.port) {
    port = args.port;
} else {
    port = 3000;
}

// ENDPOINTS:
// what is needed:

// A web interface with: // a landing page <div> //     an explanation of the game and basic instructions
// a navigation of some kind using buttons that will highlight the active <div> and hide others
// a flip-many-coins <div>
//     a button that makes an API call to /app/flip/ and then presents the resulting data to the person using the interface
//     a graphical representation of the resulting coin flips
//     summary information
// a guess-flip <div>
//     Two buttons that make an API call to /app/flip/call and then present the resulting data to the person using the interface
//     a graphical representation of the guess, and the actual result of the coin flip
//     win or loss
// Document the API endpoints listed in README.md based on how they actually behave (for those that exist) and how they should behave (for those yet to be implemented).
// This is an exercise in planning and scoping as much as anything else.
// Think about the information that YOU would want or need to work with this app and put it in the README.md
// Package structure
// Modularize parts of your package and put them into different subdirectories. You have been provided with a basic structure to do this.
// Put public web files in ./public/
// Place your database script file in ./src/services/
// Write any log files into `./log/
// Store any database files in ./data/
// Consider other ways to move code out of index.js and into other parts of the package structure.
// Be sure to adjust the paths you are using to create files and call dependencies.

//modify this to my needs
app.post('/app/flip/coins/', (req, res, next) => {
    const flips = coinFlips(req.body.number)
    const count = countFlips(flips)
    res.status(200).json({"raw":flips,"summary":count})
})
//modify this to my needs
app.post('/app/flip/call/', (req, res, next) => {
    const game = flipACoin(req.body.guess)
    res.status(200).json(game)
})
// a flip-one-coin <div>
//     a button that makes an API call to /app/flip/ and then presents the resulting data to the person using the interface
//     a graphical representation of the resulting coin flip
app.get('/app/flip/', (req, res, next) => {
    const flip = coinFlip()
    // const count = countFlips(flips)
    res.status(200).json({"raw":flip,"summary":count})
});
//modify this to my needs
app.get('/app/flips/:number', (req, res, next) => {
    const flips = coinFlips(req.params.number)
    const count = countFlips(flips)
    res.status(200).json({"raw":flips,"summary":count})
});
//modify this to my needs
app.get('/app/flip/call/:guess(heads|tails)/', (req, res, next) => {
    const game = flipACoin(req.params.guess)
    res.status(200).json(game)
})

// GET / => landing page with basic instructions
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// GET /app/flip => return json of flip
app.get('/app/flip', (req, res) => {
    res.send('Hello World!');
});

// GET /app/flip/call => return json of flip with call
app.get('/app/flip/call', (req, res) => {
    res.send('Hello World!');
});

// 🌟 start server
const server = app.listen(port, () => {
    console.log(`App is running on port ${port}`);
})

// 🌟 bad requests
// app.get('/*', (req, res) => {
//     res.status(400).end("404 Not Found")
// })

// 🌟 bad requests
app.use((req, res) => {
    res.status(404).send("Endpoint does not exist 😞");
})