const assert = require('assert');
const mysqlConnection = require('../actions/migration/mysqlConnection');
const inquirer = require('inquirer');
const mysql = require('mysql');

const mockUserVars = {
    database: {
        "test@sam": {
            host: 'localhost',
            name: 'my_db',
            user: 'root',
            port: 3306,
            savePw: true,
            password: '123456'
        }
    }
};
let inquirerOverwrite;
let mysqlOverwrite = { connection: false };
describe("migration/mysqlConnection", function () {
    before(function () {
        inquirerOverwrite = inquirer.prompt;
        mysqlOverwrite.connection = mysql.createConnection;
        mysql.createConnection = (credentials) =>{
            return {
                connect(cb){
                    cb(false);

                },
                async query(sql){
                    return true;
                }
            }
        };

    });
    after(function () {
        inquirer.prompt = inquirerOverwrite;
        mysql.createConnection = mysqlOverwrite.connection;
    });

    describe('#connectionSetup', function () {
        it("should return connection credentials", async function () {
            let credentials = await mysqlConnection.connectionSetup(mockUserVars.database['test@sam']);
            assert.equal(credentials.password, '123456');
        })
    });
    describe('#connectionSetup - unsaved password', function () {
        it("should return connection credentials", async function () {
            inquirer.prompt = (questions) => Promise.resolve({password: '654321'});
            let existingCredentials = {...mockUserVars.database['test@sam']};
            existingCredentials.savePw = false;
            let credentials = await mysqlConnection.connectionSetup(existingCredentials);
            assert.equal(credentials.password, '654321');
        })
    });
    describe('#connect', function () {
        it("should return callable connection", async function () {

            let connection = await mysqlConnection.connect(mockUserVars.database['test@sam']);
            assert.ok(connection);
        })
    });
    describe('#connect - fail', function () {
        it("should return callable connection", async function () {
            mysql.createConnection = (credentials) =>{
                return {
                    connect(cb){
                        cb(true);

                    },
                    async query(sql){
                        return true;
                    }
                }
            };
            try{
                let connection = await mysqlConnection.connect(mockUserVars.database['test@sam']);
            } catch (e) {
                assert(e);
            }
        })
    });
});