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

exports.checkAuthKey = function (req, res, next) {
    if (req.body.auth != process.env.AUTH_KEY) {
        var err = new Error('Invalid auth provided!');

        if (process.env.ENABLE_SENTRY === 'true') {
            var raven = require('raven');

            var client = new raven.Client(process.env.SENTRY_DSN);

            client.captureError(err, {extra: {body: res.body}});
        } else {
            console.error(err);
        }

        return res.status(400).send('Invalid auth provided!');
    }

    next();
};