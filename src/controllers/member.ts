import async from "async";
import moment from "moment";
import { default as Member, MemberModel } from "../models/Member";
import Product from "../models/Product";
import { Request, Response, NextFunction } from "express";
import { WriteError } from "mongodb";

import { body, validationResult } from "express-validator/check";
import { sanitizeBody } from "express-validator/filter";


/**
 * GET /members
 * Member listing page.
 */
export let getMembers = (req: Request, res: Response, next: NextFunction) => {
    let searchJoinDate = req.query.searchJoinDate;
    const searchName = req.query.searchName;
    const searchNric = req.query.searchNric;

    // default filter
    if (!searchJoinDate && !searchName && !searchNric) {
        searchJoinDate = moment().format("YYYY-MM-DD");
    }

    const query = Member.find();

    // filter records
    if (searchJoinDate) {
        query.where("dateJoin").equals(searchJoinDate);
    }

    if (searchName) {
        const regex = new RegExp(searchName.toUpperCase().replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"));
        query.where("profile.name").regex(regex);
    }

    if (searchNric) {
        const regex = new RegExp(searchNric.toUpperCase().replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"));
        query.where("nric").regex(regex);
    }

    query.sort([["dateJoin", "ascending"], ["profile.name", "ascending"]]);
    query.exec(function (err, item_list: any) {
            if (err) {
                return next(err);
            }
            res.render("member/list", {
                title: "Member List 会员",
                member_list: item_list,
                searchName: searchName,
                searchJoinDate: searchJoinDate,
                searchNric: searchNric
            });
        });
};

/**
 * GET /member/create
 * Create Member page.
 */
export let getMemberCreate = (req: Request, res: Response, next: NextFunction) => {
    // TODO: for local testing only
    // const memberInput = new Member({
    //     nric: "1001",
    //     dateJoin: moment(),
    //     createdBy: req.user.id,
    //     profile: {
    //         name: "Some Body 1",
    //         nameCh: "某人一",
    //         gender: "F",
    //         dob: moment().subtract(20, "years")
    //     },
    //     contact: {
    //         mobileNo: "1234567890",
    //         homeAddr: "Some Body address"
    //     },
    //     bank: {
    //         accNo: "123456",
    //         bankName: "Some Bank name",
    //         bankAddr: "Some Bank address"
    //     },
    //     social: {
    //         wechat: "SomeWechatID"
    //     },
    //     sponsor: {
    //         name: "Some sponsor Name",
    //         contactNo: "Some sponsor Contact No",
    //         orgNo: "Some sponsor Org",
    //         teamNo: "Some sponsor Team"
    //     },
    //     starterKit: {
    //         kitCode: "2",
    //         kitAmount: "RMB680"
    //     }
    // });

    const memberInput = new Member({
            dateJoin: moment(),
    });

    async.parallel({
        // get product options
        products: function(callback) {
            Product.find({ status: "A" })
                .sort("productCode")
                .exec(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }

        res.render("member/form", {
            title: "Create Member 注册会员",
            member: memberInput,
            products: results.products
        });

    });
};

/**
 * POST /member/create
 * Create a new Member.
 */
export let postMemberCreate = [
    // validate values
    body("dateJoin")
        .isLength({ min: 1 }).trim().withMessage("Date Join is required.")
        .isISO8601().withMessage("Date Join is invalid."),
    body("nameCh")
        .isLength({ min: 1 }).trim().withMessage("Name CH is required."),
    body("name")
        .isLength({ min: 1 }).trim().withMessage("Name EN is required."),
    body("dob")
        .isLength({ min: 1 }).trim().withMessage("Date of Birth is required.")
        .isISO8601().withMessage("Date of Birth is invalid."),
    body("mobileNo")
        .isLength({ min: 1 }).trim().withMessage("Mobile No. is required."),
    body("nric")
        .isLength({ min: 1 }).trim().withMessage("NRIC is required."),

    // sanitize values
    sanitizeBody("*").trim().escape(),
    sanitizeBody("dateJoin").toDate(),
    sanitizeBody("dob").toDate(),

    // process request
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        const memberInput = new Member({
            nric: req.body.nric,
            dateJoin: req.body.dateJoin,
            createdBy: req.user.id,
            profile: {
                name: req.body.name,
                nameCh: req.body.nameCh,
                gender: req.body.gender,
                dob: req.body.dob
            },
            contact: {
                mobileNo: req.body.mobileNo,
                homeAddr: req.body.homeAddr
            },
            bank: {
                accNo: req.body.bankAccNo,
                bankName: req.body.bankName,
                bankAddr: req.body.bankAddr
            },
            social: {
                wechat: req.body.wechat
            },
            sponsor: {
                name: req.body.sponsorName,
                contactNo: req.body.sponsorContactNo,
                orgNo: req.body.sponsorOrg,
                teamNo: req.body.sponsorTeam
            },
            starterKit: {
                product: req.body.starterProduct,
                kitAmount: req.body.starterKitAmount
            }
        });

        if (errors.isEmpty()) {
            Member.findOne({ nric: req.body.nric }, (err, existingMember) => {
                if (err) { return next(err); }
                if (existingMember) {
                    req.flash("errors", { msg: "Member with the same NRIC already exists." });

                    async.parallel({
                        // get product options
                        products: function(callback) {
                            Product.find({ status: "A" })
                                .sort("productCode")
                                .exec(callback);
                        }
                    }, function(err, results) {
                        if (err) { return next(err); }

                        res.render("member/form", {
                            title: "Create Member 注册会员",
                            member: memberInput,
                            products: results.products
                        });

                    });
                } else {
                    memberInput.save((err, memberCreated) => {
                        if (err) { return next(err); }
                        req.flash("success", { msg: "New member created: " + memberCreated._id });
                        res.redirect("/members");
                    });
                }
            });
        } else {
            req.flash("errors", errors.array());

            async.parallel({
                // get product options
                products: function(callback) {
                    Product.find({ status: "A" })
                        .sort("productCode")
                        .exec(callback);
                }
            }, function(err, results) {
                if (err) { return next(err); }

                res.render("member/form", {
                    title: "Create Member 注册会员",
                    member: memberInput,
                    products: results.products
                });

            });
        }
    }
];

/**
 * GET /member/:id
 * View Member Detail page.
 */
export let getMemberDetail = (req: Request, res: Response, next: NextFunction) => {
    Member.findById(req.params.id)
    .populate("starterKit.product")
    .exec((err, memberDb) => {
        if (err) { return next(err); }
        if (memberDb) {
            res.render("member/detail", {
                title: "Member Detail 会员资料",
                member: memberDb,
                memberId: memberDb._id
            });
        } else {
            req.flash("errors", { msg: "Member not found." });
            res.redirect("/members");
        }
    });
};

/**
 * GET /member/:id/update
 * Update Member page.
 */
export let getMemberUpdate = (req: Request, res: Response, next: NextFunction) => {
    async.parallel({
        // get product options
        products: function(callback) {
            Product.find({ status: "A" })
                .sort("productCode")
                .exec(callback);
        },
        member: function(callback) {
            Member.findById(req.params.id)
                .exec(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }

        if (!results.member) {
            req.flash("errors", { msg: "Member not found." });
            res.redirect("/members");
        }

        const memberDb = <MemberModel>results.member;

        res.render("member/form", {
            title: "Edit Member Detail 会员资料编辑",
            member: memberDb,
            memberId: memberDb._id,
            products: results.products
        });

    });
};

/**
 * POST /member/:id/update
 * Update an existing Member.
 */
export let postMemberUpdate = [
    // validate values
    body("dateJoin")
        .isLength({ min: 1 }).trim().withMessage("Date Join is required.")
        .isISO8601().withMessage("Date Join is invalid."),
    body("nameCh")
        .isLength({ min: 1 }).trim().withMessage("Name CH is required."),
    body("name")
        .isLength({ min: 1 }).trim().withMessage("Name EN is required."),
    body("dob")
        .isLength({ min: 1 }).trim().withMessage("Date of Birth is required.")
        .isISO8601().withMessage("Date of Birth is invalid."),
    body("mobileNo")
        .isLength({ min: 1 }).trim().withMessage("Mobile No. is required."),
    body("nric")
        .isLength({ min: 1 }).trim().withMessage("NRIC is required."),

    // sanitize values
    sanitizeBody("*").trim().escape(),
    sanitizeBody("dateJoin").toDate(),
    sanitizeBody("dob").toDate(),

    // process request
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        const memberInput = new Member({
            nric: req.body.nric,
            dateJoin: req.body.dateJoin,
            createdBy: req.user.id,
            profile: {
                name: req.body.name,
                nameCh: req.body.nameCh,
                gender: req.body.gender,
                dob: req.body.dob
            },
            contact: {
                mobileNo: req.body.mobileNo,
                homeAddr: req.body.homeAddr
            },
            bank: {
                accNo: req.body.bankAccNo,
                bankName: req.body.bankName,
                bankAddr: req.body.bankAddr
            },
            social: {
                wechat: req.body.wechat
            },
            sponsor: {
                name: req.body.sponsorName,
                contactNo: req.body.sponsorContactNo,
                orgNo: req.body.sponsorOrg,
                teamNo: req.body.sponsorTeam
            },
            starterKit: {
                product: req.body.starterProduct,
                kitAmount: req.body.starterKitAmount
            },
            _id: req.params.id,
            updatedBy: req.user.id
        });

        if (errors.isEmpty()) {
            Member.findById(req.params.id, (err, targetMember) => {
                if (err) { return next(err); }

                if (!targetMember) {
                    req.flash("errors", { msg: "Member not found." });
                    res.redirect("/members");
                }

                // check if nric already used for other Member records
                Member.findOne({ nric: req.body.nric }, (err, otherMemberWithSameNric) => {
                    if (err) { return next(err); }
                    if (otherMemberWithSameNric._id !== targetMember._id) {
                        req.flash("errors", { msg: "Other Member with the same NRIC already exists." });

                        async.parallel({
                            // get product options
                            products: function(callback) {
                                Product.find({ status: "A" })
                                    .sort("productCode")
                                    .exec(callback);
                            }
                        }, function(err, results) {
                            if (err) { return next(err); }

                            res.render("member/form", {
                                title: "Edit Member Detail 会员资料编辑",
                                member: memberInput,
                                products: results.products
                            });

                        });
                    } else {
                        Member.findByIdAndUpdate(req.params.id, memberInput, (err, memberUpdated: MemberModel) => {
                            if (err) { return next(err); }
                            req.flash("success", { msg: "Member successfully updated." });
                            res.redirect(memberUpdated.url);
                        });
                    }
                });
            });
        } else {
            req.flash("errors", errors.array());

            async.parallel({
                // get product options
                products: function(callback) {
                    Product.find({ status: "A" })
                        .sort("productCode")
                        .exec(callback);
                }
            }, function(err, results) {
                if (err) { return next(err); }

                res.render("member/form", {
                    title: "Edit Member Detail 会员资料编辑",
                    member: memberInput,
                    memberId: memberInput._id,
                    products: results.products
                });

            });
        }
    }
];
