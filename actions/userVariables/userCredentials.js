const inquirer = require('inquirer');
const fs = require('fs');
const databaseQuestions = require('./database.questions.js');
const tokenQuestions = require('./token.questions.js');

module.exports = {
    credentials:{
        database:{},
        token:{}
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
            let check = fs.readFileSync(__dirname +
                '/userVars.json', 'utf8');
            this.credentials = JSON.parse(fs.readFileSync(__dirname +
                '/userVars.json', 'utf8'));
        } else {
            this.writeFile();
        }
    },
    async writeFile(){
        let content = JSON.stringify(this.credentials, null, 4);
        try{
            await fs.writeFileSync(__dirname + '/userVars.json',
                content);
        } catch (e) {
            console.error(e)
        }

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
                case 'database': returnCredentials = await this.newDatabase(); break;
                case 'token': returnCredentials = await this.newToken(); break;
            }
            return returnCredentials;
        }
    },
    async newDatabase(){
        let newCredentials = await inquirer.prompt(databaseQuestions);
        this.credentials.database[newCredentials.name+'@'+newCredentials.host] = newCredentials;
        await this.writeFile();
        return newCredentials;
    },
    async newToken(){
        let newCredentials = await inquirer.prompt(tokenQuestions);
        this.credentials.token[newCredentials.name] = newCredentials;
        await this.writeFile();
        return newCredentials;
    }

};
