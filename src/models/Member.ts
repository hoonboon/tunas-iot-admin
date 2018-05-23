import mongoose from "mongoose";
import moment from "moment";

const uuid = require("uuid/v4");

export type MemberModel = mongoose.Document & {
  nric: string,
  dateJoin: Date,
  status: string,
  createdBy: string,
  updatedBy: string,
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
    kitCode: string,
    kitAmount: string
  },
  url: string
};

const memberSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  nric: { type: String, required: true, unique: true, uppercase: true },
  dateJoin: { type: Date, required: true },
  status: { type: String, required: true, default: "A" },
  createdBy: String,
  updatedBy: String,
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
    kitCode: String,
    kitAmount: String
  }
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

const Member = mongoose.model("Member", memberSchema);
export default Member;
