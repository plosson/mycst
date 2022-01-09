const base45 = require('base45');
const bignumbers = require('bignumber.js');
const cbor = require('cbor-web');
const pako = require('pako');

const decodeDGC = (data) => {
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
};

module.exports = {decodeDGC};