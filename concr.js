const inquirer = require('inquirer');
const fs = require('fs');
const fileCreator = require('./fileCreator');
let concr = {

    executer:function(cmd, type, name){
        if(typeof cmd !== 'undefined'){
            switch(cmd){
                case 'new':
                    let func = concr.processType(type);
                    if(func){
                        if(typeof name === 'undefined'){
                            concr.error('missing component name');
                        } else {
                            concr[func](name)
                        }
                    }
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
            default: this.error('Unknown type %s',type);
                break;

        }
        return res;
    },


    newComponent:function(name){

            //
            let questions = [
                {name:'purpose',type:'list',choices:['Route component','API endpoint','Custom Element'],message:'This component mainly serves as:'},
                {name:'frame',type:'input',message:'Which frame are you using?'}
                ];
            inquirer.prompt(questions).then(function(answer){
                let asIdentifier;
                switch (answer.purpose) {
                    case 'Route component':
                        asIdentifier = 'route';
                        break;
                    case 'API endpoint':
                        inquirer.prompt([]);
                        asIdentifier = 'api';
                        break;
                }
                fileCreator.component(name,asIdentifier,answer.frame);
            });


            /*process.exit(1);
            fs.mkdirSync(folder);
            fs.appendFile(dir+'component/'+name+'/version.json',versionJson(name),function(err){
                if (err) throw err;
                console.log('created component %s',name);
            });*/

    },
    error:function(er){
        console.log(er||'unknown command');
        process.exit(1);
    }
};

module.exports = concr;