let https = require('https');
const Calls = {
    getOptions(host, path, method) {
        return {
            hostname: host,
            path: path,
            method: method,
            headers: {'User-Agent': 'Mozilla/5.0'}
        };
    },
    post(host, body) {
        let options = this.getOptions(host, '', 'POST');
        return new Promise((resolve => {

            https.request(options, res => {
                let body = body;
                res.setEncoding('utf-8');
                res.on('data', data => {
                    body += data;
                });

                res.on('end', () => {
                    setTimeout(() => {
                        try {
                            body = JSON.parse(body);
                        } catch (e) {
                            body = {error: e}
                        }

                        resolve(body)
                    }, 300);

                });
            }).on('error', (err) => {
                resolve({error: err.port})
            });
        }))
    },
    getRaw(url, callback) {
        return new Promise(resolve => {
            https.get(url, res => {
                let body = '';
                res.setEncoding('utf-8');
                res.on('data', data => {

                    body += data;
                });
                res.on('end', ()=>{
                    resolve(body);
                })
            });
        });
    },
    get(host, path) {
        let options = this.getOptions(host, path, 'GET');
        return new Promise((resolve => {
            https.get(options, res => {
                let body = '';
                res.setEncoding('utf-8');
                res.on('data', data => {

                    body += data;
                });

                res.on('end', () => {
                    setTimeout(() => {
                        try {
                            body = JSON.parse(body);
                        } catch (e) {
                            body = {error: e}
                        }

                        resolve(body)
                    }, 300);

                });
            }).on('error', (err) => {
                resolve({error: err.port})
            });
        }))
    }
};
module.exports = Calls;
