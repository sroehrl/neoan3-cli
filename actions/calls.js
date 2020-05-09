let axios = require('axios');
const Calls = {
    getOptions(path, method, headers) {
        let options = {
            method: method,
            headers: {'User-Agent': 'Mozilla/5.0'}
        };
        if (method === 'get') {
            options.params = path;
        } else {
            options.data = path;
        }
        options.headers = this.processHeaders(options.headers, headers);
        return options;
    },
    processHeaders(existing, potential) {
        if (typeof potential !== 'undefined') {
            Object.keys(potential).forEach(key => {
                existing[key] = potential[key];
            })
        }
        return existing;
    },
    async post(host, body, headers) {
        let options = this.getOptions(body, 'post', headers);
        options.url = host;

        try {
            const req = await axios.post(host, options);
            return req.data;
        } catch (e) {
            throw new Error(`Request to ${host} failed`)
        }
    },
    async get(host, path, headers) {

        let options = this.getOptions(path, 'get', headers);
        options.url = host;
        try {
            let res = await axios.get(host, options);
            return res.data;
        } catch (e) {
            throw new Error(`Request to ${host} failed`)
        }

    }
};
module.exports = Calls;
