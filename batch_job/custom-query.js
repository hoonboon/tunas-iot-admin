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
    _id: "$starterKit.kitAmount", count: {$sum: 1}
});
query.sort({ "_id": 1 });

query.exec(function (err, results) {
    if (err) {
        return console.error(err);
    }
    console.info("starterKit.kitAmount, count");
    if (results) {

        for (let row of results) {
            console.info(row._id + ", " + row.count);
        }
    }
});

