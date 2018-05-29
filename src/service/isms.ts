import * as request from "request-promise";
import { ISMS_BASE_URI, ISMS_UN, ISMS_PWD, ISMS_TEST_NO } from "../util/secrets";
import { MemberModel } from "../models/Member";

const baseUri = ISMS_BASE_URI;
const username = ISMS_UN;
const password = ISMS_PWD;
const testTargetNo = ISMS_TEST_NO;
const msgType = 2; // Unicode
const agreedTerm = "YES";
const timeout = 10000;

export function getBalance (): request.RequestPromise {
    const options = {
        uri: baseUri + "/isms_balance.php",
        qs: {
            un: username,
            pwd: password
        },
        timeout: timeout
    };

    return request.get(options);
}

function sendMsg (targetNo: string, msg: string): request.RequestPromise {
    // override target no for testing purpose
    if (ISMS_TEST_NO) {
        targetNo = ISMS_TEST_NO;
    }

    const options = {
        uri: baseUri + "/isms_send.php",
        qs: {
            un: username,
            pwd: password,
            dstno: targetNo,
            msg: msg,
            type: msgType,
            agreedterm: agreedTerm
        },
        timeout: timeout
    };

    return request.get(options);
}

export function notifyMemberId (targetNo: string, member: MemberModel): request.RequestPromise {
    return sendMsg(targetNo, member.notifyIdMsg);
    // return getBalance(); // for local testing only
}

export function isSuccess(response: string): boolean {
    if (response && response.startsWith("-")) {
        return false;
    } else {
        return true;
    }
}
