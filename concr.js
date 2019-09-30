const inquirer = require('inquirer');
const fs = require('fs');
const fileCreator = require('./actions/fileCreator.js');
const add = require('./actions/add.js');
const download = require('download-git-repo');
const execute = require('child_process').execSync;
const migrate = require('./actions/migrate.js');
const publish = require('./actions/publish.js');
const calls = require('./actions/calls.js');
const credentials = require('./actions/credentials.js');
const progressBar = require('./actions/progress.js');
let concr = {
    getCurrentVersion:function(){
        let pack = JSON.parse(fs.readFileSync(__dirname+'/package.json','utf8'));
        return pack.version;
    },
    analyseVersions: function(localversion,remoteVersion){
        let local = localversion.split('.');
        let remote = remoteVersion.split('.');
        for(let i=0;i<3;i++){
            if(Number(local[i])>Number(remote[i])){
                return true;
            } else if(Number(local[i])<Number(remote[i])){
                return false;
            }
        }
        return true;
    },
    executer: async function (cmd, type, name, extra) {
        if (typeof cmd !== 'undefined') {
            let localVersion = concr.getCurrentVersion();
            let onlineVersion = await calls.get('api.npms.io','/v2/search?q=neoan3-cli');
            if(typeof onlineVersion.results !== 'undefined'){
                if(!concr.analyseVersions(localVersion,onlineVersion.results[0].package.version)){
                    console.log('/**************');
                    console.log('*');
                    console.log('* neoan3-cli version '+onlineVersion.results[0].package.version+' available. Consider updating');
                    console.log('*');
                    console.log('**************/');
                }
            }
            switch (cmd) {
                case 'new':
                    if (typeof type == 'undefined') {
                        concr.error('New what? Try again.')
                    }
                    let func = concr.processType(type);
                    if (func) {
                        if (typeof name === 'undefined' && type !== 'app') {
                            concr.error('Yeah, so you wanna add a name to that command, human!');
                        } else {
                            concr[func](name)
                        }
                    }
                    break;
                case 'help':
                    console.log('Please refer to https://github.com/sroehrl/neoan3 for help. Currently, neoan3-cli has very limited possibilities.');
                    break;
                case 'add':
                    if (typeof type === 'undefined' || !['component','model','frame'].includes(type)) {
                        concr.error('Possible entities are "add component [repo]", "add model [repo]", "add frame [repo]"')
                    }
                    add.processInput(name, type, extra);
                    break;
                case 'migrate': migrate.init(type, name); break;
                case 'publish': publish.init(type, name); break;
                case 'credentials': credentials.init(type, name); break;
                default:
                    concr.error();
            }
        }
    },
    processType: function (type) {
        let res;
        switch (type) {
            case 'component':
                res = 'newComponent';
                break;
            case 'app':
                res = 'newApp';
                break;
            case 'frame':
                res = 'newFrame';
                break;
            case 'model':
                res = 'newModel';
                break;
            case 'transformer':
                res = 'newTransformer';
                break;
            default:
                this.error('Unknown type ' + type);
                break;

        }
        return res;
    },
    newApp: function (name) {
        let info = "Privacy info: neoan-cli needs internet connectivity. Next to connections to npm, packagist & github, a new app will be sending a call to neoan.us.\n";
        info += "The only data sent is the name of the application so we can count neoan3 applications. NO OTHER DATA will be transmitted nor tracked. Is that ok?";
        let questions = [{name:'internet',message:info,type:'confirm'}];
        if(typeof name === 'undefined'){
            let rootWarning = 'You did not provide a name for this app. neoan3 assumes you will run this app under the web-root. ' +
                'If this is not the case, please stop here and rerun "neoan3 new app DIRECTORY-NAME". Do you want to continue?';
            questions.push({name:'root',message:rootWarning,type:'confirm'});
        }
        inquirer.prompt(questions).then((answer)=>{
            if(typeof answer.root !== 'undefined' && !answer.root){
                console.log('Exiting');
                process.exit(1);
            }
            if(answer.internet){
                calls.get('neoan.us','/capture.php?name='+name);
                progressBar.start();
                console.log('Fetching remote files...');
                let msg = 'Download completed, running composer...\n';
                download('sroehrl/neoan3', './', function (err) {
                    console.log(err ? 'Could not download' : msg);
                    console.log('NOTE: I am trying to run composer synchronously & quiet. If this fails, please run "composer install"');
                    fileCreator.htaccess(name);
                    execute('composer install --quiet', (error, stdout, stderr) => {
                        if (error) {
                            console.log('Failed to run composer. Please do so manually.');
                            process.exit(1);
                        }

                    });
                    progressBar.stop();
                    console.log('All done. In most setups running "npm install" is a good idea now...');
                });
            } else {
                console.log('Exiting');
                process.exit(1);
            }
        })

    },
    newFrame: function (name) {
        this.testEnvironment();
        fileCreator.frame(name);
    },
    newModel: function (name) {
        fs.stat('./model', function (err, stats) {
            if (err) {
                concr.error('Are we in the wrong directory, or is this not a neoan3 instance?');
            }
            fileCreator.model(name);
        })
    },
    newTransformer: function(name) {
        this.testEnvironment();
        fileCreator.transformer(name);
    },
    newComponent: function (name) {
        this.testEnvironment();
        let frames = fs.readdirSync('./frame');
        if(frames.length<1){
            frames = ['NO FRAME INSTALLED'];
        }
        let frameChoice = {
            name: 'frame',
            type: 'list',
            choices: frames,
            message: 'Which frame are you using?',
            when: function (answers) {
                return answers.useFrame === true || answers.purpose === 'API endpoint'
            }
        };



        let componentTypeQuestions = [
            {
                name: 'purpose',
                type: 'list',
                choices: ['Route component', 'API endpoint', 'Custom Element'],
                message: 'This component mainly serves as:'
            },
            {
                name: 'hasView',
                type: 'confirm',
                message: 'Do you want to create a view?',
                default: true,
                when:function(answers){
                    return answers.purpose === 'Route component'
                }
            },
            {
                name: 'useFrame',
                type: 'confirm',
                message: 'do you want to use a frame?',
                default:true,
                when: function (answers) {
                    return answers.purpose === 'Route component'
                }
            }, frameChoice
        ];
        inquirer.prompt(componentTypeQuestions).then(function (answer) {
            let asIdentifier;
            switch (answer.purpose) {
                case 'Route component':
                    asIdentifier = 'route';
                    if (answer.frame === 'NO FRAME INSTALLED') {
                        answer.frame = false;
                    }
                    fileCreator.component(name, asIdentifier,answer);
                    break;
                case 'API endpoint':
                    asIdentifier = 'api';
                    if (answer.frame === 'NO FRAME INSTALLED') {
                        concr.error('You cannot create an API endpoint without a frame.');
                    }
                    fileCreator.component(name, asIdentifier, answer);

                    break;
                default:
                    fileCreator.component(name, 'custom');
                    break;
            }

        },function(err){
            this.error('Execution failed');
        });


    },
    testEnvironment:function(){
        let wrong = false;
        fs.stat('./component', function (err, stats) {
            if(err) wrong = true;
        });
        fs.stat('./frame', function (err, stats) {
            if(err) wrong = true;
        });

        if(wrong){
            this.error('Not a neoan3 environment. Wrong directory?')
        }
    },
    error: function (er) {
        console.log(er || 'unknown command');
        process.exit(1);
    }
};

module.exports = concr;
