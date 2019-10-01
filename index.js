#!/usr/bin/env node
'use strict';
const program = require('commander');
const concr = require('./concr');

program
    .version(concr.getCurrentVersion(), '-v, --version')
    .arguments('<cmd> [type] [name] [extra]')
    .action(concr.executer)
    .parse(process.argv);
