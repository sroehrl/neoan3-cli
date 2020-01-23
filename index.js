#!/usr/bin/env node
'use strict';
const program = require('commander');
const concr = require('./concr');

program
    .version(concr.getCurrentVersion(), '-v, --version')
    .arguments('<cmd> [type] [name] [extra]')
    .option('-n, --name <name>','External scripts: provide name')
    .option('-t, --token <token>','External scripts: provide token')
    .action(concr.executer)
    .parse(process.argv);
