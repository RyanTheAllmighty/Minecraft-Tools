/**
 * mc-ping
 * Copyright (c) 2013 David White
 * MIT Licensed
 **/

var net = require("net");

var BufferBuilder = require('buffer-builder');

var varint = require('varint');

var ping = function (server, port, callback) {

    var socket = net.connect({
        host: server,
        port: port
    });

    socket.once('connect', function () {
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

    var bufData = new BufferBuilder();

    socket.on('data', function (data) {
        bufData.appendBuffer(data);
    });

    socket.once('end', function (e) {
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
        if (callback !== undefined) {
            callback(e);
        }
    });

    socket.setTimeout(5000, function () {
        console.error(new Error("Socket timed out when connecting to " + server + ":" + port));
        socket.end();
        socket.destroy();
    });
};

ping("192.95.49.168", 25565, function (err, data) {
    if (err) {
        return console.error(err);
    }

    console.log(data.description);
});