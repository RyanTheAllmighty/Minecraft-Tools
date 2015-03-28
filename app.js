/*
 * Minecraft Server Tools - https://github.com/RyanTheAllmighty/Minecraft-Server-Tools
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

var validators = require('./validators');

app.use(function (req, res, next) {
    if (req.body.auth != process.env.AUTH_KEY) {
        return res.status(400).send('Invalid auth provided!');
    }

    next();
});

app.post('/query', function (req, res) {
    if (!validators.queryValidator(req.body)) {
        return res.status(400).send('Invalid JSON provided!');
    }

    console.log('Querying server ' + req.body.host + ":" + req.body.port);

    dns.resolveSrv('_minecraft._tcp.' + req.body.host, function (err, data) {
        var originalHost = req.body.host;
        var originalPort = req.body.port;

        if (data && data[0] && data[0].port) {
            console.log('The server has an SRV record for port ' + data[0].port + '!');

            if (data[0].name) {
                console.log('The server also has an SRV record for host ' + data[0].name + '!');
                req.body.host = data[0].name;
            }

            req.body.port = data[0].port;
        }

        var startTime = Date.now();

        ping(req.body.host, req.body.port, function (err, data) {
            if (err) {
                console.error(err);
                return res.status(200).send({
                    id: req.body.id,
                    host: originalHost,
                    port: originalPort,
                    online: false,
                    time_taken: Date.now() - startTime,
                    reason: err.message
                });
            } else {
                console.log(data);
                return res.status(200).send({
                    id: req.body.id,
                    host: originalHost,
                    port: originalPort,
                    online: true,
                    time_taken: Date.now() - startTime,
                    motd: data.server_name,
                    players: {
                        online: parseInt(data.num_players),
                        max: parseInt(data.max_players)
                    }
                });
            }
        }, req.body.timeout);
    });
});

app.post('/vote', function (req, res) {
    if (!validators.voteValidator(req.body)) {
        return res.status(400).send('Invalid JSON provided!');
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