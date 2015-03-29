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

var r = require('rethinkdb');

exports.usernameInUUIDTable = function (username, connection, callback) {
    r.table('uuid').filter({username: username}).run(connection, function (err, cursor) {
        if (err) {
            callback(err);
        }

        cursor.next(function (err, row) {
            if (err) {
                callback(new Error('Username doesn\'t exist in the UUID table!'));
            } else {
                callback(null, row.uuid);
            }
        });
    });
};

exports.uuidInUUIDTable = function (uuid, connection, callback) {
    r.table('uuid').filter({uuid: uuid}).run(connection, function (err, cursor) {
        if (err) {
            callback(err);
        }

        cursor.next(function (err, row) {
            if (err) {
                callback(new Error('UUID doesn\'t exist in the UUID table!'));
            } else {
                callback(null, row.username);
            }
        });
    });
};