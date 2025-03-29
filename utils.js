"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLORS = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const format = winston_1.default.format.combine(winston_1.default.format(info => (Object.assign(Object.assign({}, info), { level: info.level.toUpperCase() })))(), winston_1.default.format.align(), winston_1.default.format.colorize(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.prettyPrint(), winston_1.default.format.simple(), winston_1.default.format.splat(), winston_1.default.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston_1.default.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`));
exports.logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(format, winston_1.default.format.uncolorize()),
    transports: [
        new winston_1.default.transports.File({ filename: 'errors.log', level: 'error' }),
        new winston_1.default.transports.File({ filename: 'logs.log', level: 'info' })
    ]
});
if (process.env.NODE_ENV !== "production") {
    exports.logger.add(new winston_1.default.transports.Console({
        format: format,
    }));
}
;
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
