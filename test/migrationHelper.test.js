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
const mockMigrate = {
    "test":{
        "id":{
            "key":"primary",
            "type":"int(11)"
        }
    }
};

describe("migration/helper", function(){
    let inquirerOverwrite;
    before(function(){
        inquirerOverwrite = inquirer.prompt;

        mock({
            './actions/userVariables/userVars.json': JSON.stringify(mockUserVars),
            './model':{
                'test':{
                    'migrate.json': mock.file({
                        content:JSON.stringify(mockMigrate)
                    })
                }
            }
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
    describe('#asyncLoop', function(){
        it("should synchronize loop behavior", async function () {
            let array = ['a','b','c'];
            let testString = '';
            let targetString = 'abc';
            await migrateHelper.asyncLoop(array, async (char)=>{
                testString += char;
            });
            assert.equal(testString,targetString)
        })
    });
    describe('#getModelJsons', function(){
        it("should return mock migrate.json", async function () {
            migrateHelper.compare.getModelJsons();
            assert.deepEqual(migrateHelper.compare.knownModels.test,mockMigrate)
        })
    });
    describe('#compareDown', function(){
        it("should identify differences between knownModels and knownTables (master knownTables)", function(){
            migrateHelper.compare.knownTables = {
                "test_sub": [{
                    "id":{
                        "key":"primary",
                        "type":"int(11)"
                    },
                    "test_id":{}
                }]
            };
            migrateHelper.compare.getModelJsons();
            migrateHelper.compare.compareDown();
            console.log(migrateHelper.compare.knownTables);
            assert.deepEqual(migrateHelper.compare.knownModels.test.test_sub, migrateHelper.compare.knownTables.test_sub)
        })
    });
    describe('#compareUp', function(){
        it("should identify differences between knownModels and knownTables (master knownModels)", function(){
            migrateHelper.compare.getModelJsons();

            // scenario: trigger create
            migrateHelper.compare.knownModels.test.test_sub = {
                id:{
                    key: 'primary',
                    type: 'int(11)'
                },
                test_id: {
                    key: false,
                    type: "int(11)"
                }
            };
            // scenario: test-table in db doesn't have id
            migrateHelper.compare.knownTables = {
                "test":{
                    "new_column":{
                        "type":"varchar(200)",
                        "key": false
                    }
                }
            };
            let queries = migrateHelper.compare.compareUp();
            let expectAlter = 'ALTER TABLE `test` ADD COLUMN `id` int(11);\n';
            let expectInsert = 'CREATE TABLE `test_sub`(`id` int(11) NOT NULL \n' +
                ',`test_id` int(11) NOT NULL \n' +
                ',PRIMARY KEY(id)\n' +
                ');';
            assert.deepEqual(queries,[expectAlter,expectInsert]);

        })
    })
});