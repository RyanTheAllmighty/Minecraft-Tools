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

var validator = require('is-my-json-valid');

exports.queryValidator = validator({
    required: true,
    type: 'object',
    properties: {
        auth: {
            required: true,
            type: 'string'
        },
        host: {
            required: true,
            type: 'string'
        },
        port: {
            required: true,
            type: 'integer',
            minimum: 1,
            maximum: 65535
        },
        id: {
            required: true,
            type: 'integer',
            minimum: 1
        },
        timeout: {
            required: false,
            type: 'integer',
            minimum: 1
        }
    }
});

exports.voteValidator = validator({
    required: true,
    type: 'object',
    properties: {
        auth: {
            required: true,
            type: 'string'
        },
        host: {
            required: true,
            type: 'string'
        },
        port: {
            required: true,
            type: 'integer',
            minimum: 1,
            maximum: 65535
        },
        id: {
            required: true,
            type: 'integer',
            minimum: 1
        },
        key: {
            required: true,
            type: 'string'
        },
        username: {
            required: true,
            type: 'string'
        },
        ip: {
            required: true,
            type: 'string'
        },
        site: {
            required: true,
            type: 'string'
        }
    }
});

exports.uuidValidator = {
    to: validator({
        required: true,
        type: 'object',
        properties: {
            auth: {
                required: true,
                type: 'string'
            },
            force: {
                required: false,
                type: 'boolean'
            },
            username: {
                required: true,
                type: 'string'
            }
        }
    }),
    from: validator({
        required: true,
        type: 'object',
        properties: {
            auth: {
                required: true,
                type: 'string'
            },
            force: {
                required: false,
                type: 'boolean'
            },
            uuid: {
                required: true,
                type: 'string'
            }
        }
    })
};