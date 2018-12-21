#!/usr/bin/env node
'use strict';
const program = require('commander');
const fs = require('fs');
let dir ='./';

program
    .version('0.0.2','-v, --version')
    .option('-h, --help','option description')
    .option('-c, --component <componentname>', 'create component')
    .arguments('<cmd> [name]')
    .action(executer)
    .parse(process.argv);
function executer(cmd,name){
    if(typeof cmd !== 'undefined'){
        switch(cmd){
            case 'component':
                if(typeof name === 'undefined'){
                    error('missing component name');
                } else {
                    newComponent(name)
                }
                break;
            default: error();
        }


    }
}

function versionJson(name){
    let json = {"version":"0.0.1","name":name};
    return JSON.stringify(json);
}
function error(er){
    console.log(er||'unknown command');
    process.exit(1);
}
function newComponent(name){
    let folder = dir+'component/'+name;
    if (!fs.existsSync(folder)){
        fs.mkdirSync(folder);
        fs.appendFile(dir+'component/'+name+'/version.json',versionJson(name),function(err){
            if (err) throw err;
            console.log('created component %s',name);
        });
    } else {
        console.log('Component %s already exists',name);
    }
}