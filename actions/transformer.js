const fs = require('fs-extra');
const stringHelper = require('./stringHelper.js');
const transformer = {
    check(name) {
        let modelFolder = fs.existsSync('./model/' + name);
        if (!modelFolder) {
            console.log('Model %s does not exists.', name);
            process.exit();
        }
        if (fs.existsSync('./model/' + stringHelper.flcase(name) + '/' +
            stringHelper.fucase(name) + '.transformer.php')) {
            console.log('Transformer already exists. ' +
                'Don\'t want to overwrite...');
            process.exit();
        }
        return true;
    },
    structureString: '[',
    produceStructure(name, indentation, offSetIndentation) {
        let json = fs.readJsonSync('./model/' +
            stringHelper.flcase(name) + '/migrate.json');
        Object.keys(json).forEach(key => {
            // key == model ? main
            if (key === stringHelper.camel2snake(stringHelper.flcase(name))) {
                // main
                Object.keys(json[key]).forEach(field =>{
                    transformer.structureString += transformer.fieldStructure(field, json[key][field],indentation,offSetIndentation)
                })
            } else {
                let requiredFields = transformer.requiredFields(json[key]);
                transformer.structureString += `\n${offSetIndentation}'${key}' =>[` +
                `\n${offSetIndentation}${indentation}'depth' => 'many',` +
                `\n${offSetIndentation}${indentation}'required_fields' => [${requiredFields}],` +
                `\n${offSetIndentation}],`
            }
        });
        let finalOffset = offSetIndentation.substring(0, offSetIndentation.length - indentation.length);
        return transformer.structureString + `\n${finalOffset}]`;
    },
    requiredFields(tableJson){
        let fieldString = '';
        Object.keys(tableJson).forEach(field =>{
            if(transformer.requiredCheck(tableJson[field])){
                fieldString += (fieldString === '' ? '' : ', ') + `'${field}'`;
            }
        });
        return fieldString;
    },
    fieldStructure(name, definition, indentation, offSetIndentation){
        let field = `\n${offSetIndentation}'${name}' => [`;
        if(transformer.requiredCheck(definition)){
            field += `\n${offSetIndentation}${indentation}'required' => true,`
        }
        field += `\n${offSetIndentation}],`;
        return field;
    },
    requiredCheck(definition){
        return !definition.nullable && !definition.default && definition.key !== 'primary';
    }
};
module.exports = transformer;
