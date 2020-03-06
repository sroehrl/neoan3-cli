const assert = require('assert');
const add = require('../actions/add');
const mock = require('mock-fs');

const mockComposerJson = {
    repositories:[
        {
            "type": "vcs",
            "url": "https://github.com/sroehrl/neoan3Pwa.git"
        }
    ],
    require:{
        "sroehrl/neoan3Pwa":"dev-master"
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
            let c = add.composerJson;
            assert.deepEqual(c, mockComposerJson);
        })
    });

});