const mysql = require('mysql');
const inquirer = require('inquirer');
const util = require('util');

module.exports = {
    connection:false,
    async connect(credentials){
        let finalCredentials = await this.connectionSetup(credentials);
        let conn = mysql.createConnection(finalCredentials);
        await conn.connect(function (err) {
            if (err) {
                throw new Error('Unable to establish connection. ' +
                    'Run "neoan3 migrate flush" to reset credentials')
            }
            console.log('Connection established');
        });
        conn.query = util.promisify(conn.query);
        this.connection = conn;
        return conn;
    },
    async connectionSetup(credentials){
        let config = {
            host: credentials.host,
            user: credentials.user,
            database: credentials.name,
            port: credentials.port
        };
        if (!credentials.savePw) {
            let pw = await inquirer.prompt([{
                name: 'password',
                type: 'password',
                message: 'password',
                default: ''
            }]);
            config.password = pw.password;
            return config;
        } else {
            config.password = credentials.password;
            return config;
        }
    }
};