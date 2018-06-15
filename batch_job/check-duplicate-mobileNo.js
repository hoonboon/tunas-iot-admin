let mongoose = require('mongoose');
mongoose.connect('xxx', { useMongoClient: true });
mongoose.Promise = global.Promise;

const shortid32 = require("shortid32");
const Schema = mongoose.Schema;

const moment = require("moment");

// const memberSchema = new Schema({}, { timestamps: true });
// const Member = mongoose.model("Member", memberSchema);
const Member = require("../dist/models/Member").default;

// Sample Aggregate
const query = Member.aggregate();
query.group({
    _id: "$contact.mobileNo", count: {$sum: 1}
});
query.match({ count: { $gt: 1 } });
query.sort({ "count": -1 });

query.exec(function (err, results) {
    if (err) {
        return console.error(err);
    }
    console.info("contact.mobileNo, count");
    if (results) {

        for (let row of results) {
            console.info(row._id + ", " + row.count);
        }
    }
});

const query2 = Member.find();
query2.select({
    'contact.mobileNo': 1,
    _id: 1, 
    dateJoin: 1,
    nric: 1,
    'profile.nameCh': 1,
    'profile.name': 1
});
query2.where("contact.mobileNo").in(["60195522285","60174898842","60105502602","60124996883"]);
query2.sort([["contact.mobileNo", 1], ["dateJoin", 1]]);

query2.exec(function (err, results) {
    if (err) {
        return console.error(err);
    }
    console.info("contact.mobileNo, id, dateJoin, nric, nameCh, name");
    if (results) {

        for (let row of results) {
            const output = row.contact.mobileNo 
                + ", " + row._id 
                + ", " + moment(row.dateJoin).format("YYYY-MM-DD")
                + ", " + row.nric
                + ", " + row.profile.nameCh
                + ", " + row.profile.name;
            console.info(output);
        }
    }
});

