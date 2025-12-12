const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const FormData = require('form-data');
require('dotenv').config();

const API_KEY = process.env.VIRUSTOTAL_API_KEY;

const vt = axios.create({
    baseURL: 'https://www.virustotal.com/api/v3',
    headers: { 'x-apikey': API_KEY }
});

// SHA-256 hash generator
function hashFile(path) {
    return new Promise(resolve => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(path);

        stream.on('data', d => hash.update(d));
        stream.on('end', () => resolve(hash.digest('hex')));
    });
}


async function scanUrl(url) {
    const form = new FormData();
    form.append('url', url);

    const res = await vt.post('/urls', form, { headers: form.getHeaders() });
    return res.data;
}

async function scanIp(ip) {
    const res = await vt.get(`/ip_addresses/${ip}`);
    return res.data;
}

async function getAnalysis(id) {
    const res = await vt.get(`/analyses/${id}`);
    return res.data;
}

module.exports = {
    hashFile,
    scanUrl,
    scanIp,
    getAnalysis
};
