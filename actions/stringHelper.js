const stringHelper = {
    fucase: function (string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },
    flcase: function (string) {
        return string.charAt(0).toLowerCase() + string.slice(1);
    },
    camel2snake: function (string) {
        return string.replace(/\.?([A-Z])/g, function (x, y) {
            return "_" + y.toLowerCase()
        }).replace(/^_/, "")
    },
    embrace(templateString, substitutions){
        Object.keys(substitutions).forEach(key => {
            let ops = [];
            ['', '\.pascal', '\.camel', '\.lower'].forEach(transform =>{
                ops.push('\{\{' + key + transform + '\}\}')
            });
            templateString = templateString
                .replace(new RegExp(ops[0],'g'), stringHelper.fucase(substitutions[key]))
                .replace(new RegExp(ops[1],'g'), stringHelper.fucase(substitutions[key]))
                .replace(new RegExp(ops[2],'g'), stringHelper.flcase(substitutions[key]))
                .replace(new RegExp(ops[3],'g'), substitutions[key].toLowerCase());
        });

        return templateString;
    }
};
module.exports = stringHelper;
