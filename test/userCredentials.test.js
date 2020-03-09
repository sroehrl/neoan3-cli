const assert = require('assert');
const inquirer = require('inquirer');
const userCredentials = require('../actions/userVariables/userCredentials');
const databaseQ = require('../actions/userVariables/database.questions')
const mock = require('mock-fs');

const mockUserVars = {
    database:{
        "test@sam":{
            host:'localhost',
            name:'my_db',
            user:'root',
            port:3306,
            savePw:true,
            password:'123456'
        }
    }
};
describe("userCredentials", function(){
    let inquirerOverwrite;
    before(function(){
        inquirerOverwrite = inquirer.prompt;

        mock({
            './actions/userVariables/userVars.json': JSON.stringify(mockUserVars)
        });
    });

    after(function() {
        inquirer.prompt = inquirerOverwrite;
        mock.restore();
    });
    describe("#readFile", function(){
        it("should read mock credentials", function(){
            userCredentials.readFile();
            assert.deepEqual(userCredentials.credentials,mockUserVars);
        })
    });
    describe("#newDatabase", function(){
        it("should read mock credentials", async function(){
            mockUserVars.database['testMe@localhost'] = {
                name:'testMe',
                host:'localhost',
                user:'rooty',
                port:8080,
                savePw: true,
                password: 'emiliy'
            };
            inquirer.prompt = (questions) => Promise.resolve(mockUserVars.database['testMe@localhost']);
            let credentials = await userCredentials.newDatabase();
            assert.deepEqual(userCredentials.credentials,mockUserVars);
        })
    });
    describe("#selectCredentials - database", function(){
        it("should read database credentials", async function(){
            let answer = {
                selected: 'test@sam'
            };

            inquirer.prompt = (questions) => Promise.resolve(answer);
            let credentials = await userCredentials.selectCredentials('database');
            assert.deepEqual(credentials,mockUserVars.database['test@sam']);
        })
    });
    describe("#databaseConditional", function(){
        it("should return depending on choice ", async function(){
            let t = databaseQ[databaseQ.length-1].when({savePw:true})
            assert.equal(t,true);
        })
    });
    describe("#flush - one", function(){
        it("should flush database credentials of testMe@localhost ", async function(){
            userCredentials.flush('database','testMe@localhost');
            assert.equal(userCredentials.credentials.database['testMe@localhost'],undefined);
        })
    });
    describe("#flush - all", function(){
        it("should flush all database credentials ", async function(){
            userCredentials.flush('database');
            assert.deepEqual(userCredentials.credentials.database,{});
        })
    })
});