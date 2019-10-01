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
    }
};
module.exports = stringHelper;
