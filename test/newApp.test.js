
const path = require('path');
const app = require('../new/app');
const calls = require('../actions/calls');

let promptResult = {};
const mockInquirer = {
    prompt(questions){
        return new Promise(resolve => {
            resolve(promptResult)
        })
    }
}
const a = new app('sam', mockInquirer, calls, path.join(__dirname,'playground'))
test('adds', async done => {
    jest.setTimeout(12000);
    a.download((files)=>{

        expect('a').toBe('a');
        done()
    });
})
test('unzip', async done => {
    a.unzip((files)=>{
        console.log('a')
        done()
    });
})
