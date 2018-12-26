#!/usr/bin/env node
'use strict';
const program = require('commander');
const concr = require('./concr');

program
    .version('0.0.2','-v, --version')
    .option('-h, --help','option description')
    .option('-c, --component <componentname>', 'create component')
    .arguments('<cmd> <type> [name]')
    .action(concr.executer)
    .parse(process.argv);
