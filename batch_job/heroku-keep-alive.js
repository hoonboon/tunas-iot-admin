let request = require("request");
let moment = require("moment");

const interval = 25 * 60 * 1000; // milliseconds

setTimeout(function() {
    setInterval(ping, interval, "https://tunas-iot-admin.herokuapp.com/login");
}, 30000);

function ping(url) {
    request.get(url, (err, res, body) => {
        if (err) console.dir(err);
        console.log("ping successful at: " + moment().format());
    });
}