import moment from "moment";
import path from "path";
import { Request, Response, NextFunction } from "express";

import { validationResult, query } from "express-validator/check";
import { sanitizeQuery } from "express-validator/filter";

import * as Excel from "exceljs";

import { default as Member, MemberModel } from "../models/Member";
import { ROOT_DIR } from "../app";

/**
 * GET /report/members
 * Display Report Filter: Member List.
 */
export let getMembers = (req: Request, res: Response, next: NextFunction) => {
  const dateJoinFrom = moment().subtract(7, "days").format("YYYY-MM-DD");
  const dateJoinTo = moment().format("YYYY-MM-DD");

  // client side script
  const includeScripts = ["/js/report/members.js"];

  res.render("report/members", {
    title: "Report",
    title2: "Report: Agent List",
    dateJoinFrom: dateJoinFrom,
    dateJoinTo: dateJoinTo,
    includeScripts: includeScripts
  });
};

/**
 * GET /report/members/download
 * Generate and download Report: Member List
 */
export let getMembersDownload = [
  // validate values
  query("dateJoinFrom")
    .isLength({ min: 1 }).trim().withMessage("Date Join From is required.")
    .isISO8601().withMessage("Date Join From is invalid."),
  query("dateJoinTo")
    .isLength({ min: 1 }).trim().withMessage("Date Join To is required.")
    .isISO8601().withMessage("Date Join To is invalid."),

  // sanitize values
  sanitizeQuery("*").trim().escape(),
  sanitizeQuery("dateJoinFrom").toDate(),
  sanitizeQuery("dateJoinTo").toDate(),

  // process request
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    const dateJoinFrom = req.query.dateJoinFrom;
    const dateJoinTo = req.query.dateJoinTo;

    if (errors.isEmpty()) {
      const query = Member.find();
      query.populate("starterKit.product");
      query.select({
          _id: 1, dateJoin: 1, nric: 1,
          "contact.mobileNo": 1, "profile.name": 1, "profile.nameCh": 1,
          createdAt: 1, "starterKit.product.productCode": 1
      });
      query.where("dateJoin").gte(dateJoinFrom);
      query.where("dateJoin").lte(dateJoinTo);
      query.sort([["dateJoin", "ascending"], ["nric", "ascending"]]);

      const fileName = "rpt_agentList_" + moment().format("YYYYMMDD") + ".xlsx";
      const tmpFileName = path.join(ROOT_DIR, "/" + "tmp_agentList_" + moment() + ".xlsx");

      const reportOptions = {
          fileName: tmpFileName,
          // stream: res,
          sheetName: "agents",
          title: "Tunas IOT - Agent List",
          filterDesc: "Date Join: " + moment(dateJoinFrom).format("YYYY-MM-DD") + " - " + moment(dateJoinTo).format("YYYY-MM-DD"),
          columnHeaders: {
              A: { label: "Agent Id", width: 20, align: "left" as ExcelAlign },
              B: { label: "RDW", width: 10, align: "center" as ExcelAlign },
              C: { label: "Date Join", width: 15, align: "center" as ExcelAlign },
              D: { label: "NRIC", width: 20, align: "left" as ExcelAlign },
              E: { label: "Mobile No.", width: 20, align: "center" as ExcelAlign },
              F: { label: "Name EN", width: 25, align: "left" as ExcelAlign },
              G: { label: "Name CH", width: 10, align: "center" as ExcelAlign },
              H: { label: "Create Date", width: 25, align: "center" as ExcelAlign },
          }
      };

      const wb = initExcelFile(reportOptions);

      query.batchSize(5000);

      // use batched find()
      query.exec(function (err, item_list) {
        if (err) {
          return console.error(err);
        }

        // Report data
        if (item_list) {
          for (const member of item_list as MemberModel[]) {
            const rowValues = [];
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
            rowValues[i++] = moment(member.createdAt).format("YYYY-MM-DD HH:mm");

            const sheet = wb.getWorksheet("agents");
            sheet.addRow(rowValues).commit();
          }
        }

        const sheet = wb.getWorksheet("agents");
        sheet.commit();

        wb.commit()
          .then(function () {
            res.sendFile(tmpFileName, {
              headers: {
                "Content-Disposition": `attachment; filename="${fileName}"`
              }
            }, function (err: Error) {
              if (err) console.log(err);

              require("fs").unlink(tmpFileName, function (err: Error) {
                if (err) console.log(err);
              });
            });
          });
      });

    } else {
      req.flash("errors", errors.array());

      // client side script
      const includeScripts = ["/js/report/members.js"];

      res.render("report/members", {
        title: "Report",
        title2: "Report: Agent List",
        dateJoinFrom: dateJoinFrom,
        dateJoinTo: dateJoinTo,
        includeScripts: includeScripts
      });

    }
  }
];

type ExcelAlign = "fill" | "left" | "center" | "right" | "justify" | "centerContinuous" | "distributed";

interface ColumnHeader {
  label: string;
  width: number;
  align: ExcelAlign;
}

interface ColumnHeaders {
  [propname: string]: ColumnHeader;
}

interface ReportOptions {
  fileName?: string;
  stream?: any;
  sheetName: string;
  title: string;
  filterDesc: string;
  columnHeaders: ColumnHeaders;
}

function initExcelFile(reportOptions: ReportOptions) {
  const excelOptions = {
      useStyles: true
  } as Partial<Excel.stream.xlsx.WorkbookWriterOptions>;

  if (reportOptions.stream) {
    excelOptions.stream = reportOptions.stream;
  } else {
    excelOptions.filename = reportOptions.fileName;
  }

  const wb = new Excel.stream.xlsx.WorkbookWriter(excelOptions);

  const sheet = wb.addWorksheet(reportOptions.sheetName);

  sheet.pageSetup.printTitlesRow = "1:4";
  sheet.autoFilter = "A4:H4";

  // Report headers
  sheet.mergeCells("A1:H1");
  sheet.getCell("A1").font = { size: 14, bold: true };
  sheet.getCell("A1").value = reportOptions.title;

  sheet.mergeCells("A2:D2");
  sheet.getCell("A2").value = reportOptions.filterDesc;
  sheet.getCell("A2").font = { bold: true };

  sheet.mergeCells("E2:H2");
  sheet.getCell("E2").value = "Print Date: " + moment().format("YYYY-MM-DD HH:mm");
  sheet.getCell("E2").font = { bold: true };

  sheet.addRow([]);

  const columnHeaders = reportOptions.columnHeaders;
  if (columnHeaders) {
      for (const key in columnHeaders) {
          sheet.getColumn(key).width = columnHeaders[key].width;
          sheet.getColumn(key).alignment = { horizontal: columnHeaders[key].align, wrapText: true, vertical: "top" };

          sheet.getCell(key + 4).value = columnHeaders[key].label;
          sheet.getCell(key + 4).font = { bold: true };
          sheet.getCell(key + 4).alignment = { horizontal: "center", wrapText: true };
          sheet.getCell(key + 4).fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {argb: "FFD8D8D8"}
          };
      }
  }

  sheet.getCell("A1").alignment = { horizontal: "center", wrapText: true };
  sheet.getCell("A2").alignment = { horizontal: "left", wrapText: true };
  sheet.getCell("E2").alignment = { horizontal: "right", wrapText: true };

  sheet.getRow(4).commit();

  return wb;
}