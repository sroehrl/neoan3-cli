#!/usr/bin/env node
'use strict';
const program = require('commander');
const concr = require('./concr');

program
    .version('0.1.0','-v, --version')
    .arguments('<cmd> [type] [name]')
    .action(concr.executer)
    .parse(process.argv);
