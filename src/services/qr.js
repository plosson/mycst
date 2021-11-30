const QRCode = require("easyqrcodejs");
const {BrowserQRCodeReader} = require("@zxing/browser");
const {Html5Qrcode, Html5QrcodeSupportedFormats} = require("html5-qrcode");

const createQR = (divElement, options) => {
    options.correctLevel = QRCode.CorrectLevel.H;
    new QRCode(divElement, options);
}

const uploadQR = (divElement, fileElement, callback, errorCallback) => {
    const imageContainer = document.getElementById(divElement);
    const fileinput = document.getElementById(fileElement);
    fileinput.addEventListener('change', e => {
        if (e.target.files.length == 0) {
            return;
        }

        imageContainer.innerHTML = "";
        const imageFile = e.target.files[0];
        const img = new Image();
        img.src = URL.createObjectURL(imageFile);
        imageContainer.append(img);

        try {
            const codeReader = new BrowserQRCodeReader();
            codeReader.decodeFromImageElement(img).then(r => callback(r.getText()));
        } catch (e) {
            errorCallback();
        }
    });
}

const scanQR = (divElement, aspectRatio, callback) => {
    const html5QrCode = new Html5Qrcode(divElement, {formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]});
    html5QrCode.start({facingMode: "environment"}, {
            fps: 10,
            rememberLastUsedCamera: true,
            qrbox: 250
        },
        decodedText => {
            try {
                callback(decodedText);
            } catch (e) {
                console.log(`Error scanning file. Reason: ${err}`)
            }
        },
        errorMessage => {
        })
        .catch(err => {
            console.log(`Error scanning file. Reason: ${err}`)
        });
    return html5QrCode;
}

//Export these both as JSON
module.exports = {scanQR, uploadQR, createQR}