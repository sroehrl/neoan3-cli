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
    produceStructure(name, indentation) {
        let json = fs.readJsonSync('./model/' +
            stringHelper.flcase(name) + '/migrate.json');
        Object.keys(json).forEach(key => {
            // key == model ? main
            if (key === stringHelper.camel2snake(stringHelper.flcase(name))) {
                transformer
                    .structureString += `\n${indentation}'${key}' => [],`;
            } else {
                transformer.structureString += `\n${indentation}'${key}' =>
                [\n${indentation.repeat(2)}'depth' =>
                'many'\n${indentation.repeat(2)}],`
            }
        });
        return transformer.structureString + `\n${indentation}]`;
    }
};
module.exports = transformer;
