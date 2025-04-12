import express from 'express';


export const COLORS = {
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
    
}

export class HTTPError extends Error {
    status: number;

    constructor(status: number, message?: string) {
        super(message);
        this.status = status;

        Object.setPrototypeOf(this, HTTPError.prototype);
    }
}

export function getCookies(req: express.Request): {key: string, value: string}[] {
    var cookie = req.headers.cookie;
    var cookies = cookie ? cookie.split("; ") : [];
    var cookieObjs: {key: string, value: string}[] = [];

    cookies.forEach(cookieString => {
        let equalsPos = cookieString.indexOf("=");
        let key = cookieString.substring(0, equalsPos);
        let value = cookieString.substring(equalsPos + 1);
        cookieObjs.push({key: key, value: value});
    })
    return cookieObjs;
}

export enum StatusCodes {
    success = 200,
    ok = 200,
    created = 201,
    accepted = 202,
    noContent = 204,
    resetContent = 205,
    partialContent = 206,
    imUsed = 226,
    
    multipleChoices = 300,
    movedPermanently = 301,
    found = 302,
    seeOther = 303,
    notModified = 304,
    temporaryRedirect = 307,
    permanentRedirect = 308,
    
    badRequest = 400,
    unauthorized = 401,
    paymentRequired = 402,
    forbidden = 403,
    notFound = 404,
    methodNotAllowed = 405,
    notAcceptable = 406,
    requestTimeout = 408,
    conflict = 409,
    gone = 410,
    lengthRequired = 411,
    imATeapot = 418,
    tooManyRequests = 429,
    unavailableForLegalReasons = 451,
    internalServerError = 500,
    notImplemented = 501,
}