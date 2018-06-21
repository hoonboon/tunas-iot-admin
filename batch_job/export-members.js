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

const productSchema = new Schema({
    productCode: { type: String, required: true, unique: true, uppercase: true },
    productName: { type: String, required: true, uppercase: true },
    productNameCh: String,
    productDesc: String,
    status: { type: String, required: true, default: "A" },
    createdBy: String,
    updatedBy: String
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

const Excel = require("exceljs");

const rptFilter = {
    "dateJoinFrom": moment("2018-06-10"),
    "dateJoinTo": moment("2018-06-21"),
    "createdAtFrom": moment("2018-06-14T21:39:00"),
    "createdAtTo": moment()
};

const query = Member.find();
query.populate("starterKit.product");
query.select({
    _id: 1, dateJoin: 1, nric: 1, 
    'contact.mobileNo': 1, 'profile.name': 1, 'profile.nameCh': 1, 
    createdAt: 1, 'starterKit.product.productCode': 1
});
query.where("dateJoin").gte(rptFilter.dateJoinFrom);
query.where("dateJoin").lte(rptFilter.dateJoinTo);
query.where("createdAt").gte(rptFilter.createdAtFrom);
query.where("createdAt").lte(rptFilter.createdAtTo);
query.sort([["dateJoin", "ascending"], ["nric", "ascending"]]);

query.exec(function (err, item_list) {
    if (err) {
        return console.error(err);
    }
    
    const excelOptions = {
        filename: "batch_job/rpt_agentList_" + moment().format("YYYYMMDD") + ".xlsx",
        useStyles: true
    };

    let wb = new Excel.stream.xlsx.WorkbookWriter(excelOptions);
    
    let sheet = wb.addWorksheet("agents");
    
    sheet.pageSetup.printTitlesRow = "1:4";
    sheet.autoFilter = "A4:H4";

    // Report headers
    sheet.mergeCells("A1:H1");
    sheet.getCell("A1").font = { size: 14, bold: true };
    sheet.getCell("A1").value = "Tunas IOT - Agent List";
    
    sheet.mergeCells("A2:D2");
    sheet.getCell("A2").value = "Date Join: " + rptFilter.dateJoinFrom.format("YYYY-MM-DD") + " - " + rptFilter.dateJoinTo.format("YYYY-MM-DD");
    sheet.getCell("A2").font = { size: 8, bold: true };
    
    sheet.mergeCells("E2:H2");
    sheet.getCell("E2").value = "Print Date: " + moment().format();
    sheet.getCell("E2").font = { size: 8, bold: true };
    
    sheet.addRow([]);

    const headerRowLabel = { 
        A: { label: "Agent Id", width: 20, align: "left" }, 
        B: { label: "RDW", width: 10, align: "center" }, 
        C: { label: "Date Join", width: 15, align: "center" }, 
        D: { label: "NRIC", width: 20, align: "left" },  
        E: { label: "Mobile No.", width: 20, align: "center" }, 
        F: { label: "Name EN", width: 25, align: "left" }, 
        G: { label: "Name CH", width: 10, align: "center" }, 
        H: { label: "Create Date", width: 25, align: "center" }, 
    };
    for(let key in headerRowLabel) {
        sheet.getColumn(key).width = headerRowLabel[key].width;
        sheet.getColumn(key).alignment = { horizontal: headerRowLabel[key].align, wrapText: true, vertical: "top" };

        sheet.getCell(key + 4).value = headerRowLabel[key].label;
        sheet.getCell(key + 4).font = { bold: true };
        sheet.getCell(key + 4).alignment = { horizontal: "center", wrapText: true };
        sheet.getCell(key + 4).fill = { 
            type: 'pattern',
            pattern:'solid',
            fgColor:{argb:'FFD8D8D8'}
        };
    };

    sheet.getCell("A1").alignment = { horizontal: "center", wrapText: true };
    sheet.getCell("A2").alignment = { horizontal: "left", wrapText: true };
    sheet.getCell("E2").alignment = { horizontal: "right", wrapText: true };
    
    sheet.getRow(4).commit();
    
    // Report data
    if (item_list) {
        for (let member of item_list) {
            let rowValues = [];
            let i = 1;
            rowValues[i++] = member._id;

            const starterKitCode = member.starterKit.product.productCode;
            
            if (starterKitCode === "1006") {
                rowValues[i++] = "RDW";
            } else {
                rowValues[i++] = "-";
            }

            rowValues[i++] = moment(member.dateJoin).format("YYYY-MM-DD");
            rowValues[i++] = member.nric;
            rowValues[i++] = member.contact.mobileNo;
            rowValues[i++] = member.profile.name;
            rowValues[i++] = member.profile.nameCh;
            rowValues[i++] = moment(member.createdAt).format();
            sheet.addRow(rowValues).commit();
        }
    }

    sheet.commit();

    wb.commit()
        .then(function() {
            console.info("Done!");
        });
});

