const inquirer = require('inquirer');
const fs = require('fs');
const databaseQuestions = require('./database.questions.js');

module.exports = {
    credentials:{
        database:{}
    },
    flush(type,name){
        if(typeof name !== 'undefined'){
            delete this.credentials[type][name];
        } else {
            this.credentials[type] = {};
        }
    },
    readFile(){
        if(fs.existsSync(__dirname + '/userVars.json')){
            this.credentials = JSON.parse(fs.readFileSync(__dirname +
                '/userVars.json', 'utf8'));
        } else {
            this.writeFile();
        }
    },
    async writeFile(){
        await fs.writeFile(__dirname + '/userVars.json',
            JSON.stringify(this.credentials, null, 4),
            function (err) {
                if (err) throw err;
            });
    },
    async selectCredentials(type){
        let choices = Object.keys(this.credentials[type]);
        choices.push('new');
        let answer = await inquirer.prompt({
            name:'selected',
            type:'list',
            choices: choices
        });
        if(answer.selected !== 'new'){
            return this.credentials[type][answer.selected];
        } else {
            let returnCredentials;
            switch (type) {
                case 'database': returnCredentials = this.newDatabase(); break;
            }
            return returnCredentials;
        }
    },
    async newDatabase(){
        let newCredentials = await inquirer.prompt(databaseQuestions);
        this.credentials.database[newCredentials.name+'@'+newCredentials.host] = newCredentials;
        this.writeFile();
        return newCredentials;
    }

};
