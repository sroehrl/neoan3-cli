let https = require('https');
const Calls = {
    get(host, path){
        return new Promise((resolve => {
            let options = {
                hostname:host,
                path:path,
                method:'GET',
                headers: { 'User-Agent': 'Mozilla/5.0' }
            };
            https.get(options,res => {
                let body ='';
                res.setEncoding('utf-8');
                res.on('data', data => {

                    body += data;
                });

                res.on('end', () => {
                    setTimeout(()=>{
                        body = JSON.parse(body);
                        resolve(body)
                    },300);

                });
            }).on('error',(err)=>{
                resolve({error:err.port})
            });
        }))
    }
};
module.exports = Calls;
