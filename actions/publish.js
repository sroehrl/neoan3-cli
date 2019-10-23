const fs = require('fs-extra');
const inquirer = require('inquirer');
const stringHelper = require('./stringHelper.js');
const calls = require('./calls.js');
const gift = require('gift');
const Publish = {
    currentType: '',
    currentFiles: [],
    async init(type, name) {
        if (!['model', 'frame', 'component'].includes(type)) {
            console.log('I cannot identify this command. Try:');
            console.log('neoan3 publish [model|frame|component] "name"');
            process.exit();
        }
        if (!fs.existsSync('./' + type + '/' + name)) {
            console.log(type + ' ' + name + ' does not exist');
            process.exit();
        }
        this.currentType = type;
        this.currentFiles = fs.readdirSync('./' + type + '/' + name);
        if (this.currentFiles.filter((fileName) => {
            return fileName === 'composer.js'
        }).length > 0) {
            console.log('This ' + type + ' contains a composer.json and ' +
                'might already be published.');
        }
        this.fileOperations.createComposerShell(type, name).then((composer) => {
            let path = './' + type + '/' + name + '/';
            switch (type) {
                case 'model':
                    path += stringHelper.fucase(name) + '.model.php';
                    break;
                case 'frame':
                    path += stringHelper.fucase(name) + '.php';
                    break;
                case 'component':
                    path += stringHelper.fucase(name) + '.ctrl.php';
                    break;
            }
            if (fs.existsSync(path)) {
                composer = this.fileOperations
                    .parseDependencies(path, composer);
            }
            fs.writeFileSync('./' + type + '/' + name + '/composer.json',
                JSON.stringify(composer,
                    null, 4),
                function (err, outd) {
                    if (err) {
                        throw new Error(err);
                    }
                });
            let gitQuestions = [
                {
                    name: 'create',
                    type: 'confirm',
                    message: 'Do you want neoan3-cli try to ' +
                        'create a GIT-repository for you?'
                }, {
                    name: 'github',
                    type: 'confirm',
                    message: 'neoan3-cli can try to set a remote on GitHub for you.' +
                        ' Do you want that?',
                    when: (answers) => {
                        return answers.create;
                    }
                }, {
                    name: 'gitType',
                    type: 'list',
                    choices: ['user', 'organisation'],
                    message: 'What kind of GitHub endpoint ' +
                        'are you targeting?',
                    when: (answers) => {
                        return answers.github;
                    }
                }, {
                    name: 'organisation',
                    type: 'input',
                    message: 'Name of your organisation.',
                    when: (answers) => {
                        return answers.gitType === 'organisation';
                    }
                }, {
                    name: 'username',
                    type: 'input',
                    message: 'Your GitHub username',
                    when: (answers) => {
                        return answers.github;
                    }
                }, {
                    name: 'repoName',
                    type: 'input',
                    message: 'Remote name (name on GitHub)',
                    when: (answers) => {
                        return answers.github;
                    }
                }, {
                    name: 'confirmationDialog',
                    type: 'confirm',
                    message: (answers) => {
                        return 'Please confirm that the targeted GitHub repository ' + answers.repoName + ' exists (if not, create it)'
                    },
                    when: (answers) => {
                        return answers.github;
                    }
                }
            ];
            inquirer.prompt(gitQuestions).then((answers) => {
                if (answers.create) {
                    this.gitOps('./' + type + '/' + name,
                        answers).then(() => {
                        console.log('Done. ');
                        process.exit();
                    })
                } else {
                    console.log('Done. ');
                    process.exit();
                }

            })


        })

    },
    gitOps(path, git) {
        return new Promise((resolve, reject) => {
            gift.init(path, false, function (err, repo) {
                if (err) {
                    throw new Error('something went wrong')
                }

                repo.add('.', (err) => {
                    if (err) {
                        throw new Error('19')
                    }
                    repo.commit('Initial commit by neoan3-cli', (err) => {
                        if (err) {
                            throw new Error(err)
                        }
                        if (git.github && git.confirmationDialog) {

                            repo.identity((err, actor) => {
                                if (err) {

                                    throw new Error(err)
                                }

                                repo.identify(actor, (err) => {
                                    if (err) {
                                        throw new Error(err)
                                    }
                                    let path = 'https://github.com/' +
                                        (
                                            git.gitType === 'organisation' ?
                                                git.organisation : git.username)
                                        + '/' + git.repoName + '.git';
                                    repo.remote_add('origin', path, (err) => {
                                        if (err) {
                                            throw new Error(err)
                                        }
                                        repo.remote_push('origin master',
                                            (err, out) => {
                                                if (err) {
                                                    throw new Error(err)
                                                }
                                                resolve(true);
                                            });
                                    });
                                })
                            })
                        }
                    })
                });
            })
        })
    },
    fileOperations: {
        parseDependencies(path, composer) {
            let content = fs.readFileSync(path, 'utf8');
            let includes = content.match(/^use\s+[^;]+/gm);
            if (null !== includes) {
                let parts;
                includes.forEach((include) => {
                    include = include.substring(4);
                    parts = include.split('\\');
                    if (parts[0] === 'Neoan3') {
                        switch (parts[1]) {
                            case 'Apps':
                                composer.require['neoan3-apps/' +
                                parts[2].toLowerCase()] = "dev-master";
                                break;
                            case 'Component':
                                composer.require['neoan3-component/' +
                                parts[2].toLowerCase()] = "dev-master";
                                composer
                                    .extra["installer-paths"]
                                    ["./component/{$name}"]
                                    .push('neoan3-component/' +
                                        parts[2].toLowerCase());
                                break;
                            case 'Frame':
                                composer.require['neoan3-frame/' +
                                parts[2].toLowerCase()] = "dev-master";
                                composer
                                    .extra["installer-paths"]
                                    ["./frame/{$name}"]
                                    .push('neoan3-frame/' +
                                        parts[2].toLowerCase());
                                break;
                        }
                    } else {
                        composer.require[parts[0].toLowerCase()
                        + parts[1].toLowerCase()] = "dev-master";
                    }
                })
            }
            return composer;
        },
        createComposerShell(type, name) {
            let template = this.composerTemplate;
            return new Promise((resolve, reject) => {
                let questions = [
                    {
                        name: 'name',
                        type: 'input',
                        message: 'Name',
                        default: 'custom-' + type + '/' + name,
                        validate: function (input) {
                            return input.match(/\//) !== null ? true :
                                'Must be vendor/package format'
                        }
                    },
                    {
                        name: 'description',
                        type: 'input',
                        message: 'description'
                    },
                    {
                        name: 'license',
                        type: 'input',
                        message: 'License',
                        default: 'MIT'
                    }
                ];
                inquirer.prompt(questions).then((answers) => {
                    Object.keys(answers).forEach((answer) => {
                        template[answer] = answers[answer];
                    });
                    resolve(template);
                })
            })

        },
        composerTemplate: {
            name: '',
            description: '',
            "minimum-stability": 'dev',
            require: {
                "mnsami/composer-custom-directory-installer": "1.1.*"
            },
            license: '',
            extra: {
                "installer-paths": {
                    "./frame/{$name}": [],
                    "./model/{$name}": [],
                    "./component/{$name}": []
                }
            }
        }
    }

};
module.exports = Publish;
