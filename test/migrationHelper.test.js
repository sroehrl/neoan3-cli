const assert = require('assert');
const inquirer = require('inquirer');
const migrateHelper = require('../actions/migration/helper');
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

describe("migration/helper", function(){
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
    describe('#keyMatch', function(){
        it("should return the appropriate SQL term for a key", function () {
            let testInput = {
                'PRI':'primary',
                'UNI':'unique',
                'primary':'PRIMARY KEY',
                'unique':'UNIQUE',
                'index':'KEY',
                'unknown':false,
            };
            Object.keys(testInput).forEach(key=>{
                assert.equal(migrateHelper.keyMatch(key),testInput[key])
            })
        })
    });

});