const assert = require('assert');
const add = require('../actions/add');
const mock = require('mock-fs');
const cp = require('child_process');

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
        mock({
            './composer.json': JSON.stringify(mockComposerJson)
        });
    });

    after(function() {
        mock.restore();
    });
    describe('#init - composer Json', function () {
        it('should read the same composer-file as mocked up', function () {
            add.init('mock-component:dev-master');
            assert.deepEqual(add.composerJson, mockComposerJson);
            assert.equal(add.version, 'dev-master')
        });
    });
    describe('#processInput - fail', function(){
        it('should stop the process in order to prevent overwriting added components', function () {
            assert.rejects(async ()=>{
                await add.processInput('sroehrl/neoan3Pwa', 'component', 'https://github.com/sroehrl/neoan3Pwa.git')
            });

        })
    });
    describe('#processInput - composer package', function(){
        it('should find the composer package', async function(){
            this.timeout(4000);
            process.env.MOCKCP = true;
            await add.processInput('vast-n3/vastn3','frame');
            add.getComposerJson();
            assert.equal(add.composerJson.require["vast-n3/vastn3"],'dev-master');
        })
    });
    describe('#processInput - custom repo', function(){
        it('should find the github repo', async function(){
            this.timeout(4000);
            process.env.MOCKCP = true;
            await add.processInput('neoan3-model/user','model', 'https://githunb.com/sroehrl/neoan3-userModel.git');
            add.getComposerJson();
            assert.equal(add.composerJson.require["neoan3-model/user"],'dev-master');
        })
    });
});