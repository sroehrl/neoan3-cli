const fs = require('fs');
const calls = require('./calls.js');
const inquirer = require('inquirer');
const cp = require('child_process');
const execute = cp.execSync;
let Add = {
    name: '',
    version: '',
    composerJson: '',
    init: function (nameStr) {
        this.getComposerJson();
        this.splitNameString(nameStr);
    },
    processing:{
        uniqueCheck(){
            return typeof Add.composerJson.require[Add.name] === 'undefined'
        },
        constructRepoName(extra){
            let parts = extra.split('/');
            let lastParts = parts[parts.length - 1].split('.');
            let last = '';
            lastParts.forEach((part, i) => {
                if (i < lastParts.length - 1) {
                    last += part + '.'
                }
            });
            last = last.substring(0, last.length - 1);
            return parts[parts.length - 2] + '/' + last;
        },
        async customRepo(extra){

            let repo = this.constructRepoName(extra);
            // custom repo
            try {
                let exists = await calls.get('https://api.github.com/repos/' + repo);
                let infoTable = {};
                ['name', 'homepage', 'description', 'url'].forEach(key => {
                    if (exists[key]) {
                        infoTable[key] = exists[key];
                    }
                });
                if (exists.license) {
                    infoTable.license = exists.license.name;
                }

                console.table(infoTable);
            } catch (e) {
                let msg = 'neoan3 was unable to find this repository. ' + "\n";
                msg += 'It is possible that this repository is private. ' +
                    'Do you want to proceed?';
                let answer = await inquirer.prompt({
                    name: 'anyway',
                    type: 'confirm',
                    message: msg
                });
                if (!answer.anyway) {
                    throw new Error('Process stopped by user');
                }
            }
        }
    },

    async processInput(input, type, extra) {
        this.init(input);
        if(!this.processing.uniqueCheck()){
            throw new Error('Cannot overwrite existing declaration. ' +
                'Please manually inspect composer.json');
        }

        this.composerJson.require[this.name] = this.version;
        this.composerJson.extra['installer-paths']['./' + type +
        '/{$name}'].push(this.name.toString());
        if (typeof extra !== 'undefined') {
            await this.processing.customRepo(extra);
            this.addCustomRepo(extra);
        } else {
            let exists = await calls.get('https://packagist.org/search.json', {q: this.name});
            if (exists.total !== 1) {
                throw new Error('Cannot find package ' + this.name)
            }
        }
        this.writeComposerJson();
        this.executeComposer();
    },

    addCustomRepo(location) {
        if (typeof this.composerJson.repositories === 'undefined') {
            this.composerJson.repositories = [];
        }
        this.composerJson.repositories.push({
            type: 'vcs',
            url: location
        })
    },
    splitNameString: function (str) {
        let parts = str.split(':');
        this.name = parts[0];
        if (typeof parts[1] !== 'undefined') {
            this.version = parts[1];
        } else {
            this.version = 'dev-master';
        }
    },
    getComposerJson: function () {
        this.composerJson = JSON.parse(fs.readFileSync('./composer.json',
            'utf8'));
    },
    executeComposer: function (force) {
        console.log('NOTE: I am trying to run composer synchronously.' +
            'If this fails, please run "composer update"');
        if (!process.env.MOCKCP && !force) {
            execute('composer update ', (error, stdout, stderr) => {
                if (error) {
                    console.log('Failed to run composer. Please do so manually.');
                }
            });
        }

        console.log('    ________________________');
        console.log('^ Output from composer. Process ran');
        // process.exit(1);
    },
    writeComposerJson: function () {

        fs.writeFileSync('./composer.json', JSON.stringify(this.composerJson,
            null, 4), function (err, outd) {
            if (err) {
                throw new Error(err);
            }
        });
    }
};
module.exports = Add;
