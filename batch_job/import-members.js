let mongoose = require('mongoose');
mongoose.connect('xxx', { useMongoClient: true });
mongoose.Promise = global.Promise;

const shortid32 = require("shortid32");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: { type: String, unique: true },
    password: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    facebook: String,
    twitter: String,
    google: String,
    tokens: Array,
    profile: {
        name: String,
        gender: String,
        location: String,
        website: String,
        picture: String
    }
}, { timestamps: true });
const User = mongoose.model("User", userSchema);

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

const csv = require("csvtojson");

csv().fromFile("batch_job/members.csv").then((jsonObj) => {
    // console.log(jsonObj);

    for (let i in jsonObj) {
        // console.log(jsonObj[i]);
        
        let newMember = new Member(jsonObj[i]);
        
        Product.findOne({ productNameCh: jsonObj[i].starterKit.productNameCh }, function(err, productObj) {
            if (err) { 
                console.log(err); 
                process.exit(1);
            }
            if (!productObj) {
                console.log("productObj not found for: " + jsonObj[i].starterKit.productNameCh);
                process.exit(1);
            }
            newMember.starterKit.product = productObj._id;
            newMember.createdBy = "5afda02dfb0cb715c8596459";
            newMember.save(function(err, dbObj) {
                if (err) {
                    console.log(err);
                    process.exit(1);
                } else {
                    console.log('new record id[' + i + ']: ' + dbObj._id);
                }
            });
        });
    }
});
