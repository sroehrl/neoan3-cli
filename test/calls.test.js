const assert = require('assert');
const calls = require('../actions/calls');

describe('Calls', function () {

    describe("#getOptions", function(){
        it('should set options', function () {
            let options = calls.getOptions('api/1', 'post');
            assert.equal(options.method,'post')
        })

    });
    describe("#get", function(){
        it('should return a json', async function () {
            let data = await calls.get('https://jsonplaceholder.typicode.com/todos/1');
            assert.equal(data.userId,1)
        })

    });
    describe("#post", function(){
        it('should create a post', async function () {
            this.timeout(6000);
            let data = await calls.post('https://jsonplaceholder.typicode.com/posts',{
                title: 'foo',
                body: 'bar',
                userId:1
            });
            assert.equal(data.id,101)
        })

    });
    describe("#error-handling", function(){
        it('should throw errors', async function () {
            try {
                await calls.post('unreach.able',{})
            } catch (e) {
                assert(e);
            }

            try {
                await calls.get('unreach.able',{})
            } catch (e) {
                assert(e);
            }
        })

    })
});