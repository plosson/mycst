//window.$ = require('jquery');
const base45 = require('base45');
const cbor = require('cbor-web');
const pako = require('pako');
const qs = require('query-string')
import {Base64} from 'js-base64';
import './style.css';

function parseUrl(url) {
    return qs.parseUrl(url);
}

function decode64(value) {
    return Base64.decode(value);
}

function encode64(value) {
    return Base64.encodeURI(value);
}

function decodeDGC(data) {
    // check prefix
    const prefix = data.substr(0, data.indexOf(':'));

    if (prefix === "HC1") {
        // Remove `HC1:` from the string
        const greenpassBody = data.substr(4);

        // Data is Base45 encoded
        const decodedData = base45.decode(greenpassBody);

        // And zipped
        const output = pako.inflate(decodedData);

        const results = cbor.decodeAllSync(output);

        //const headers1 = results[0].value[0];
        //const headers2 = results[0].value[1];
        const cbor_data = results[0].value[2];
        //const signature = results[0].value[3];

        const greenpassData = cbor.decodeAllSync(cbor_data);
        var json = greenpassData[0].get(-260).get(1);

        return {"valid": true, "json": json, "text": data};
    } else {
        return {"valid": false, "text": data};
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


export {decode64, encode64, parseUrl, decodeDGC}



