#!/usr/bin/env node
'use strict';
const program = require('commander');
const fs = require('fs');
let dir ='./';
function versionJson(name){
    return {"version":"0.0.1","name":name};
}
program
    .version('0.0.1','-v, --version')
    .option('-h, --help','option description')
    .option('-c, --component <componentname>', 'create component')

    .parse(process.argv);
if(program.component){
    let folder = dir+'component/'+program.component;
    if (!fs.existsSync(folder)){
        fs.mkdirSync(folder);
        fs.appendFile(dir+'component/'+program.component+'/version.json',versionJson(program.component),function(err){
            if (err) throw err;
            console.log('created component %s',program.component);
        });
    } else {
        console.log('Component %s already exists',program.component);
    }

}