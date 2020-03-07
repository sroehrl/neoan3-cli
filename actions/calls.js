let axios = require('axios');
const Calls = {
    getOptions(host, path, method) {
        let options = {
            url: host,
            method: method,
            headers: {'User-Agent': 'Mozilla/5.0'}
        };
        if(method === 'get'){
            options.params = path;
        } else {
            options.data = path;
        }
        return options;
    },
    async post(host, body) {
        let options = this.getOptions(host, body, 'post');
        try{
            const req = await axios.post(host,options);
            return req.data;
        } catch (e) {
            throw new Error(`Request to ${host} failed`)
        }
    },
    async get(host, path) {
        let options = this.getOptions(host, path, 'get');
        try{
            let res = await axios.get(host,options);
            return res.data;
        } catch (e) {
            throw new Error(`Request to ${host} failed`)
        }

    }
};
module.exports = Calls;
