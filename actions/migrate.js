const fs = require('fs');
const userCredentials = require('./userVariables/userCredentials.js');
const migrateHelper = require('./migration/helper.js');
const mysqlConnection = require('./migration/mysqlConnection.js');
let dir = './';


const migrate = {

    init: function (type, nameDirection, direction) {
        switch (type) {
            case 'flush':
                userCredentials.flush('database', nameDirection);
                break;
            case 'model':
                this.model(nameDirection,direction);
                break;
            case 'models':
                this.models(nameDirection);
                break;
            case 'config':
                this.ensure().then(x => console.table(x));
                break;
            default:
                console.log('unknown migration command');
        }
    },
    model: function(model, direction){
        this.ensure().then((credentials) => {
                migrateHelper.compare.getModelJsons();
                switch (direction) {
                    case 'down':
                        this.processDown(credentials, model);
                        break;
                    case 'up':
                        this.processUp(credentials, model);
                        break;
                    default:
                        console.log(direction + '? This command is unknown to me.');
                }
        });
    },
    models: function (direction) {
        this.ensure().then((credentials) => {
            migrateHelper.compare.getModelJsons();
            switch (direction) {
                case 'down':
                    this.processDown(credentials);
                    break;
                case 'up':
                    this.processUp(credentials);
                    break;
                default:
                    console.log(direction + '? This command is unknown to me.');
            }

        })
    },
    processUp: function (credentials, distinct) {
        mysqlConnection.connect(credentials).then((connection) => {
            migrateHelper.compare.mysqlConnection = connection;
            migrateHelper.compare.getFullDb(credentials).then(() => {
                let queries = migrateHelper.compare.compareUp(distinct);

                migrateHelper.asyncLoop(queries, async (sql) => {
                    try {
                        await connection.query(sql);
                    } catch (e) {
                        console.log('Possible error while writing to db:');
                        console.log(sql);
                    }

                }).then(() => {
                    console.log('I ran ' + queries.length + ' queries');
                    console.log('done');
                    process.exit();
                })
            })
        });
    },
    processDown: function (credentials, distinct) {
        mysqlConnection.connect(credentials).then((connection) => {
            migrateHelper.compare.mysqlConnection = connection;
            migrateHelper.compare.getFullDb(credentials).then(() => {
                migrateHelper.compare.compareDown();
                Object.keys(migrateHelper.compare.knownModels).forEach((model) => {
                    if(typeof distinct === 'undefined' || distinct === model){
                        console.log('writing model: ' + model);
                        this.writeJson(model);
                    }
                });
                console.log('done');
                process.exit()
            })

        });
    },
    writeJson: function (model) {
        fs.writeFileSync(dir + './model/' + model + '/migrate.json',
            JSON.stringify(migrateHelper.compare.knownModels[model]),
            function (err, outd) {
                if (err) {
                    throw new Error(err);
                }
            });
    },
    async ensure() {
        await userCredentials.readFile();
        return await userCredentials.selectCredentials('database');
    },

};
module.exports = migrate;
