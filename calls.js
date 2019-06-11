let https = require('https');
const Calls = {
    get(url){
        return new Promise((resolve => {
            let options = {
                hostname:url,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            };
            https.get(options,res => {
                let body ='';
                res.setEncoding('utf-8');
                res.on('data', data => {
                    body += data;
                });

                res.on('end', () => {
                    body = JSON.parse(body);
                    resolve(body)
                });
            }).on('error',(err)=>{
                resolve({error:err.port})
            });
        }))
    }
};
module.exports = Calls;
