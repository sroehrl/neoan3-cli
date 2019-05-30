const fs = require('fs');
const inquirer = require('inquirer');
const mysql = require('mysql');
const util = require('util');
let dir ='./';
let conn;

async function asyncLoop(array,callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

const migrate = {

    init:function(type,direction){
        switch (type) {
            case 'flush':
                this.flush();
                break;
            case 'models':
                this.models(direction);
                break;
            default: console.log('unknown migration command');
        }
    },
    flush:function(){
        fs.unlink(__dirname+'/userVars.json',(err)=>{
            if(err) throw err;
            console.log('credentials flushed');
        });
    },
    models:function(direction){
        this.ensure().then((credentials)=>{
            this.compare.getModelJsons();
            switch(direction){
                case 'down':
                    this.processDown(credentials);
                    break;
                case 'up':
                    this.processUp(credentials);
                    break;
                default: console.log(direction+'? This command is unknown to me.');
            }

        })
    },
    processUp:function(credentials){
        this.connect(credentials).then(()=>{
            this.compare.getFullDb(credentials).then(()=>{
                let queries = this.compare.compareUp();

                asyncLoop(queries,async(sql)=>{
                    try{
                        await conn.query(sql);
                    } catch (e) {
                        console.log('Error while writing to db');
                    }

                }).then(()=>{
                    console.log('I ran '+queries.length+' queries');
                    console.log('done');
                    process.exit();
                })


            })
        });
    },
    processDown:function(credentials){
        this.connect(credentials).then(()=>{
            this.compare.getFullDb(credentials).then(()=>{
                this.compare.compareDown();
                Object.keys(this.compare.knownModels).forEach((model)=>{
                    console.log('writing model: '+model);
                    this.writeJson(model);

                });
                console.log('done');
                process.exit()
            })

        });
    },
    writeJson:function(model){
        fs.writeFileSync(dir+'./model/'+model+'/migrate.json',JSON.stringify(this.compare.knownModels[model]),function(err,outd){
            if(err){
                throw new Error(err);
            }
        });
    },

    compare:{
        knownModels:{},
        knownTables:{},
        compareUp:function(){
            let queries = [];
            Object.keys(this.knownModels).forEach((model)=>{
                Object.keys(this.knownModels[model]).forEach((table)=>{
                    if(typeof this.knownTables[table] === 'undefined'){
                        queries.push(this.createTableSql(table,model));
                    } else {
                        queries = queries.concat(this.deepComparison(table,model));
                    }
                })
            });
            return queries;
        },
        compareDown:function(){
            Object.keys(this.knownModels).forEach((model)=>{
                Object.keys(this.knownTables).forEach((table)=>{
                    if(table.indexOf(model) !== -1){
                        // does table exist?
                        if(typeof this.knownModels[model][table] === 'undefined'){
                            this.knownModels[model][table] = {};
                        }
                        this.knownModels[model][table] = this.knownTables[table];
                    }
                })
            })
        },
        deepComparison:function(table,model){
            let queries = [];
            Object.keys(this.knownModels[model][table]).forEach((field,i)=>{
                let queryString = 'ALTER TABLE `'+table+'` ';
                // does field exist in db?
                if(typeof this.knownTables[table][field] === 'undefined'){
                    queryString += 'ADD COLUMN `'+field+'` '+this.knownModels[model][table][field].type;
                    if(i>0){
                        queryString += ' AFTER `'+Object.keys(this.knownModels[model][table])[i-1]+'`';

                    }
                    queryString += ";\n";
                    queries.push(queryString);
                } else if(this.knownTables[table][field].type !== this.knownModels[model][table][field].type){
                    queryString += 'MODIFY COLUMN `'+field+'` '+this.knownModels[model][table][field].type+";\n";
                    queries.push(queryString)
                }

            });
            return queries;
        },
        createTableSql:function(table,model){
            let createString = 'CREATE TABLE '+table+'(';
            let keys = [];
            Object.keys(this.knownModels[model][table]).forEach((field)=>{
                createString += '`'+field+'` '+this.knownModels[model][table][field].type;
                createString += this.knownModels[model][table][field].nullable ?' ':' NOT NULL';
                createString += this.knownModels[model][table][field].a_i ?' AUTO_INCREMENT':' ';
                createString += "\n,";
                if(this.knownModels[model][table][field].key){
                    keys.push({field:field,type:this.knownModels[model][table][field].key})
                }
            });
            keys.forEach((key)=>{
                createString += key.type === 'primary' ? 'PRIMARY KEY' : 'KEY';
                createString += '('+key.field+')'+"\n,";
            });
            createString = createString.substring(0,createString.length-1)+');';
            return createString;
        },
        describeTable:async function(tableName){
            let fields = await conn.query('DESCRIBE '+tableName);
            this.knownTables[tableName] = {};
            let currField;
            await asyncLoop(fields,async (field)=>{
                currField = {
                    type:field.Type,
                    key:field.Key !== ''?(field.Key==='PRI'?'primary':field.Key):false,
                    nullable:field.Null !== 'NO',
                    default:field.Default || false,
                    a_i:field.Extra === 'auto_increment'
                };

                this.knownTables[tableName][field.Field] = currField;
            });
        },
        getFullDb:function(credentials){
            return new Promise((resolve,reject)=>{
                conn.query('SHOW TABLES',(err,results,fields)=>{
                    if(err) throw err;
                    let done = asyncLoop(results,async(res)=>{
                        await this.describeTable(res['Tables_in_'+credentials.name]);
                    });
                    resolve(done);
                })
            })
        },
        getModelJsons:function(){
            let modelPath = dir+'/model';
            fs.readdirSync(modelPath).forEach((folder)=>{
                if(folder !== 'index' && fs.lstatSync(modelPath+'/'+folder).isDirectory()){
                    this.knownModels[folder] = JSON.parse(fs.readFileSync(modelPath+'/'+folder+'/migrate.json','utf8'))
                }

            });
        }
    },
    connect:async function(credentials){
        await this.connection(credentials).then((realCredentials)=>{
            conn = mysql.createConnection(realCredentials);
            conn.connect(function(err){
                if(err){
                    console.log('Unable to establish connection. Run "neoan3 migrate flush" to reset credentials');
                    process.exit();
                }
                console.log('Connection established');
            });
            conn.query = util.promisify(conn.query);
        })
    },
    connection:function(credentials){
        let config = {
            host     : credentials.host,
            user     : credentials.user,
            database : credentials.name
        };
        return new Promise(function (resolve,reject) {
            if(!credentials.savePw){
                inquirer.prompt([{name:'password',type:'password',message:'password',default:''}]).then(function(answers){
                    config.password = answers.password;
                    resolve(config);
                })
            } else {
                config.password = credentials.password;
                resolve(config);
            }
        });

    },
    ensure(){
        return new Promise(function(resolve,reject){
            if(!fs.existsSync(__dirname+'/userVars.json')){
                console.log('Neoan3-cli has no saved credentials');
                let questions = [
                    {name:'host',type:'input',message:'db host',default:'localhost'},
                    {name:'name',type:'input',message:'db name',default:'neoan'},
                    {name:'user',type:'input',message:'db user',default:'root'},
                    {name:'port',type:'input',message:'port',default:3306},
                    {name:'savePw',type:'confirm',message:'Save password?'},
                    {name:'password',type:'password',message:'db password',when:function(answers){
                        return answers.savePw;
                        }}

                ];
                inquirer.prompt(questions).then(function(answer){
                    fs.appendFile(__dirname+'/userVars.json',JSON.stringify(answer),function(err){
                        if (err) throw err;
                        resolve(answer);
                    });

                });
            } else {

                resolve(JSON.parse(fs.readFileSync(__dirname+'/userVars.json','utf8')));
            }
        })

    }
};
module.exports = migrate;
