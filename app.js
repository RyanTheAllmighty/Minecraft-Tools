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

var votifier = require('votifier-send');

var r = require('rethinkdb');
var middleware = require('./inc/middlewares');

var env = require('node-env-file');
env(__dirname + '/.env');

var app = express();

if (process.env.ENABLE_SENTRY) {
    var raven = require('raven');

    var client = new raven.Client(process.env.SENTRY_DSN);
}

// All the express related things
app.use(bodyParser.json());

app.use(middleware.checkAuthKey);
app.use(middleware.createConnection);
app.use('/', require('./inc/routes'));
app.use(middleware.closeConnection);

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

    r.db('minecraft_tools').table('uuid').indexCreate('username').run(conn, function (err) {
        if (err) {
            console.log('username already an index, no need to add it!');
        } else {
            console.log('Added the username as an index!');
        }
    });

    var server = app.listen(process.env.SERVER_PORT, function () {
        var host = server.address().address;
        var port = server.address().port;

        console.log('Listening at http://%s:%s', host, port);
    });

    conn.close();
});