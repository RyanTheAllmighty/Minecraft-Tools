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

var r = require('rethinkdbdash')();

exports.usernameInUUIDTable = function (username, callback) {
    r.table('uuid').filter({username: username}).run().then(function (data) {
        if (data.length == 0) {
            callback(new Error('Username doesn\'t exist in the UUID table!'));
        } else {
            callback(null, data[0].uuid);
        }
    }).error(function (err) {
        callback(err);
    });
};

exports.uuidInUUIDTable = function (uuid, connection, callback) {
    r.table('uuid').filter({uuid: uuid}).run().then(function (data) {
        if (data.length == 0) {
            callback(new Error('UUID doesn\'t exist in the UUID table!'));
        } else {
            callback(null, data[0].username);
        }
    }).error(function (err) {
        callback(err);
    });
};