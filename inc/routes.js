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
var router = express.Router();
var validators = require('./validators');
var functions = require('./functions');
var dns = require('dns');
var ping = require('mc-ping');
var votifier = require('votifier-send');
var altping = require('./altping');
var mojang = require('mojang-api');
var r = require('rethinkdbdash')();

if (process.env.ENABLE_SENTRY === 'true') {
    var raven = require('raven');

    var client = new raven.Client(process.env.SENTRY_DSN);
}

router.route('/query').post(function (req, res) {
    if (!validators.queryValidator(req.body)) {
        var err = new Error('Invalid JSON provided!');

        if (process.env.ENABLE_SENTRY === 'true') {
            client.captureError(err, {extra: {body: res.body}});
        } else {
            console.error(err);
        }

        return res.status(400).send('Invalid JSON provided!');
    }

    dns.resolveSrv('_minecraft._tcp.' + req.body.host, function (err, data) {
        if (!err) {
            var originalHost = req.body.host;
            var originalPort = req.body.port;

            if (data && data.length != 0) {
                if (data[0].name) {
                    req.body.host = data[0].name;
                }

                if (data[0].port) {
                    req.body.port = data[0].port;
                }
            }
        }

        var startTime = Date.now();

        setTimeout(function () {
            if (!res.headersSent) {
                var error = new Error('Timeout occured while trying to ping server!');

                if (process.env.ENABLE_SENTRY === 'true') {
                    client.captureError(error, {extra: {body: res.body}});
                } else {
                    console.error(error);
                }

                return res.status(200).send({
                    id: req.body.id,
                    host: originalHost,
                    port: originalPort,
                    online: false,
                    time_taken: Date.now() - startTime,
                    reason: error.message
                });
            }
        }, (req.body.timeout || 5000) * 1.5);

        ping(req.body.host, req.body.port, function (err1, data1) {
            if (err1) {
                if (process.env.ENABLE_SENTRY === 'true') {
                    client.captureError(err1)
                } else {
                    console.error(err1);
                }

                if (!res.headersSent) {
                    return res.status(200).send({
                        id: req.body.id,
                        host: originalHost,
                        port: originalPort,
                        online: false,
                        time_taken: Date.now() - startTime,
                        reason: err1.message,
                        new_method: false
                    });
                }
            } else {
                if (!res.headersSent) {
                    return res.status(200).send({
                        id: req.body.id,
                        host: originalHost,
                        port: originalPort,
                        online: true,
                        time_taken: Date.now() - startTime,
                        motd: data1.server_name,
                        players: {
                            online: parseInt(data1.num_players),
                            max: parseInt(data1.max_players)
                        },
                        new_method: false
                    });
                }
            }
        }, req.body.timeout);
    });
});

router.route('/vote').post(function (req, res) {
    if (!validators.voteValidator(req.body)) {
        var err = new Error('Invalid JSON provided!');

        if (process.env.ENABLE_SENTRY === 'true') {
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
            if (process.env.ENABLE_SENTRY === 'true') {
                client.captureError(err)
            } else {
                console.error(err);
            }
        }

        if (!res.headersSent) {
            return res.status(200).send({
                sent: !err
            });
        }
    });
});

router.route('/uuid/to').post(function (req, res) {
    if (!validators.uuidValidator.to(req.body)) {
        var err = new Error('Invalid JSON provided!');

        if (process.env.ENABLE_SENTRY === 'true') {
            client.captureError(err, {extra: {body: res.body}});
        } else {
            console.error(err);
        }

        return res.status(400).send('Invalid JSON provided!');
    }

    functions.usernameInUUIDTable(req.body.username, function (err, uuid) {
        if (err || req.body.force) {
            mojang.nameToUuid(req.body.username, function (err1, data) {
                if (err1) {
                    if (process.env.ENABLE_SENTRY === 'true') {
                        client.captureError(err1)
                    } else {
                        console.error(err1);
                    }

                    return res.status(400).send('Couldn\'t get UUID for username!');
                }

                if (data.length == 0) {
                    return res.status(200).send({
                        uuid: null,
                        fetched: true
                    });
                }

                // If !err then the username exsits in the table but we're forcing the lookup so wan't to update and not insert
                if (!err) {
                    r.table('uuid').filter({username: req.body.username}).update({
                        uuid: data[0].id
                    }).run();
                } else {
                    r.table('uuid').insert({
                        uuid: data[0].id,
                        username: data[0].name
                    }).run();
                }

                return res.status(200).send({
                    uuid: data[0].id,
                    fetched: true
                });
            });
        } else {
            return res.status(200).send({
                uuid: uuid,
                fetched: false
            });
        }
    });
});

router.route('/uuid/from').post(function (req, res) {
    if (!validators.uuidValidator.from(req.body)) {
        var err = new Error('Invalid JSON provided!');

        if (process.env.ENABLE_SENTRY === 'true') {
            client.captureError(err, {extra: {body: res.body}});
        } else {
            console.error(err);
        }

        return res.status(400).send('Invalid JSON provided!');
    }

    functions.uuidInUUIDTable(req.body.uuid, function (err, username) {
        if (err || req.body.force) {
            mojang.profile(req.body.uuid, function (err1, data) {
                if (err1) {
                    if (process.env.ENABLE_SENTRY === 'true') {
                        client.captureError(err1)
                    } else {
                        console.error(err1);
                    }

                    return res.status(400).send('Couldn\'t get username for UUID!');
                }

                if (data.length == 0) {
                    return res.status(200).send({
                        uuid: null,
                        fetched: true
                    });
                }

                // If !err then the username exists in the table but we're forcing the lookup so we want to update and not insert
                if (!err) {
                    r.table('uuid').filter({uuid: req.body.uuid}).update({
                        uuid: data.name
                    }).run();
                } else {
                    r.table('uuid').insert({
                        uuid: data.id,
                        username: data.name
                    }).run();
                }

                return res.status(200).send({
                    username: data.name,
                    fetched: true
                });
            });
        } else {
            return res.status(200).send({
                username: username,
                fetched: false
            });
        }
    });
});

module.exports = router;