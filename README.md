Minecraft Tools
====================================

### What is it?
This is a small application written in NodeJS to provide some tools for interacting with Minecraft things such as Servers for querying them and interacting with the Mojang API for getting information about Minecraft users and more.

### Prerequisites
The use of this application REQUIRES [RethinkDB](http://rethinkdb.com/) to be installed and configured in your .env file.

### Setting Up
To set things up simply make a copy of the .env.example file and name it .env and change anything in there that you want. An explanation of each element is below:

#### SERVER_PORT
This is the port that Node will use to accept requests on.

#### AUTH_KEY
This is a auth key which must be provided on each request in order to process things. This can be anything you want, as long as it matches that which you send in your request.

#### ENABLE_SENTRY
This is a boolean value (true or false) on if we should log all errors to a Sentry server or not.

#### SENTRY_DSN
This is the DSN url for the Sentry server to send all errors to.

#### RETHINKDB_HOST
This is the host that the RethinkDB instance is listening on.

#### RETHINKDB_PORT
This is the port that the RethinkDB instance is listening on.

#### RETHINKDB_DB
This is the database name to use for all data used by this application in RethinkDB.

### Sending Requests
This tool can currently do 2 things. Get details about a Minecraft server and send off votes to a Votifier enabled server. For details on each see below.

All requests must be sent as JSON data and have the Content-Type header of application/json. All responses sent back are also sent in JSON format.

#### Getting Minecraft Server Details
To get a Minecraft servers details simply send a post request to 'host:port/query' with the following data:

```
   {
     "id": 1,
     "host": "127.0.0.1",
     "port": 25565,
     "auth": "MyAuthKeyFromTheEnvFile"
   }
```

This should all be self explanatory except for the id element. This is used for any sort of internal use you may have, such as uniquely identifying the server you're querying, as the response also sends back that same id.

You may also provide an optional timeout value to the JSON sent to the server which is an integer > 0 of the time it should wait to try to connect and get the information from the server in milliseconds.

The response sent back will look like the following:

```
    {
        "id": 1,
        "host": "127.0.0.1",
        "port": 25565,
        "online": true,
        "time_taken": 143,
        "motd": "Some Message",
        "players": {
            "online": 2,
            "max": 50
         }
    }
```

Again this should be self explanatory. If the server cannot be queried/connected to then the online value will be false and the motd and players elements will not appear. Also another element named error will appear with some details as to why it failed to connect.

#### Sending Votifier Votes
To send off a Votifier vote to a Minecraft server simply send a post request to 'host:port/vote' with the following data:

```
    {
        "id": 1,
        "host": "127.0.0.1",
        "port": 25565,
        "key": "VotifierPublicKey",
        "username": "TestUsername",
        "ip": "111.111.111.111",
        "site": "MySiteName",
        "auth": "MyAuthKeyFromTheEnvFile"
    }
```

This should be self explanatory like the query request, with the only additions being key (which is the Votifier public key of the server), username (which is the username of the person who voted), ip (which is the IP of the voter) and site (which is the name of the site that sent the Votifier vote). Again the id element is there purely for identifying things.

The response sent back will look like the following:

```
    {
        "sent": true
    }
```

This simply returns if the vote was sent to the server or not.

### License

This work is licensed under the GNU General Public License v3.0. To view a copy of this license, visit http://www.gnu.org/licenses/gpl-3.0.txt.