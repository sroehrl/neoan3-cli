const fs = require('fs');
const execute = require('child_process').execSync;
let Add = {
    name:'',
    version:'',
    composerJson:'',
    init:function(nameStr){
        this.getComposerJson();
        this.splitNameString(nameStr);
    },

    processInput(input,type,extra){
        this.init(input);
        if(typeof this.composerJson.require[this.name] !== 'undefined'){
            console.log('Cannot overwrite existing declaration. Please manually inspect composer.json');
            process.exit(1);
        }
        this.composerJson.require[this.name] = this.version;
        this.composerJson.extra['installer-paths']['./'+type+'/{$name}'].push(this.name.toString());
        if(typeof extra !== 'undefined'){
            this.addCustomRepo(extra);
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
