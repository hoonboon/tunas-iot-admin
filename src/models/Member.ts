import mongoose from "mongoose";
import moment from "moment";

const shortid32 = require("shortid32");

const Schema = mongoose.Schema;

export type MemberModel = mongoose.Document & {
  nric: string,
  dateJoin: Date,
  status: string,
  createdBy: any,
  updatedBy: any,
  profile: {
    name: string,
    nameCh: string,
    gender: string,
    dob: Date
  },
  contact: {
    mobileNo: string,
    email: string,
    homeAddr: string,
    deliveryAddr: string
  },
  bank: {
    accNo: string,
    bankName: string,
    bankAddr: string
  },
  social: {
    wechat: string
  },
  sponsor: {
    name: string,
    contactNo: string,
    orgNo: string,
    teamNo: string
  },
  starterKit: {
    product: any,
    kitAmount: string
  },
  lastNotifyId: Date,
  url: string,
  isValidMobileNoMy: boolean,
  lastNotifyIdDisplay: string
};

const memberSchema = new mongoose.Schema({
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
  },
  lastNotifyId: Date
}, { timestamps: true });

// Virtual for Date Join for display
memberSchema
.virtual("dateJoinDisplay")
.get(function () {
    return this.dateJoin ? moment(this.dateJoin).format("YYYY-MM-DD") : "?";
});

// Virtual for Date Join for form input
memberSchema
.virtual("dateJoinInput")
.get(function () {
    return this.dateJoin ? moment(this.dateJoin).format("YYYY-MM-DD") : "";
});

// Virtual for Date of Birth for display
memberSchema
.virtual("profile.dobDisplay")
.get(function () {
    return this.profile.dob ? moment(this.profile.dob).format("YYYY-MM-DD") : "?";
});

// Virtual for Date of Birth for form input
memberSchema
.virtual("profile.dobInput")
.get(function () {
    return this.profile.dob ? moment(this.profile.dob).format("YYYY-MM-DD") : "";
});

// Virtual for Member's URL
memberSchema
.virtual("url")
.get(function() {
    return "/member/" + this._id;
});

// Virtual for Date Join for display
memberSchema
.virtual("lastNotifyIdDisplay")
.get(function () {
    return this.lastNotifyId ? moment(this.lastNotifyId).format("YYYY-MM-DD HH:mm:ss") : "";
});

// Virtual for Member's Mobile No - Is valid MY modbile no.
memberSchema
.virtual("isValidMobileNoMy")
.get(function() {
    if (this.contact.mobileNo) {
        const regexp = new RegExp(/^(601)[0|1|2|3|4|6|7|8|9]\-*[0-9]{7,8}$/);
        return regexp.test(this.contact.mobileNo);
    }
    return false;
});

const Member = mongoose.model("Member", memberSchema);
export default Member;
