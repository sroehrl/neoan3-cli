let runner;
const go = function(amount){
    runner = setInterval(()=>{
        let string = '';
        for(let i =0; i<= amount; i++){
            string += '*';
        }
        amount++;
        console.log(string);
    },1000);
};


module.exports = {
    amount:1,
    start:function(){
        go(1);
    },
    stop:function(){
        clearInterval(runner);
    }
};