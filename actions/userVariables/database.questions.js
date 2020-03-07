module.exports = [
    {
        name: 'host',
        type: 'input',
        message: 'db host',
        default: 'localhost'
    },
    {
        name: 'name',
        type: 'input',
        message: 'db name',
        default: 'neoan'
    },
    {
        name: 'user',
        type: 'input',
        message: 'db user',
        default: 'root'
    },
    {
        name: 'port',
        type: 'input',
        message: 'port',
        default: 3306
    },
    {
        name: 'savePw',
        type: 'confirm',
        message: 'Save password?',
        default: true
    },
    {
        name: 'password',
        type: 'password',
        message: 'db password',
        when: function (answers) {
            return answers.savePw;
        }
    }
];