const assert = require('assert');
const stringHelper = require('../actions/stringHelper');

describe('String Helper', function () {
    describe('#fucase', function () {
        it('should convert string to first character being upper case', function () {
            let origin = 'sameHelper';
            let target = 'SameHelper';
            assert.equal(stringHelper.fucase(origin), target);
        });
    });
    describe('#flcase', function () {
        it('should convert string to first character being lower case', function () {
            let origin = 'SameHelper';
            let target = 'sameHelper';
            assert.equal(stringHelper.flcase(origin), target);
        });
    });
    describe('#camel2snake', function () {
        it('should convert string from camel case to snake case', function () {
            let origin = 'SameHelper';
            let target = 'same_helper';
            assert.equal(stringHelper.camel2snake(origin), target);
        });
    });
    describe('#embrace .lower', function () {
        it('should insert value lower case', function () {
            let template = 'Shall be {{some.lower}}{{some.lower}} value';
            let subs = {some:'value'};
            let target = 'Shall be valuevalue value';
            assert.equal(stringHelper.embrace(template,subs), target);
        });
    });
    describe('#embrace .pascal', function () {
        it('should insert value pascal case', function () {
            let template = 'Shall be {{some.pascal}}{{some}} value';
            let subs = {some:'value'};
            let target = 'Shall be ValueValue value';
            assert.equal(stringHelper.embrace(template,subs), target);
        });
    });
    describe('#embrace .camel', function () {
        it('should insert value camel case', function () {
            let template = 'Shall be {{some.camel}} value';
            let subs = {some:'ValueValue'};
            let target = 'Shall be valueValue value';
            assert.equal(stringHelper.embrace(template,subs), target);
        });
    });
    describe('#analyze versions "false"', function () {
        it('should return false as newer version exists', function () {
            let local = '1.1.1';
            let external = '1.2.1';
            assert.equal(stringHelper.analyzeVersions(local,external),false)
        });
    });
    describe('#analyze versions "true"', function () {
        it('should return true as newer version exists', function () {
            let local = '1.2.1';
            let external = '1.2.1';
            assert.ok(stringHelper.analyzeVersions(local,external))
        });
    });
});