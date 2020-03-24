const assert = require('assert');
const add = require('../actions/add');
const mock = require('mock-fs');
const execute = require('child_process');
const inquirer = require('inquirer');

let inquirerOverwrite;
let cpOverwrite;
let logOverwrite;

const mockComposerJson = {
    repositories:[
        {
            "type": "vcs",
            "url": "https://github.com/sroehrl/neoan3Pwa.git"
        }
    ],
    require:{
        "sroehrl/neoan3Pwa":"dev-master"
    },
    extra:{
        "installer-paths":{
            "./frame/{$name}": [
            ],
            "./model/{$name}": [
                "neoan3-model/index"
            ],
            "./component/{$name}": []
        }
    }
};

describe('Add', function () {
    before(function(){
        inquirerOverwrite = inquirer.prompt;
        cpOverwrite = execute.execSync;
        logOverwrite = console.log;
        mock({
            './composer.json': JSON.stringify(mockComposerJson)
        });
    });

    after(function() {
        inquirer.prompt = inquirerOverwrite;
        execute.execSync = cpOverwrite;
        console.log = logOverwrite;
        mock.restore();
    });
    describe('#init - composer Json', function () {
        it('should read the same composer-file as mocked up', function () {
            add.init('mock-component:dev-master');
            assert.deepEqual(add.composerJson, mockComposerJson);
            assert.equal(add.version, 'dev-master')
        });
    });
    describe('#processing.constructCustomRepo', function () {
        it('should translate the extra-attribute into a repo', function () {
            let repo = add.processing.constructRepoName('https://github.com/sroehrl/neoan3Pwa.git');
            assert.equal(repo, 'sroehrl/neoan3Pwa')
        });
    });
    describe('#processInput - fail', function(){
        it('should stop the process in order to prevent overwriting added components', async function () {
            process.env.MOCKCP = true;
            try {
                await add.processInput('sroehrl/neoan3Pwa', 'component', 'https://github.com/sroehrl/neoan3Pwa.git')
            } catch (e) {
                assert(e)
            }


        })
    });
    describe('#processInput - composer package', function(){
        it('should find the composer package', async function(){
            this.timeout(6000);
            process.env.MOCKCP = true;
            await add.processInput('vast-n3/vastn3','frame');
            add.getComposerJson();
            assert.equal(add.composerJson.require["vast-n3/vastn3"],'dev-master');
        })
    });

    describe('#processInput - custom repo', function(){
        it('should find the github repo', async function(){
            this.timeout(6000);
            process.env.MOCKCP = true;
            await add.processInput('neoan3-model/user','model', 'https://githunb.com/sroehrl/neoan3-userModel.git');
            add.getComposerJson();
            assert.equal(add.composerJson.require["neoan3-model/user"],'dev-master');
        })
    });
    describe('#processInput - 404 call', function(){
        it('should handle unfound custom repo', async function(){
            this.timeout(6000);
            process.env.MOCKCP = true;
            inquirer.prompt = (questions) => Promise.resolve({anyway:false});
            try{
                await add.processInput('neoan3-model/hoefullyThisWillNeverExist','model', 'https://githunb.com/sroehrl/hopefullyThisWillNeverExist.git');
            } catch (e) {
                assert(e);
            }
        });
        it('should handle unfound package', async function(){
            this.timeout(6000);
            process.env.MOCKCP = true;
            inquirer.prompt = (questions) => Promise.resolve({anyway:false});
            try{
                await add.processInput('neoan3-model/hoefullyThisWillNeverExist','model');
            } catch (e) {
                assert(e);
            }
        })
    });
    describe('#execute composer', function(){
        it('should pretend to receive a composer error', function(){
            process.env.MOCKCP = false;
            let mockLog = [];
            console.log = (input) => {
                mockLog.push(input)
            };
            add.executeComposer(true);
            assert.equal(mockLog[2], '^ Output from composer. Process ran');
        })
    });

});