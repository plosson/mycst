//window.$ = require('jquery');
const base45 = require('base45');
const cbor = require('cbor-web');
const pako = require('pako');
const qs = require('query-string')
import {Base64} from 'js-base64';
import './style.css';

import * as Sentry from "@sentry/browser";
import {Integrations} from "@sentry/tracing";

Sentry.init({
    dsn: "https://9e26520f21cb4a16b36eed8515276dea@o556453.ingest.sentry.io/6040196",
    integrations: [new Integrations.BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
});

function parseUrl(url) {
    return qs.parseUrl(url);
}

function decode64(value) {
    return Base64.decode(value);
}

function splitQS(data, param) {
    const parts = data.match(/.{1,100}/g);
    const qs = [];
    for (let i = 0; i < parts.length; i++) {
        qs.push(param + i + "=" + parts[i]);
    }
    return qs.join('&');
}

function mergeQS(params, param) {
    const parts = [];
    for (let i = 0; i < Object.keys(params).length; i++) {
        const key = param + i;
        if (params[key]) {
            parts.push(params[key]);
        } else {
            break;
        }
    }
    return parts.join();
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


export {splitQS, mergeQS, decode64, encode64, parseUrl, decodeDGC}



