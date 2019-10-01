const fs = require('fs-extra');
const inquirer = require('inquirer');
let credentialsFolder = '../../../../credentials';
let CredentialHandler = {
    credentialObj: {},
    propertyOptions: ['create new', 'exit', 'save & exit'],
    init: () => {
        fs.ensureDirSync(credentialsFolder, err => {
            if (err) {
                console.log('Cannot access or write on this level.');
                process.exit();
            }

        });
        let credentialObj = fs.existsSync(credentialsFolder
            + '/credentials.json');
        if (credentialObj) {
            CredentialHandler.credentialObj = fs
                .readJsonSync(credentialsFolder + '/credentials.json');
        }
        CredentialHandler.topLevel();
    },
    topLevel: () => {
        let options = [];
        Object.keys(CredentialHandler.credentialObj).forEach(topic => {
            options.push(topic);
        });
        options = options.concat(['create new', 'exit', 'save & exit']);
        let questions = [
            {
                type: 'list',
                name: 'choice',
                message: 'Which credentials do you want to edit or view?',
                'choices': options
            },
            {
                type: 'input', name: 'name', message: 'How do you want to ' +
                    'call these credentials?', when: (answer) => {
                    return answer.choice === 'create new'
                }
            },
        ];

        inquirer.prompt(questions).then(answers => {
            let topic = answers.choice;
            if (answers.choice === 'create new') {
                CredentialHandler.credentialObj[answers.name] = {};
                topic = answers.name;
            } else if (answers.choice === 'save & exit') {
                CredentialHandler.save();
                process.exit();
            } else if (answers.choice === 'exit') {
                process.exit();
            }
            CredentialHandler.display(topic);
            Object.keys(CredentialHandler.credentialObj[topic])
                .forEach(property => {
                    CredentialHandler.propertyOptions
                        .push('modify ' + property);
                });
            CredentialHandler.modify(topic)

        });
    },
    display: (topic) => {
        let existingProperties = Object.keys(CredentialHandler
            .credentialObj[topic]);
        if (existingProperties.length > 0) {
            console.log('\n#####################################');
            console.log('Current values of "%s":\n', topic);
            existingProperties.forEach(property => {
                console.log('   ' + property + ': ' + CredentialHandler
                    .credentialObj[topic][property]);
            });
            console.log('\n#####################################\n');
        }

    },
    modify: (topic) => {
        let questions = [
            {
                type: 'list',
                name: 'choice',
                message: 'Which property do you want to edit?',
                'choices': CredentialHandler.propertyOptions
            },
            {
                type: 'input',
                name: 'name',
                message: 'Name of property',
                when: (answer) => {
                    return answer.choice === 'create new'
                }
            },
            {
                type: 'input',
                name: 'value',
                message: 'Enter value',
                when: (answer) => {
                    return answer.choice.startsWith('modify') ||
                        answer.choice === 'create new'
                }
            },
        ];
        inquirer.prompt(questions).then(res => {
            // modify boolean or number
            if (!isNaN(res.value)) {
                res.value = +res.value;
            } else {
                res.value = (res.value === 'true' ? true :
                    (res.value === 'false' ? false : res.value));
            }
            if (res.choice.startsWith('modify')) {
                CredentialHandler.credentialObj[topic][res.choice
                    .substring('modify '.length)] = res.value;
                CredentialHandler.display(topic);
                CredentialHandler.modify(topic);
            } else if (res.choice === 'create new') {
                CredentialHandler.propertyOptions.push('modify ' + res.name);
                CredentialHandler.credentialObj[topic][res.name] = res.value;
                CredentialHandler.display(topic);
                CredentialHandler.modify(topic);
            } else if (res.choice === 'save & exit') {
                CredentialHandler.save();
                process.exit();
            } else {
                CredentialHandler.topLevel();
            }
        })
    },
    save: () => {
        fs.outputJsonSync(credentialsFolder + '/credentials.json',
            CredentialHandler.credentialObj);
    }
};
module.exports = CredentialHandler;
