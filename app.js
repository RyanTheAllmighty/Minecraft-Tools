/*
 * Minecraft Tools - https://github.com/RyanTheAllmighty/Minecraft-Tools
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

var r = require('rethinkdb');

var mojang = require('mojang-api');

var env = require('node-env-file');
env(__dirname + '/.env');

var app = express();
app.use(bodyParser.json());
app.use('/', require('./routes'));

var validators = require('./validators');

if (process.env.ENABLE_SENTRY) {
    var raven = require('raven');

    var client = new raven.Client(process.env.SENTRY_DSN);
}

r.connect({
    host: process.env.RETHINKDB_HOST,
    port: process.env.RETHINKDB_PORT
}, function (err, conn) {
    if (err) {
        if (process.env.ENABLE_SENTRY) {
            client.captureError(err)
        } else {
            console.error(err);
        }

        return;
    }

    r.dbCreate('minecraft_tools').run(conn, function (err) {
        if (err) {
            console.log('minecraft_tools database already exists, no need to create it!');
        } else {
            console.log('Created the minecraft_tools database!');
        }
    });
    r.db('minecraft_tools').tableCreate('uuid').run(conn, function (err) {
        if (err) {
            console.log('uuid table already exists, no need to create it!');
        } else {
            console.log('Created the uuid table!');
        }
    });

    startServer();

    conn.close();
});

app.use(function (req, res, next) {
    if (req.body.auth != process.env.AUTH_KEY) {
        var err = new Error('Invalid auth provided!');

        if (process.env.ENABLE_SENTRY) {
            client.captureError(err, {extra: {body: res.body}});
        } else {
            console.error(err);
        }

        return res.status(400).send('Invalid auth provided!');
    }

    next();
});

app.use(function (req, res, next) {
    r.connect({
        host: process.env.RETHINKDB_HOST,
        port: process.env.RETHINKDB_PORT,
        db: process.env.RETHINKDB_DB
    }).then(function (conn) {
        req._rdb = conn;
        next();
    }).error(function (res) {
        return res.status(400).send('Couldn\'t connect to the database!');
    });
});

app.route('/query').post(function (req, res) {
    if (!validators.queryValidator(req.body)) {
        var err = new Error('Invalid JSON provided!');

        if (process.env.ENABLE_SENTRY) {
            client.captureError(err, {extra: {body: res.body}});
        } else {
            console.error(err);
        }

        return res.status(400).send('Invalid JSON provided!');
    }

    dns.resolveSrv('_minecraft._tcp.' + req.body.host, function (err, data) {
        var originalHost = req.body.host;
        var originalPort = req.body.port;

        if (data && data[0] && data[0].port) {
            if (data[0].name) {
                req.body.host = data[0].name;
            }

            req.body.port = data[0].port;
        }

        var startTime = Date.now();

        ping(req.body.host, req.body.port, function (err, data) {
            if (err) {
                if (process.env.ENABLE_SENTRY) {
                    client.captureError(err)
                } else {
                    console.error(err);
                }

                return res.status(200).send({
                    id: req.body.id,
                    host: originalHost,
                    port: originalPort,
                    online: false,
                    time_taken: Date.now() - startTime,
                    reason: err.message
                });
            } else {
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

app.route('/vote').post(function (req, res) {
    if (!validators.voteValidator(req.body)) {
        var err = new Error('Invalid JSON provided!');

        if (process.env.ENABLE_SENTRY) {
            client.captureError(err, {extra: {body: res.body}});
        } else {
            console.error(err);
        }
    }

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
            if (process.env.ENABLE_SENTRY) {
                client.captureError(err)
            } else {
                console.error(err);
            }
        }

        return res.status(200).send({
            sent: !err
        });
    });
});

app.route('/uuid/to').post(function (req, res) {
    if (!validators.uuidValidator.to(req.body)) {
        var err = new Error('Invalid JSON provided!');

        if (process.env.ENABLE_SENTRY) {
            client.captureError(err, {extra: {body: res.body}});
        } else {
            console.error(err);
        }

        return res.status(400).send('Invalid JSON provided!');
    }

    r.table('uuid').filter({username: req.body.username}).run(req._rdb, function (err, cursor) {
        if (err) {
            if (process.env.ENABLE_SENTRY) {
                client.captureError(err)
            } else {
                console.error(err);
            }

            return res.status(400).send('Error retrieving results from the database!');
        }

        cursor.next(function (err, row) {
            if (err) {
                mojang.nameToUuid(req.body.username, function (err, data) {
                    if (err) {
                        if (process.env.ENABLE_SENTRY) {
                            client.captureError(err)
                        } else {
                            console.error(err);
                        }

                        return res.status(400).send('Couldn\'t get UUID for username!');
                    }

                    if (data.length == 0) {
                        return res.status(200).send({
                            uuid: null,
                            fetched: true
                        });
                    }

                    r.table('uuid').insert({
                        uuid: data[0].id,
                        username: req.body.username
                    }).run(req._rdb);

                    return res.status(200).send({
                        uuid: data[0].id,
                        fetched: true
                    });
                });
            } else {
                return res.status(200).send({
                    uuid: row.uuid,
                    fetched: false
                });
            }
        });
    });
});

app.use(function (req, res, next) {
    req._rdb.close();
    next();
});

var startServer = function () {
    var server = app.listen(process.env.SERVER_PORT, function () {
        var host = server.address().address;
        var port = server.address().port;

        console.log('Listening at http://%s:%s', host, port);
    });
};