var knex = require('knex')({
    client: 'mysql2',
    connection: {
        host: 'db-mswareg.c8krvoqz6fy6.sa-east-1.rds.amazonaws.com',
        user: 'mswaregmasterdb',
        password: 'cF0ZFgZBpfL6ClUsmJ2J',
        database: 'mswareg_dev'
    }
})

module.exports = knex