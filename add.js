const fs = require('fs');
const calls = require('./calls.js');
const inquirer = require('inquirer');
const execute = require('child_process').execSync;
let Add = {
    name:'',
    version:'',
    composerJson:'',
    init:function(nameStr){
        this.getComposerJson();
        this.splitNameString(nameStr);
    },

    async processInput(input,type,extra){
        this.init(input);
        if(typeof this.composerJson.require[this.name] !== 'undefined'){
            console.log('Cannot overwrite existing declaration. Please manually inspect composer.json');
            process.exit(1);
        }
        this.composerJson.require[this.name] = this.version;
        this.composerJson.extra['installer-paths']['./'+type+'/{$name}'].push(this.name.toString());
        if(typeof extra !== 'undefined'){
            let parts = extra.split('/');
            let repo = parts[parts.length-2]+'/'+parts[parts.length-1];
            // custom repo
            let exists = await calls.get('https://api.github.com/repos/'+repo);
            if(typeof exists.error !== 'undefined'){
                let msg = 'neoan3 was unable to find this repository. '+"\n";
                msg += 'It is possible that this repository is private. Do you want to proceed?';
                let answer = await  inquirer.prompt({name:'anyway',type:'confirm',message:msg});
                if(!answer.anyway){
                    process.exit();
                }
            }
            this.addCustomRepo(extra);
        } else {
            let exists = await calls.get('https://packagist.org/search.json?q='+this.name);
            if(exists.total!==1){
                console.log('Package "%s" does not exist or is ambiguous. If your package is not registered with packagist, add the GitHub-path to your command.',this.name);
            }
            process.exit(1);
        }
        this.writeComposerJson();
        this.executeComposer();
    },
    addCustomRepo(location){
        if(typeof this.composerJson.repositories === 'undefined'){
            this.composerJson.repositories = [];
        }
        this.composerJson.repositories.push({
            type:'vcs',
            url:location
        })
    },
    splitNameString:function(str){
        let parts = str.split(':');
        this.name = parts[0];
        if(typeof parts[1] !== 'undefined'){
            this.version = parts[1];
        } else {
            this.version = 'dev-master';
        }
    },
    getComposerJson:function(){
        this.composerJson = JSON.parse(fs.readFileSync('./composer.json','utf8'));
    },
    executeComposer:function(){
        console.log('NOTE: I am trying to run composer synchronously. If this fails, please run "composer update"');
        execute('composer update ',(error, stdout, stderr)=>{
            if(error){
                console.log('Failed to run composer. Please do so manually.');
            }
        });
        console.log('    ________________________');
        console.log('^ Output from composer. Process ran');
        process.exit(1);
    },
    writeComposerJson:function(){

        fs.writeFileSync('./composer.json',JSON.stringify(this.composerJson, null, 4),function(err,outd){
            if(err){
                throw new Error(err);
            }
        });
    }
};
module.exports = Add;
