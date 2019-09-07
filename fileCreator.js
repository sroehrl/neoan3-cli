const fs = require('fs-extra');
let dir = './';
let fileEndings = ['php','html','js'];
let fileCreator = {
    create: function (type, name, specify) {
        if (this.directoryManager.folder(type, this.flcase(name))) {
            this.directoryManager.version(type, this.flcase(name),specify);
            console.log('writing...');
            return true;
        } else if(typeof specify !== 'undefined'){
            if(specify !== 'custom' && fs.existsSync(dir + type + '/' + this.flcase(name)+'/'+this.fucase(name)+'.ctrl.php')){
                console.log('I don\'t dare to create such a hybrid. Please proceed manually.');
            } else {
                if(this.modifyVersion(name,type)){
                    console.log('writing...');
                    return true;
                } else {
                    console.log('Uh, I am afraid to overwrite important stuff. Please proceed manually.');
                }
            }

        }
        return false;
    },
    frame: function (name) {
        if (this.create('frame', name)) {
            let template = this.template('frame');
            if(typeof template.php !== 'undefined'){
                this.php.fileString = template.php.replace(/\{\{name\}\}/g,name);
            } else{
                this.php.namespace('Frame');
                this.php.use('Core\\Serve');
                this.php.class(name, 'Serve');
                this.php.closingCurly();
            }
            this.writeToFile(name, 'frame');
        }
    },
    model: function (name) {
        if (this.create('model', name)) {
            let template = this.template('model');
            if(typeof template.php !== 'undefined'){
                this.php.fileString = template.php.replace(/\{\{name\}\}/g,name+'Model');
            } else {
                this.php.namespace('Model');
                this.php.class(name+'Model', 'IndexModel');
                this.php.classFunction('byId', '', '$id', 'static');
                this.php.classFunction('find', '', '$condition', 'static');
                this.php.closingCurly();
            }
            this.writeToFile(name, 'model');
            fs.appendFile(dir + '/model/' + this.flcase(name) + '/migrate.json', '{}', function (err) {
                if (err) throw err;
            });
        }
    },
    component: function (name, cType, answer) {
        if (this.create('component', name, cType)) {
            let template = {}, propagatePHP = true;
            this.php.namespace('Components');

            switch (cType) {
                case 'route':
                    template = this.template('route');

                    this.php.use('Core\\Unicore');
                    this.php.class(name, 'Unicore');
                    let inner = "$this->uni()->";
                    if (answer.frame) {
                        inner = "$this->uni('" + answer.frame + "')->";
                    }
                    if (answer.hasView) {
                        this.htmlView(name);
                        inner += "hook('main','" + this.flcase(name) + "')->";
                    }
                    this.php.classFunction('init', inner + "output();");
                    this.php.closingCurly();
                    if(typeof template.php !== 'undefined'){
                        this.php.fileString = template.php
                            .replace(/\{\{name\}\}/g,this.fucase(name));
                        if (answer.frame) {
                            this.php.fileString = this.php.fileString.replace(/\{\{frame\}\}/g,this.fucase(answer.frame))
                        }
                    }
                    break;
                case 'api':
                    template = this.template('api');
                    this.php.use('Frame\\' + this.fucase(answer.frame));
                    this.php.class(name, this.fucase(answer.frame));
                    this.php.classFunction('get' + this.fucase(name), "", "array $body");
                    this.php.classFunction('post' + this.fucase(name), "", "array $body");
                    this.php.closingCurly();
                    if(typeof template.php !== 'undefined'){
                        this.php.fileString = template.php
                            .replace('{{name}}',this.fucase(name))
                            .replace('{{frame}}',this.fucase(answer.frame));
                    }
                    break;
                case 'custom':
                    propagatePHP = false;
                    this.ce.write(name);
                    break;
            }

            if(propagatePHP){
                this.writeToFile(name, 'component');
            }
        }

    },
    template:function(fileType){
        let file, templates = {};
        fileEndings.forEach(fileEnding =>{
            file = dir + '_template/' + fileType + '.' + fileEnding;
            if(fs.existsSync(file)){
                console.log('using %s-template...', fileEnding);
                templates[fileEnding] = fs.readFileSync(file,'utf8');
            }
        });
        return templates;
    },
    ce: {
        getTemplates: function(){
            return fileCreator.template('ce')
        },
        write: function (name) {
            let content = '', identifier = '.ce.', templates = this.getTemplates();
            let targetFolder = dir + 'component/' + fileCreator.flcase(name) + '/';
            fileEndings.forEach(fileEnding =>{
                if(typeof templates[fileEnding] === 'undefined' && fileEnding === 'js'){
                    fs.appendFile(targetFolder + fileCreator.flcase(name) +'.ce.js', '', function (err) {
                        if (err) throw err;
                    });
                } else if(typeof templates[fileEnding] !== 'undefined'){
                    content = templates[fileEnding].replace(/\{\{name\}\}/g,name);
                    if(fileEnding === 'php'){
                        identifier = '.ctrl.';
                    }
                    fs.appendFile(targetFolder + fileCreator.flcase(name) + identifier +fileEnding, content, function (err) {
                        if (err) throw err;
                    });
                }
            });
        }
    },
    php: {
        fileString: false,
        init: function () {
            if (!this.fileString) {
                this.fileString = "<?php\n/* Generated by neoan3-cli */\n\n";
            }
        },
        indentation: function (x) {
            this.fileString += "    ".repeat(x);

        },
        namespace: function (type) {
            this.init();
            this.fileString += "namespace Neoan3\\" + type + ";\n\n";
        },
        use: function (str) {
            this.init();
            this.fileString += "use Neoan3\\" + str + ";\n"
        },
        class: function (name, extend) {
            this.init();
            this.fileString += "\nclass " + fileCreator.fucase(name);
            if (typeof extend !== 'undefined') {
                this.fileString += " extends " + fileCreator.fucase(extend);
            }
            this.fileString += "\n{\n";
        },
        classFunction: function (name, inner, arg, typus = 'public') {
            this.init();
            this.indentation(1);
            if (typus === 'public') {
                this.publicFunction(name, arg);
            } else if (typus === 'static') {
                this.staticFunction(name, arg);
            }
            this.indentation(2);
            this.fileString += inner + "\n";
            this.indentation(1);
            this.closingCurly();
            this.fileString += "\n";
        },
        staticFunction: function (fname, arg) {
            this.init();
            this.fileString += "static function " + fname + "(" + (arg ? arg : '') + ")\n";
            this.fileString += "    {\n";
        },
        publicFunction: function (fname, arg) {
            this.init();
            this.fileString += "function " + fname + "(" + (arg ? arg : '') + ")\n";
            this.fileString += "    {\n";
        },
        closingCurly: function () {
            this.fileString += "}\n";
        }
    },
    htmlView: function (name) {
        let content = '<h1>{{name}}</h1>', template = this.template('view');
        if(typeof template.html !== 'undefined'){
            content = template.html;
        }

        content = content.replace(/\{\{name\}\}/g,name);

        fs.writeFile(dir + 'component/' + this.flcase(name) + '/' + this.flcase(name) + '.view.html', content, function (err, outd) {
            if (err) {
                throw new Error(err);
            }
        });
    },
    htaccess: function (base) {
        let content = fs.readFileSync('./.htaccess', 'utf8');
        let newContent = content.replace(/RewriteBase\s\/[a-z0-9\/-]+/im, function (x) {
            return 'RewriteBase /' + base + '/';
        });
        fs.writeFile('./.htaccess', newContent, function (err, outd) {
            if (err) {
                throw new Error(err);
            }
        });

    },
    writeToFile: function (name, type) {
        let localExt;
        switch (type) {
            case 'component':
                localExt = '.ctrl.php';
                break;
            case 'model':
                localExt = '.model.php';
                break;
            default:
                localExt = '.php';
                break;
        }
        let loType = this.fucase(type);
        fs.appendFile(dir + type + '/' + this.flcase(name) + '/' + fileCreator.fucase(name) + localExt, this.php.fileString, function (err) {
            if (err) throw err;
            console.log('%s %s created', loType, name);
        });
    },
    fucase: function (string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },
    flcase: function (string) {
        return string.charAt(0).toLowerCase() + string.slice(1);
    },
    directoryManager: {
        folder: function (type, name) {
            if (!fs.existsSync(dir + type + '/' + name)) {
                fs.mkdirSync(dir + type + '/' + name);
                return true;
            } else {
                console.log('Notice: %s %s already exists', type, name);
                return false;
            }
        },
        version: function (type, name, specify) {
            fs.appendFile(dir + type + '/' + name.toLowerCase() + '/version.json', fileCreator.versionJson(name,type,specify), function (err) {
                if (err) throw err;
            });
        }
    },
    modifyVersion: function(name,type){
        let version = JSON.parse(fs.readFileSync(dir + type + '/' + name.toLowerCase() + '/version.json','utf8'));
        if(typeof version.type !== 'undefined' && version.type === 'hybrid'){
            return false;
        }
        version.type = 'hybrid';
        fs.writeFile(dir + type + '/' + name.toLowerCase() + '/version.json', JSON.stringify(version, null, 4), function (err) {
            if (err) throw err;
        });
        return true;
    },
    versionJson: function (name,type,specify) {
        if(typeof specify !== 'undefined'){
            type = specify;
        }
        let json = {"version": "0.0.1", "name": name,"type":type};
        return JSON.stringify(json, null, 4);
    },
};
module.exports = fileCreator;
