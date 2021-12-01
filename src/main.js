// SERVICES
const DGC = require('./services/dgc');
const QR = require('./services/qr');
const URL = require('./services/url');

// DEBUG
import * as Sentry from "@sentry/browser";
import {Integrations} from "@sentry/tracing";

// UI - ALPINE
import Alpine from 'alpinejs'
import persist from '@alpinejs/persist'

// ANIMATION & CSS
const bodymovin = require('bodymovin');
import './style.css';

let html5QrCode = null;
Alpine.plugin(persist)

Alpine.data('data', function () {
    return {
        "library": Alpine.$persist([]),
        "logos": Alpine.$persist([]),
        "pass": {
            "dob": "1975-01-01",
            "age": 45,
            "nam": {
                "fn": "Denver",
                "gn": "John",
                "fnt": "DENVER",
                "gnt": "JOHN"
            }
        },
        "text": "",
        "error": false,
        "found" : false,
        "logo": Alpine.$persist(""),
        "page": location.hash,
        "changePage": function (page) {
            this.page = page;
            if (page === '#scan') {
                const that = this;
                setTimeout(() => {
                    // check if scanner is started
                    if (html5QrCode == null) {
                        this.error = false;
                        html5QrCode = QR.scanQR("videoContainer", getAspectRatio(), decodedText => {
                            html5QrCode.pause();
                            const decoded = DGC.decodeDGC(decodedText);
                            if (decoded.valid) {
                                that.savePass(decoded);
                                this.error = false;
                            } else {
                                this.error = true;
                            }
                        });
                    }
                }, 200);
            } else {
                if (html5QrCode != null) {
                    try {
                        html5QrCode.stop();
                    } catch (e) {
                        // silent
                    }
                    html5QrCode = null;
                }
            }

            if (page === '#upload') {
                const fileinput = document.getElementById('qr-input-file');
                const that = this;
                this.error = false;
                QR.uploadQR("imageContainer", "qr-input-file", decodedText => {
                    const decoded = DGC.decodeDGC(decodedText);
                    if (decoded.valid) {
                        that.savePass(decoded);
                    } else {
                        this.error = true;
                    }
                    document.getElementById("imageContainer").innerHTML = "";
                    fileinput.value = "";
                }, error => {
                    this.error = true;
                    document.getElementById("imageContainer").innerHTML = "";
                    fileinput.value = "";
                });
            }

            if (page === '#icon') {
                const fileinput = document.getElementById('icon-file');
                const that = this;
                fileinput.addEventListener('change', e => {
                    if (e.target.files.length == 0) {
                        return;
                    }

                    var file = e.target.files[0];
                    if (file) {
                        // Load the image
                        var reader = new FileReader();
                        reader.onload = function (readerEvent) {
                            var image = new Image();
                            image.onload = function (imageEvent) {
                                // Resize the image
                                var canvas = document.createElement('canvas');
                                canvas.width = 80;
                                canvas.height = 80;
                                canvas.getContext('2d').drawImage(image, 0, 0, 80, 80);
                                var dataUrl = canvas.toDataURL('image/jpeg');
                                window.location.href = URL.toPassUrl(that.pass.text, dataUrl);
                                that.changePage('#qr');
                                /*$.event.trigger({
                                    type: "imageResized",
                                    blob: resizedImage,
                                    url: dataUrl
                                });*/

                            }
                            image.src = readerEvent.target.result;
                        }
                        reader.readAsDataURL(file);
                    }
                });
            }

            if (page === '#library') {
            }
        },
        "findPass": function (data) {
            // find in library
            const that = this;
            return this.library.findIndex(element => {
                return (element.text === data && element.logo === ('' + that.logo));
            });
        },
        "deletePass": function (data) {
            // find in library
            const index = this.findPass(data);
            if (index > -1) {
                this.library.splice(index, 1);
            }
            // go back to scan page
        },
        "initPass": function (data, logoId) {
            let result = DGC.decodeDGC(data);
            this.pass = result.json;
            this.text = result.text;

            document.getElementById("qrcode").innerHTML = "";
            document.getElementById("qrcode-large").innerHTML = "";

            bodymovin.destroy();
            bodymovin.loadAnimation({
                container: document.getElementById('bm'),
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: '/public/json/qr_code.json'
            });

            bodymovin.loadAnimation({
                container: document.getElementById('bm-large'),
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: '/public/json/qr_code.json'
            });

            let smallOptions = {
                text: this.text,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
            };

            let largeOptions = {
                text: this.text,
                width: 300,
                height: 300,
                colorDark: "#000000",
                colorLight: "#ffffff",
            };

            if (logoId && logoId.length > 0) {
                smallOptions.logo = `/public/img/qr_logo_${logoId}.png`;
                smallOptions.logoWidth = 50;
                smallOptions.logoHeight = 50;
                smallOptions.logoBackgroundTransparent = false;

                largeOptions.logo = `/public/img/qr_logo_${logoId}.png`;
                largeOptions.logoWidth = 80;
                largeOptions.logoHeight = 80;
                largeOptions.logoBackgroundTransparent = false;
            }
            QR.createQR(document.getElementById("qrcode"), smallOptions);
            QR.createQR(document.getElementById("qrcode-large"), largeOptions);

            var canvas = document.querySelector('#qrcode > canvas'),
                ctx = canvas.getContext('2d');
            fitToContainer(canvas);

            var canvas = document.querySelector('#qrcode-large > canvas'),
                ctx = canvas.getContext('2d');

            fitToContainer(canvas);
        },
        "encode": function () {
            window.location.href = URL.toPassUrl(this.pass.text, this.logo);
        },
        "savePass": function (decoded) {
            try {
                let p = JSON.parse(JSON.stringify(decoded));
                p.logo = this.logo;
                if (this.findPass(p.text) === -1) {
                    this.library.push(p);
                }
            } catch (e) {
                console.log(e);
            }
            this.showPass(decoded.text);
        },
        "showPass": function (data) {
            window.location.href = URL.toPassUrl(data, this.logo);
        },
        "formatDate": function (date, format) {
            return formatDate(date, format);
        },
        "init": function () {
            const url = URL.parse(window.location.href);
            if ("logo" in url.query) {
                this.logo = url.query.logo;
                //console.log("Setting logo to : " + this.logo);
            }
            if (url.query.p0) {
                this.initPass(URL.fromPassUrl(url.query), url.query.logo);
                if (this.page === '') {
                    window.location.href = '#qr';
                }
            }
            this.changePage(location.hash);
        },
    }
});

function fitToContainer(canvas) {
    canvas.style.width = '100%';
    canvas.style.height = '100%';
}

Sentry.init({
    dsn: "https://9e26520f21cb4a16b36eed8515276dea@o556453.ingest.sentry.io/6040196",
    integrations: [new Integrations.BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
});

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getAspectRatio() {
    const realWidth = window.screen.width * window.devicePixelRatio;
    const realHeight = window.screen.height * window.devicePixelRatio;
    const aspectRatio = realHeight / realWidth;
    return aspectRatio;
}

window.Alpine = Alpine;

// should be last
Alpine.start();

