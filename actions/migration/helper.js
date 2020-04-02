const fs = require('fs');

let dir = './';

const migrateHelper = {
    keyMatch(key){
        switch (key) {
            case 'PRI':
                return 'primary';
            case 'UNI':
                return 'unique';
            case 'MUL':
                return 'index';
            case 'primary':
                return 'PRIMARY KEY';
            case 'unique':
                return 'UNIQUE';
            case 'index':
                return 'KEY';
            default:
                return false;
        }
    },
    async asyncLoop(array, callback){
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    },
    compare: {
        mysqlConnection:false,
        knownModels: {},
        knownTables: {},
        compareUp: function (distinct) {
            let queries = [];
            Object.keys(this.knownModels).forEach((model) => {
                if(typeof distinct === 'undefined' || distinct === model){
                    Object.keys(this.knownModels[model]).forEach((table) => {
                        if (typeof this.knownTables[table] === 'undefined') {
                            queries.push(this.createTableSql(table, model));
                        } else {
                            queries = queries.concat(
                                this.deepComparison(table, model)
                            );
                        }
                    })
                }

            });
            return queries;
        },
        compareDown: function () {
            let present = {};
            Object.keys(this.knownModels).forEach((model) => {

                Object.keys(this.knownTables).forEach((table) => {
                    if (table.startsWith(model)) {
                        present[table] = true;
                        if (typeof this
                            .knownModels[model][table] === 'undefined') {
                            this.knownModels[model][table] = {};
                        }
                        this.knownModels[model][table] =
                            this.knownTables[table];
                    }
                });
                Object.keys(this.knownModels[model]).forEach((modelTable) => {
                    if (typeof present[modelTable] === 'undefined') {
                        delete this.knownModels[model][modelTable];
                    }
                })
            })
        },
        deepComparison: function (table, model) {
            let queries = [];
            Object.keys(this.knownModels[model][table]).forEach((field, i) => {
                let queryString = 'ALTER TABLE `' + table + '` ';
                // does field exist in db?
                if (typeof this.knownTables[table][field] === 'undefined') {
                    queryString += 'ADD COLUMN `' + field + '` ' + this
                        .knownModels[model][table][field].type;
                    if (i > 0) {
                        queryString += ' AFTER `' + Object.keys(this
                            .knownModels[model][table])[i - 1] + '`';

                    }
                    queryString += ";\n";
                    queries.push(queryString);
                } else if (this.knownTables[table][field].type !== this
                    .knownModels[model][table][field].type) {
                    queryString += 'MODIFY COLUMN `' + field + '` ' +
                        this.knownModels[model][table][field].type + ";\n";
                    queries.push(queryString)
                } else if (this.knownTables[table][field].key !== this
                    .knownModels[model][table][field].key) {
                    // drop?
                    if (this.knownTables[table][field].key) {
                        queries.push(queryString + ' DROP INDEX `' +
                            field + '`;' + "\n");
                    }
                    if (this.knownModels[model][table][field].key) {
                        queryString += ' ADD ' + migrateHelper.keyMatch(this
                                .knownModels[model][table][field].key) +
                            '(`' + field + '`)';
                        queries.push(queryString + "\n");
                    }

                }

            });

            return queries;
        },
        createTableSql: function (table, model) {
            let createString = 'CREATE TABLE `' + table + '`(';
            let keys = [];
            Object.keys(this.knownModels[model][table]).forEach((field) => {
                createString += '`' + field + '` ' + this
                    .knownModels[model][table][field].type;
                createString += this
                    .knownModels[model][table][field]
                    .nullable ? ' ' : ' NOT NULL';
                createString += this
                    .knownModels[model][table][field]
                    .a_i ? ' AUTO_INCREMENT' : ' ';
                createString += "\n,";
                if (this.knownModels[model][table][field].key) {
                    keys.push({
                        field: field,
                        type: this.knownModels[model][table][field].key
                    })
                }
            });
            keys.forEach((key) => {
                createString += migrateHelper.keyMatch(key.type);
                createString += '(' + key.field + ')' + "\n,";
            });
            createString = createString.substring(0,
                createString.length - 1) + ');';
            return createString;
        },
        describeTable: async function (tableName) {
            let fields = await this.mysqlConnection.query('DESCRIBE ' + tableName);
            this.knownTables[tableName] = {};
            let currField;
            await migrateHelper.asyncLoop(fields, async (field) => {
                currField = {
                    type: field.Type,
                    key: migrateHelper.keyMatch(field.Key),
                    nullable: field.Null !== 'NO',
                    default: field.Default || false,
                    a_i: field.Extra === 'auto_increment'
                };

                this.knownTables[tableName][field.Field] = currField;
            });
        },
        getFullDb: function (credentials) {
            return new Promise((resolve, reject) => {
                migrateHelper.compare.mysqlConnection.query('SHOW TABLES', (err, results, fields) => {
                    if (err) throw err;
                    let done = migrateHelper.asyncLoop(results, async (res) => {
                        await this.describeTable(res['Tables_in_'
                        + credentials.name]);
                    });
                    resolve(done);
                })
            })
        },
        getModelJsons: function () {
            let modelPath = dir + '/model';
            fs.readdirSync(modelPath).forEach((folder) => {
                if (folder !== 'index' && fs.lstatSync(modelPath +
                    '/' + folder).isDirectory() && fs
                    .existsSync(modelPath + '/' + folder + '/migrate.json')) {
                    this.knownModels[folder] = JSON
                        .parse(fs.readFileSync(modelPath + '/' + folder +
                            '/migrate.json', 'utf8'))
                }

            });
        }
    },
};
module.exports = migrateHelper;