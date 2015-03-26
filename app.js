/*
 * Minecraft Server Checker - https://github.com/RyanTheAllmighty/Minecraft-Server-Checker
 * Copyright (C) 2015 RyanTheAllmighty
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

var express = require('express');
var bodyParser = require('body-parser');

var dns = require('dns');

var ping = require('mc-ping');
var votifier = require('votifier-send');

var env = require('node-env-file');
env(__dirname + '/.env');

var app = express();
app.use(bodyParser.json());

app.post('/query', function (req, res) {
    if (!req.body || !req.body.host || !req.body.port || !req.body.id || !req.body.auth) {
        return res.status(400).send('Invalid JSON provided!');
    }

    if (req.body.auth != process.env.AUTH_KEY) {
        return res.status(400).send('Invalid auth provided!');
    }

    if (typeof req.body.id !== "number" || req.body.id < 0) {
        return res.status(400).send('Invalid id provided!');
    }

    if (typeof req.body.port !== "number" || req.body.port < 0 || req.body.port > 65535) {
        return res.status(400).send('Invalid port provided!');
    }

    if (typeof req.body.timeout == "undefined" || typeof req.body.timeout !== "number") {
        req.body.timeout = 3000;
    }

    console.log('Querying server ' + req.body.host + ":" + req.body.port);

    dns.resolveSrv('_minecraft._tcp.' + req.body.host, function (err, data) {
        var originalPort = req.body.port;

        if (data && data[0] && data[0].port) {
            console.log('The server has an SRV record for port ' + data[0].port + '!');
            req.body.port = data[0].port;
        }

        var startTime = Date.now();

        ping(req.body.host, req.body.port, function (err, data) {
            if (err) {
                console.error(err);
                return res.status(200).send({
                    id: req.body.id,
                    host: req.body.host,
                    port: originalPort,
                    online: false,
                    time_taken: Date.now() - startTime,
                    reason: err.message
                });
            } else {
                console.log(data);
                return res.status(200).send({
                    id: req.body.id,
                    host: req.body.host,
                    port: originalPort,
                    online: true,
                    time_taken: Date.now() - startTime,
                    motd: data.server_name,
                    players: {
                        online: data.num_players,
                        max: data.max_players
                    }
                });
            }
        }, req.body.timeout);
    });
});

app.post('/vote', function (req, res) {
    if (!req.body || !req.body.host || !req.body.port || !req.body.id || !req.body.key || !req.body.username || !req.body.ip || !req.body.site || !req.body.auth) {
        return res.status(400).send('Invalid JSON provided!');
    }

    if (req.body.auth != process.env.AUTH_KEY) {
        return res.status(400).send('Invalid auth provided!');
    }

    if (typeof req.body.id !== "number" || req.body.id < 0) {
        return res.status(400).send('Invalid id provided!');
    }

    if (typeof req.body.port !== "number" || req.body.port < 0 || req.body.port > 65535) {
        return res.status(400).send('Invalid port provided!');
    }

    console.log('Sending votifier vote for ' + req.body.username + ' to ' + req.body.host + ":" + req.body.port);

    votifier.send({
        key: req.body.key,
        host: req.body.host,
        port: req.body.port,
        data: {
            user: req.body.username,
            site: req.body.site,
            addr: req.body.ip
        }
    }, function (err) {
        if (err) {
            console.error(err);
        }

        return res.status(200).send({
            sent: !err
        });
    });
});

var server = app.listen(process.env.SERVER_PORT, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Listening at http://%s:%s', host, port);
});