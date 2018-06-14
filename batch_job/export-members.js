let mongoose = require('mongoose');
mongoose.connect('xxx', { useMongoClient: true });
mongoose.Promise = global.Promise;

const shortid32 = require("shortid32");
const Schema = mongoose.Schema;

const moment = require("moment");

const memberSchema = new Schema({
    _id: { type: String, default: shortid32.generate },
    nric: { type: String, required: true, unique: true, uppercase: true },
    dateJoin: { type: Date, required: true },
    status: { type: String, required: true, default: "A" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    profile: {
        name: { type: String, required: true, uppercase: true },
        nameCh: String,
        gender: String,
        dob: { type: Date, required: true },
    },
    contact: {
        mobileNo: { type: String, required: true },
        email: String,
        homeAddr: String,
        deliveryAddr: String
    },
    bank: {
        accNo: String,
        bankName: String,
        bankAddr: String
    },
    social: {
        wechat: String
    },
    sponsor: {
        name: { type: String, uppercase: true },
        contactNo: String,
        orgNo: String,
        teamNo: String
    },
    starterKit: {
        product: { type: Schema.Types.ObjectId, ref: "Product" },
        kitAmount: String
    }
}, { timestamps: true });
const Member = mongoose.model("Member", memberSchema);

const Excel = require("exceljs");

const query = Member.find();
query.select({
    _id: 1, dateJoin: 1, nric: 1, 
    'contact.mobileNo': 1, 'profile.name': 1, 'profile.nameCh': 1, 
    createdAt: 1
});
query.where("createdAt").gte(moment("2018-06-06T21:39:00"));
query.where("createdAt").lte(moment());
query.sort([["dateJoin", "ascending"], ["nric", "ascending"]]);

query.exec(function (err, item_list) {
    if (err) {
        return console.error(err);
    }
    
    const excelOptions = {
        filename: "batch_job/rpt_agentList_" + moment().format("YYYYMMDD") + ".xlsx"
    };

    let wb = new Excel.stream.xlsx.WorkbookWriter(excelOptions);
    
    let sheet = wb.addWorksheet("agents");
    
    sheet.columns = [
        { header: 'Agent Id', width: 20 },
        { header: 'Date Join', width: 20 },
        { header: 'NRIC', width: 20 },
        { header: 'Mobile No.', width: 20 },
        { header: 'Name EN', width: 20 },
        { header: 'Name CH', width: 20 },
        { header: 'Create Date', width: 20 }
    ];    

    if (item_list) {
        for (let member of item_list) {
            let rowValues = [];
            rowValues[1] = member._id;
            rowValues[2] = moment(member.dateJoin).format("YYYY-MM-DD");
            rowValues[3] = member.nric;
            rowValues[4] = member.contact.mobileNo;
            rowValues[5] = member.profile.name;
            rowValues[6] = member.profile.nameCh;
            rowValues[7] = moment(member.createdAt).format();
            sheet.addRow(rowValues).commit();
        }
    }

    sheet.commit();

    wb.commit()
        .then(function() {
            console.info("Done!");
        });
});

