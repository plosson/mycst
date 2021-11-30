// URL PARSING
const qs = require('query-string');
const {Base64} = require('js-base64');

const encode64 = value => Base64.encodeURI(value);
const decode64 = value => Base64.decode(value);
const parse = url => qs.parseUrl(url);

const splitQS = (data, param) => {
    const parts = data.match(/.{1,100}/g);
    const qs = [];
    for (let i = 0; i < parts.length; i++) {
        qs.push(param + i + "=" + parts[i]);
    }
    return qs.join('&');
};

const mergeQS = (splits, param) => {
    const parts = [];
    for (let i = 0; i < Object.keys(splits).length; i++) {
        const key = param + i;
        if (splits[key]) {
            parts.push(splits[key]);
        } else {
            break;
        }
    }
    return parts.join();
};

const toPassUrl = (text, logo) => {
    try {
        var url = "?" + splitQS(encode64(text), "p");
        if (logo && logo.length > 0) {
            url = url + "&logo=" + logo;
        }
    } catch (e) {
        console.log(e);
    }
    return url + "#qr";
}

const fromPassUrl = (qs) => {
    try {
        return decode64(mergeQS(qs, "p"));
    } catch (e) {
        console.log(e);
    }
}


module.exports = {toPassUrl, fromPassUrl, parse};
