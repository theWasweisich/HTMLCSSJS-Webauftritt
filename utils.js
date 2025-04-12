"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusCodes = exports.HTTPError = exports.COLORS = void 0;
exports.getCookies = getCookies;
exports.COLORS = {
    Reset: "\x1b[0m",
    Bold: "\x1b[1m",
    Dim: "\x1b[2m",
    Underscore: "\x1b[4m",
    Blink: "\x1b[5m",
    Reverse: "\x1b[7m",
    Hidden: "\x1b[8m",
    FgBlack: "\x1b[30m",
    FgRed: "\x1b[31m",
    FgGreen: "\x1b[32m",
    FgYellow: "\x1b[33m",
    FgBlue: "\x1b[34m",
    FgMagenta: "\x1b[35m",
    FgCyan: "\x1b[36m",
    FgWhite: "\x1b[37m",
    FgGray: "\x1b[90m",
    BgBlack: "\x1b[40m",
    BgRed: "\x1b[41m",
    BgGreen: "\x1b[42m",
    BgYellow: "\x1b[43m",
    BgBlue: "\x1b[44m",
    BgMagenta: "\x1b[45m",
    BgCyan: "\x1b[46m",
    BgWhite: "\x1b[47m",
    BgGray: "\x1b[100m",
};
class HTTPError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
        Object.setPrototypeOf(this, HTTPError.prototype);
    }
}
exports.HTTPError = HTTPError;
function getCookies(req) {
    var cookie = req.headers.cookie;
    var cookies = cookie ? cookie.split("; ") : [];
    var cookieObjs = [];
    cookies.forEach(cookieString => {
        let equalsPos = cookieString.indexOf("=");
        let key = cookieString.substring(0, equalsPos);
        let value = cookieString.substring(equalsPos + 1);
        cookieObjs.push({ key: key, value: value });
    });
    return cookieObjs;
}
var StatusCodes;
(function (StatusCodes) {
    StatusCodes[StatusCodes["success"] = 200] = "success";
    StatusCodes[StatusCodes["ok"] = 200] = "ok";
    StatusCodes[StatusCodes["created"] = 201] = "created";
    StatusCodes[StatusCodes["accepted"] = 202] = "accepted";
    StatusCodes[StatusCodes["noContent"] = 204] = "noContent";
    StatusCodes[StatusCodes["resetContent"] = 205] = "resetContent";
    StatusCodes[StatusCodes["partialContent"] = 206] = "partialContent";
    StatusCodes[StatusCodes["imUsed"] = 226] = "imUsed";
    StatusCodes[StatusCodes["multipleChoices"] = 300] = "multipleChoices";
    StatusCodes[StatusCodes["movedPermanently"] = 301] = "movedPermanently";
    StatusCodes[StatusCodes["found"] = 302] = "found";
    StatusCodes[StatusCodes["seeOther"] = 303] = "seeOther";
    StatusCodes[StatusCodes["notModified"] = 304] = "notModified";
    StatusCodes[StatusCodes["temporaryRedirect"] = 307] = "temporaryRedirect";
    StatusCodes[StatusCodes["permanentRedirect"] = 308] = "permanentRedirect";
    StatusCodes[StatusCodes["badRequest"] = 400] = "badRequest";
    StatusCodes[StatusCodes["unauthorized"] = 401] = "unauthorized";
    StatusCodes[StatusCodes["paymentRequired"] = 402] = "paymentRequired";
    StatusCodes[StatusCodes["forbidden"] = 403] = "forbidden";
    StatusCodes[StatusCodes["notFound"] = 404] = "notFound";
    StatusCodes[StatusCodes["methodNotAllowed"] = 405] = "methodNotAllowed";
    StatusCodes[StatusCodes["notAcceptable"] = 406] = "notAcceptable";
    StatusCodes[StatusCodes["requestTimeout"] = 408] = "requestTimeout";
    StatusCodes[StatusCodes["conflict"] = 409] = "conflict";
    StatusCodes[StatusCodes["gone"] = 410] = "gone";
    StatusCodes[StatusCodes["lengthRequired"] = 411] = "lengthRequired";
    StatusCodes[StatusCodes["imATeapot"] = 418] = "imATeapot";
    StatusCodes[StatusCodes["tooManyRequests"] = 429] = "tooManyRequests";
    StatusCodes[StatusCodes["unavailableForLegalReasons"] = 451] = "unavailableForLegalReasons";
    StatusCodes[StatusCodes["internalServerError"] = 500] = "internalServerError";
    StatusCodes[StatusCodes["notImplemented"] = 501] = "notImplemented";
})(StatusCodes || (exports.StatusCodes = StatusCodes = {}));
