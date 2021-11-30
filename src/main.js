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
        "logo": Alpine.$persist(""),
        "page": location.hash,
        "changePage": function (page) {
            this.page = page;
            if (page === '' || page === '#') {

                // check if scanner is started
                const that = this;
                if (html5QrCode == null) {
                    html5QrCode = QR.scanQR("videoContainer", getAspectRatio(), decodedText => {
                        that.savePass(decodedText);
                    });
                }
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
                QR.uploadQR("imageContainer", "qr-input-file", decodedText => {
                    that.savePass(decodedText);
                    document.getElementById("imageContainer").innerHTML = "";
                    fileinput.value = "";
                }, error => {
                    alert("No QR code found. Try again with another picture.");
                });
            }

            if (page === '#library') {
            }
        },
        "findPass": function (data) {
            // find in library
            return this.library.findIndex(element => element.text === data && element.logo === this.logo);
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

            QR.createQR(document.getElementById("qrcode"), {
                text: this.text,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
            });

            let largeOptions = {
                text: this.text,
                width: 300,
                height: 300,
                colorDark: "#000000",
                colorLight: "#ffffff",
            };

            if (logoId && logoId.length > 0) {
                largeOptions.logo = `/public/img/qr_logo_${logoId}.png`;
                largeOptions.logoWidth = 80;
                largeOptions.logoHeight = 80;
                largeOptions.logoBackgroundTransparent = false;
            }

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
        "savePass": function (data) {
            try {
                let p = JSON.parse(JSON.stringify(DGC.decodeDGC(data)));
                p.logo = this.logo;
                this.library.push(p);
            } catch (e) {
                console.log(e);
            }
            this.showPass(data);
        },
        "showPass": function (data) {
            console.log(data);
            window.location.href = URL.toPassUrl(data, this.logo);
        },
        "formatDate": function (date, format) {
            return formatDate(date, format);
        },
        "init": function () {
            const url = URL.parse(window.location.href);
            if (url.query.logo) {
                this.logo = url.query.logo;
            } else {
                this.logo = "";
            }
            if (url.query.p0) {
                this.initPass(URL.fromPassUrl(url.query), url.query.logo);
                if (this.page === '') {
                    this.changePage('#qr');
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
    console.log(aspectRatio);
    return aspectRatio;
}

window.Alpine = Alpine;

// should be last
Alpine.start();
