let runner;
const go = function (amount) {
    process.stdout.write('[');
    runner = setInterval(() => {
        process.stdout.write("=");
    }, 500);
};


module.exports = {
    amount: 1,
    start: function () {
        go(1);
    },
    stop: function () {
        clearInterval(runner);
        process.stdout.write(']');
        console.log('');
    }
};