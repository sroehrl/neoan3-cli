const calls = require('./calls.js');
const execute = require('child_process').exec;
const fs = require('fs-extra');

module.exports = {
    init: async function(name, url, extra, options){
        let external = await calls.get(url);
        fs.writeFileSync('./n3-installer.n3',external);

        let executioner = execute('php n3-installer.n3',(error, stdout, stderr) => {
            if (error) {
                console.log('Failed to run external script. Please do so manually.');
            }
            console.log(stdout);
        });
        executioner.stdout.pipe(process.stdout);
        executioner.on('exit', function() {
            console.log('Installer has been executed and placed in "n3-installer.n3". This file can be deleted and should not be deployed.');
            process.exit()
        })
    }
};