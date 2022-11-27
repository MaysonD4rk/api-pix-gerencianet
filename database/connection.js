
var knex = require('knex')({
    client: process.env.DBCLIENT,
    connection: {
        host: process.env.DBHOST,
        user: process.env.DBUSER,
        password: process.env.DBPASSWORD,
        database: process.env.DATABASE
    }
})

module.exports = knex