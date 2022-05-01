const express = require('express');
// const res = require('express/lib/response');
const logdb = require('./database');
const morgan = require('morgan');
const errorhandler = require('errorhandler');
const fs = require('fs');
// const { process_params } = require('express/lib/router');
const app = express();


// Require minimist module
const args = require('minimist')(process.argv.slice(2))
// See what is stored in the object produced by minimist
console.log(args)
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


app.use(express.json())
app.use(express.urlencoded({extended: true}))


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


const logging = (req, res, next) => {
    console.log(req.body.number);
}

sec_arg = process.argv.slice(2);
let sec_arg_num;
//
// if (sec_arg.toString().includes('=')) {
//     const index = sec_arg.toString().indexOf('=');
//     sec_arg_num = sec_arg.toString().substring(index+1);
// }
const port_from_sec_arg = parseInt(sec_arg_num);
if(port_from_sec_arg > 0 && port_from_sec_arg < 65536) {
    port = sec_arg_num;
} else {
    port = 5000;
}
if(args.port) {
    port = args.port;
}
// console.log(sec_arg + " is the second argument")
// console.log(port + " is the port")


// function coinFlip() {
//     return (Math.floor(Math.random() * 2) == 0) ? 'heads' : 'tails';
// }

// app.use(morgan('combined'))

// app.use(fs.writeFile('./access.log', data, {flag: 'a'}, (err, req, res, next) => {
//     if(err) {
//         console.error(err)
//     } else {
//         let data = app.use(morgan('combined'))
//         console.log(data)
//     }
// }));

// COME BACK TO THIS VVV ON THURSDAY
// let logging = morgan('combined')
// WHAT ARE WE SUPPOSED TO VVV PUT HERE?
// app.use(logging('common', ))

// app.get("/app/adddata", (req, res) => {
//     try {
//         const stmt = logdb.prepare('SELECT * FROM userinfo WHERE id = ?').get(req.params.id);
//         res.status(200).json(stmt);
//     } catch (e) {
//         // res.send(e);
//         console.error(e);
//     }
// });

app.get("/app/user/:id", (req, res) => {
    try {
        const stmt = logdb.prepare('SELECT * FROM userinfo WHERE id = ?').get(req.params.id);
        res.status(200).json(stmt);
    } catch (e) {
        // res.send(e);
        console.error(e);
    }
});

app.get("/app/users", (req, res) => {
    try {
       const stmt = logdb.prepare('SELECT * FROM userinfo').all();
       res.status(200).json(stmt);
    } catch (e) {
        // res.send(e);
        console.error(e);
    }
});

app.post("/app/new/:user", (req, res, next) => {
    let data = {
        user: req.body.username,
        pass: req.body.password
    };
    const stmt = logdb.prepare('INSERT INTO userinfo (username, password) VALUES (?, ?)');
    const info = stmt.run(data.user, data.pass);
    res.status(200).json();
});

app.delete("/app/delete/user/:id", (req, res) => {
    const stmt = logdb.prepare('DELETE FROM userinfo WHERE id = ?');
    const info = stmt.run(req.params.id);
    res.status(200).json(info);
})

app.patch("/app/update/user/:id", (req, res, next) => {
    let data = {
        user: req.body.username,
        pass: req.body.password
    };
    const stmt = logdb.prepare('UPDATE userinfo SER username = COALESCE(?,username), password = COALESCE(?,password) WHERE id = ?');
    const info = stmt.run(data.user, data.pass, req.params.id);
    res.status(200).json(info);
});

app.get('/app', (req, res) => {
    res.status(200).end("200 OK\n");
    res.type("text/plain");
})

app.get('/app/echo/:number', (req, res) => {
    res.status(200).json({'message': req.params.number});
})

app.get('/app/flip', (req, res) => {
    var flip = coinFlip();
    res.status(200).json({'flip': flip});
})

app.get('/app/flips/:number[0-9]{1,4}', (req, res) => {
    var flips = coinFlips();
    flipsObj = {}
    res.status(200).json({'flip': flip});
})

app.get('/app/flips/call/heads', (req, res) => {
    const game = flipACoin("heads")
    res.status(200).json(game)
})

app.get('/app/flips/call/tails', (req, res) => {
    const game = flipACoin("tails")
    res.status(200).json(game)
})

app.get('/app/flip/call/:guess(heads|tails)', (req, res) => {
    const game = flipACoin("tails")
    res.status(200).json(game)
})

app.get('/*', (req, res) => {
    res.status(400).end("404 Not Found")
    // res.statusCode = 404;
    // res.send("404 Not Found")
})

const server = app.listen(port, () => {
    console.log(`App is running on port ${port}`);
})

// app.use((req, res) => {
//     res.status(404).send("Endpoint does not exist 😞");
//     // res.type("text/plain");
// })