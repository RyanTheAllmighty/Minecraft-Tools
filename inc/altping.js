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

var net = require("net");

var BufferBuilder = require('buffer-builder');

var varint = require('varint');

module.exports = function (server, port, callback, timeout) {
    if (typeof timeout == "undefined") {
        timeout = 3000;
    }

    var socket = net.connect({
        host: server,
        port: port
    }, function () {
        var buffer = new BufferBuilder();
        buffer.appendFill(0x00, 1);
        buffer.appendBuffer(varint.encode(4, new Buffer(varint.encodingLength(4))));

        var serverNameBuffer = new BufferBuilder();
        serverNameBuffer.appendString(server);

        buffer.appendBuffer(varint.encode(serverNameBuffer.length, new Buffer(varint.encodingLength(serverNameBuffer.length))));
        buffer.appendString(server);
        buffer.appendUInt16BE(port);
        buffer.appendBuffer(varint.encode(1, new Buffer(varint.encodingLength(1))));

        var buff = new Buffer(2);
        buff[0] = 0x01;
        buff[1] = 0x00;

        var buf = new BufferBuilder();
        buf.appendBuffer(varint.encode(buffer.length, new Buffer(varint.encodingLength(buffer.length))));
        buf.appendBuffer(buffer.get());

        socket.write(buf.get());
        socket.write(buff);

        socket.end();
    });

    socket.setTimeout(timeout, function () {
        callback(new Error("Socket timed out when connecting to " + server + ":" + port));

        socket.end();
        socket.destroy();
    });

    var bufData = new BufferBuilder();

    socket.on('data', function (data) {
        bufData.appendBuffer(data);
    });

    socket.once('end', function (e) {
        if (bufData.get().length == 0) {
            return callback(new Error('Server didn\'t respond with any data!'));
        }

        var bytes = 0;

        var length = varint.decode(bufData.get());
        bytes += varint.decode.bytes;

        var type = varint.decode(bufData.get(), bytes);
        bytes += varint.decode.bytes;

        var length2 = varint.decode(bufData.get(), bytes);
        bytes += varint.decode.bytes;

        if (type != 0) {
            callback(new Error('Server responded with an invalid status response!'));
        }

        callback(null, JSON.parse(bufData.get().toString('utf8', bytes)));
    });

    socket.once('error', function (e) {
        callback(e);
    });
};