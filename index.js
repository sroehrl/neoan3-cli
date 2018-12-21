#!/usr/bin/env node
'use strict';
const program = require('commander');
program
    .version('0.0.1')
    .option('-h, --help','option description')
    .option('-c, --component <componentname>', 'create component')
    .action(function(){
        if(program.componentname){
            console.log(program.component);
        }
    })
    .parse(process.argv);