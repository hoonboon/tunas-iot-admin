let request = require("request");
let moment = require("moment");

const interval = 25 * 60 * 1000; // milliseconds
const url = "https://tunas-iot-admin.herokuapp.com/api/heartbeat";
// const url = "http://localhost:3000/api/heartbeat";

setTimeout(function() {
    setInterval(ping, interval, url);
}, 30000);

function ping(url) {
    request.get({ url: url, json: true }, (err, res, body) => {
        if (err) console.dir(err);
        if (res.statusCode === 200 && body.heartbeat) {
            console.log("ping successful at: " + body.heartbeat);
        } else {
            console.log("ping failed with statusCode=" + res.statusCode);
        }
    });
}