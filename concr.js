const inquirer = require('inquirer');
const fs = require('fs');
const fileCreator = require('./fileCreator');
const download = require('download-git-repo');
const execute = require('child_process').exec;
let concr = {

    executer:function(cmd, type, name){
        if(typeof cmd !== 'undefined'){
            switch(cmd){
                case 'new':
                    if(typeof type == 'undefined'){
                        concr.error('New what? Try again.')
                    }
                    let func = concr.processType(type);
                    if(func){
                        if(typeof name === 'undefined'){
                            concr.error('Yeah, so you wanna add a component name to that command, human!');
                        } else {
                            concr[func](name)
                        }
                    }
                    break;
                case 'help': console.log('Please refer to https://github.com/sroehrl/neoan3 for help. Currently, neoan3-cli has very limited possibilities.');
                    break;
                default: concr.error();
            }
        }
    },
    processType:function(type){
        let res;
        switch(type){
            case 'component':
                res = 'newComponent';
                break;
            case 'app':
                res = 'newApp';
                break;
            case 'frame':
                res = 'newFrame';
                break;
            default: this.error('Unknown type '+type);
                break;

        }
        return res;
    },
    newApp:function(name){
        let msg = 'Creating...\n';
        msg += 'Enter "'+name+'"';
        download('sroehrl/neoan3',name,function(err){
            console.log(err ? 'Could not download':msg)
        },function(success){
            execute('composer install',(error, stdout, stderr)=>{
                if(error){
                    this.error('Failed to run composer. Please do so manually.');
                }
                console.log('All done. In most setups running "npm install" is a good idea now...');
            });
        });
    },
    newFrame:function(name){
        fs.stat('./frame',function(err, stats){
            if(err){
                concr.error('Hey Stormtrooper, this is not the directory you are looking for. Navigate to the root of a neoan3 app!')
            } else {
                fileCreator.frame(name);
            }
        });
    },

    newComponent:function(name){
            // in a neoan3 app?
            fs.stat('./component',function(err, stats){
               if(err){
                   concr.error('Dude, I don\'t seem to be running on the root of a neoan3 app. Are you even in the right directory?')
               } else {
                   let frames = fs.readdirSync('./frame');

                   let questions = [
                       {name:'purpose',type:'list',choices:['Route component','API endpoint','Custom Element'],message:'This component mainly serves as:'}
                   ];
                   inquirer.prompt(questions).then(function(answer){
                       let asIdentifier;
                       switch (answer.purpose) {
                           case 'Route component':
                               asIdentifier = 'route';
                               fileCreator.component(name,asIdentifier);
                               break;
                           case 'API endpoint':
                               asIdentifier = 'api';
                               if(frames.length<1){
                                   this.error('I was gonna ask you which of your frames you want to use. But I find nothing, nada ...');
                               }
                               inquirer.prompt([{name:'frame',type:'list',choices:frames, message:'Which frame are you using?'}]).then(function(res){
                                   fileCreator.component(name,asIdentifier,res.frame);
                               });
                               break;
                           default:
                               fileCreator.component(name,'custom');
                               break;
                       }

                   });
               }
            });


    },
    error:function(er){
        console.log(er||'unknown command');
        process.exit(1);
    }
};

module.exports = concr;
