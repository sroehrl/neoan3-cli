module.exports = [
    {
        name: 'name',
        type: 'input',
        message: 'Name your token'
    },
    {
        name: 'token',
        type: 'input',
        message: 'Your token'
    },
    {
        name: 'type',
        type: 'list',
        message: 'Token prefix',
        default: 'Bearer',
        choices:['Bearer', 'token']
    }
];